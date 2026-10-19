import { createInitialProfileState, parseProfileState, type Profile } from "@entities/profile";
import {
  isSyncGameId,
  mergeProgressData,
  parseSyncableProgress,
  progressDataEquals,
  PROGRESS_SCHEMA_VERSION,
  type ProgressDocument,
  type ProgressVersion,
  type SyncableProgress,
  type SyncGameId,
} from "@entities/progress";
import {
  ACCOUNT_CHANGED_EVENT,
  getProgressAdapter,
  isProfileId,
  PROFILE_STORAGE_KEY,
  readActiveProfileId,
  readStoredJson,
  subscribeProfilesChanged,
  subscribeProgressChanges,
  withSuppressedProgressEvents,
} from "@shared/lib";
import { createProgressApi, ProgressApiError, type ProgressApi } from "./api";
import {
  enqueueOutbox,
  findOutboxEntry,
  readOutbox,
  removeOutboxEntry,
  removeOutboxForProfile,
  replaceOutboxEntry,
  type OutboxEntry,
} from "./outbox";
import {
  getProfileSyncEnabled,
  loadSyncState,
  progressKey,
  saveSyncState,
  setProfileSyncEnabledState,
  type PlayerLink,
  type ProgressMeta,
  type SyncState,
} from "./sync-state";

/** Client timestamp for a local snapshot that predates sync metadata. */
const LOCAL_UNKNOWN_TIMESTAMP = "1970-01-01T00:00:00.000Z";
const DEFAULT_DEBOUNCE_MS = 1500;
const DEFAULT_RETRY_BASE_MS = 1000;
const DEFAULT_RETRY_MAX_MS = 30_000;
const MAX_CONFLICT_ROUNDS = 5;
const HYDRATE_THROTTLE_MS = 30_000;
const PROFILE_SLOT_PATTERN = /^p([1-9]\d*)$/;

export interface ProgressSyncOptions {
  readonly api?: ProgressApi;
  readonly now?: () => Date;
  readonly createIdempotencyKey?: () => string;
  readonly debounceMs?: number;
  readonly retryBaseMs?: number;
  readonly retryMaxMs?: number;
}

interface EngineConfig {
  readonly api: ProgressApi;
  readonly now: () => Date;
  readonly createIdempotencyKey: () => string;
  readonly debounceMs: number;
  readonly retryBaseMs: number;
  readonly retryMaxMs: number;
}

interface PendingChange {
  readonly profileId: string;
  readonly gameId: SyncGameId;
  readonly data: SyncableProgress;
  readonly clientUpdatedAt: string;
}

function defaultIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

const defaultConfig: EngineConfig = {
  api: createProgressApi(),
  now: () => new Date(),
  createIdempotencyKey: defaultIdempotencyKey,
  debounceMs: DEFAULT_DEBOUNCE_MS,
  retryBaseMs: DEFAULT_RETRY_BASE_MS,
  retryMaxMs: DEFAULT_RETRY_MAX_MS,
};

let config: EngineConfig = defaultConfig;
let started = false;
let sessionActive = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryAttempt = 0;
let lastHydrateAttempt = 0;
let hydrating: Promise<void> | null = null;
let flushing: Promise<void> | null = null;
let flushRequested = false;
let unsubscribers: Array<() => void> = [];
const pending = new Map<string, PendingChange>();

function slotForProfile(profileId: string): number | null {
  const match = PROFILE_SLOT_PATTERN.exec(profileId);
  return match?.[1] ? Number(match[1]) : null;
}

function localProfiles(): readonly Profile[] {
  const parsed = parseProfileState(readStoredJson(PROFILE_STORAGE_KEY));
  return parsed?.profiles ?? createInitialProfileState().profiles;
}

function latestTimestamp(meta: ProgressMeta | undefined, server: string): string {
  if (!meta) {
    return server;
  }
  const localTime = Date.parse(meta.clientUpdatedAt);
  const serverTime = Date.parse(server);
  return serverTime > localTime ? server : meta.clientUpdatedAt;
}

function activeProfileId(): string {
  const profileId = readActiveProfileId();
  return isProfileId(profileId) ? profileId : "p1";
}

/**
 * The explicit opt-in flag. Absent (default) counts as off, so a fresh
 * account syncs nothing until the parent turns a profile on.
 */
function isSyncEnabled(profileId: string): boolean {
  return getProfileSyncEnabled(loadSyncState(), profileId);
}

function writeMeta(
  profileId: string,
  gameId: SyncGameId,
  revision: number,
  clientUpdatedAt: string,
): void {
  const state = loadSyncState();
  saveSyncState({
    ...state,
    progress: {
      ...state.progress,
      [progressKey(profileId, gameId)]: { revision, clientUpdatedAt },
    },
  });
}

function applyLocal(profileId: string, gameId: SyncGameId, data: SyncableProgress): void {
  const adapter = getProgressAdapter(gameId);
  if (!adapter) {
    return;
  }
  withSuppressedProgressEvents(() => adapter.apply(profileId, data));
}

async function ensurePlayerLinks(profiles: readonly Profile[]): Promise<SyncState> {
  const state = loadSyncState();
  // Explicit opt-in: without an enabled profile the API is never touched and
  // no server player is created, so a fresh account really starts empty.
  const syncable = profiles.filter((profile) => isSyncEnabled(profile.id));
  if (syncable.length === 0) {
    return state;
  }

  const players = await config.api.listPlayers();
  const bySlot = new Map(players.map((player) => [player.slot, player] as const));
  const existing = new Set(profiles.map((profile) => profile.id));
  const links: Record<string, PlayerLink> = {};
  for (const [profileId, link] of Object.entries(state.players)) {
    if (existing.has(profileId)) {
      links[profileId] = link;
    }
  }

  for (const profile of syncable) {
    const slot = slotForProfile(profile.id);
    if (slot === null) {
      continue;
    }

    const player = bySlot.get(slot);
    if (player) {
      links[profile.id] = { playerId: player.id, slot: player.slot, avatar: player.avatar };
      continue;
    }

    const previous = state.players[profile.id];
    const created = await config.api.createPlayer({ slot, avatar: profile.avatar });
    if (created) {
      links[profile.id] = { playerId: created.id, slot: created.slot, avatar: created.avatar };
    } else if (previous && players.some((candidate) => candidate.id === previous.playerId)) {
      links[profile.id] = previous;
    }
  }

  const next: SyncState = {
    version: state.version,
    players: links,
    progress: state.progress,
    syncEnabled: state.syncEnabled,
  };
  saveSyncState(next);
  return next;
}

function enqueueMergedProgress(
  profileId: string,
  playerId: string,
  gameId: SyncGameId,
  document: ProgressDocument,
  merged: SyncableProgress,
): void {
  const now = config.now().toISOString();
  enqueueOutbox({
    profileId,
    playerId,
    gameId,
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    baseRevision: document.revision,
    clientUpdatedAt: now,
    data: merged,
  });
  writeMeta(profileId, gameId, document.revision, now);
}

function localVersion(meta: ProgressMeta | undefined, data: SyncableProgress): ProgressVersion {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    revision: meta ? meta.revision : 0,
    clientUpdatedAt: meta ? meta.clientUpdatedAt : LOCAL_UNKNOWN_TIMESTAMP,
    data,
  };
}

function applyRemoteDocument(
  profileId: string,
  playerId: string,
  document: ProgressDocument,
): void {
  if (!isSyncGameId(document.gameId)) {
    return;
  }
  const gameId = document.gameId;
  const adapter = getProgressAdapter(gameId);
  if (!adapter) {
    return;
  }

  const meta = loadSyncState().progress[progressKey(profileId, gameId)];
  const parsedLocal = parseSyncableProgress(adapter.read(profileId));
  const localData = parsedLocal ? parsedLocal : {};
  const merged = mergeProgressData(localVersion(meta, localData), document);

  if (!parsedLocal || !progressDataEquals(merged, localData)) {
    applyLocal(profileId, gameId, merged);
  }

  if (!progressDataEquals(merged, document.data)) {
    enqueueMergedProgress(profileId, playerId, gameId, document, merged);
    return;
  }

  writeMeta(profileId, gameId, document.revision, latestTimestamp(meta, document.clientUpdatedAt));
}

async function runHydration(): Promise<void> {
  try {
    if (!(await config.api.hasSession())) {
      sessionActive = false;
      return;
    }
    sessionActive = true;

    const profiles = localProfiles();
    const state = await ensurePlayerLinks(profiles);

    for (const profile of profiles) {
      if (!isSyncEnabled(profile.id)) {
        continue;
      }
      const link = state.players[profile.id];
      if (!link) {
        continue;
      }

      let documents: readonly ProgressDocument[];
      try {
        documents = await config.api.fetchProgress(link.playerId);
      } catch (error) {
        if (error instanceof ProgressApiError && error.status === 401) {
          sessionActive = false;
        }
        continue;
      }

      for (const document of documents) {
        applyRemoteDocument(profile.id, link.playerId, document);
      }
    }

    await flushProgressOutbox();
  } catch {
    // Offline, an unavailable Worker or a missing D1 table must never block
    // the local game. The outbox keeps pending work for the next attempt.
  }
}

/**
 * Reads the server state, maps local profiles to server players, merges the
 * result into the local stores and flushes anything still in the outbox.
 * Safe to call on start, on login and when the tab becomes visible again.
 */
export function hydrateProgress(): Promise<void> {
  if (hydrating) {
    return hydrating;
  }
  lastHydrateAttempt = Date.now();
  hydrating = runHydration().finally(() => {
    hydrating = null;
  });
  return hydrating;
}

function scheduleRetry(): void {
  if (retryTimer) {
    return;
  }
  const delay = Math.min(config.retryMaxMs, config.retryBaseMs * 2 ** retryAttempt);
  retryAttempt += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void flushProgressOutbox();
  }, delay);
}

function removeIfUnchanged(entry: OutboxEntry): void {
  const current = findOutboxEntry(readOutbox(), `${entry.profileId}:${entry.gameId}`);
  if (
    current &&
    current.clientUpdatedAt === entry.clientUpdatedAt &&
    progressDataEquals(current.data, entry.data)
  ) {
    removeOutboxEntry(entry);
  }
}

function mergeConflict(current: OutboxEntry, remote: ProgressDocument): OutboxEntry {
  const merged = mergeProgressData(
    {
      schemaVersion: current.schemaVersion,
      revision: current.baseRevision,
      clientUpdatedAt: current.clientUpdatedAt,
      data: current.data,
    },
    remote,
  );
  applyLocal(current.profileId, current.gameId, merged);

  const next: OutboxEntry = {
    ...current,
    baseRevision: remote.revision,
    clientUpdatedAt: config.now().toISOString(),
    data: merged,
  };
  replaceOutboxEntry(next);
  writeMeta(next.profileId, next.gameId, remote.revision, next.clientUpdatedAt);
  return next;
}

const UNRECOVERABLE_STATUSES = new Set([400, 404, 422]);
const SESSION_STATUSES = new Set([401, 403]);

/** Maps a push error to an outcome, or `null` when a retry makes sense. */
function handlePushError(error: unknown, entry: OutboxEntry): "done" | "stop" | null {
  if (!(error instanceof ProgressApiError)) {
    return null;
  }
  if (UNRECOVERABLE_STATUSES.has(error.status)) {
    // The document or player is gone or cannot be understood; retrying
    // forever would only grow the outbox.
    removeOutboxEntry(entry);
    return "done";
  }
  if (SESSION_STATUSES.has(error.status)) {
    sessionActive = false;
    return "stop";
  }
  return null;
}

async function pushOne(
  entry: OutboxEntry,
  options: { readonly keepalive?: boolean },
): Promise<"done" | "stop"> {
  let current = entry;

  try {
    for (let round = 0; round < MAX_CONFLICT_ROUNDS; round += 1) {
      const result = await config.api.pushProgress(
        { ...current, idempotencyKey: config.createIdempotencyKey() },
        options,
      );

      if (result.kind === "ok") {
        const revision = result.document?.revision ?? current.baseRevision + 1;
        writeMeta(current.profileId, current.gameId, revision, current.clientUpdatedAt);
        removeIfUnchanged(current);
        return "done";
      }

      current = mergeConflict(current, result.document);
    }

    scheduleRetry();
    return "stop";
  } catch (error) {
    const outcome = handlePushError(error, current);
    if (outcome) {
      return outcome;
    }
    scheduleRetry();
    return "stop";
  }
}

async function runFlush(options: { readonly keepalive?: boolean }): Promise<void> {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  try {
    if (!(await config.api.hasSession())) {
      sessionActive = false;
      return;
    }
    sessionActive = true;

    for (const entry of readOutbox()) {
      // Defensive second gate on the opt-in flag: an entry a race left behind
      // must never upload silently after the parent turned sync off.
      if (!isSyncEnabled(entry.profileId)) {
        continue;
      }
      const outcome = await pushOne(entry, options);
      if (outcome === "stop") {
        return;
      }
    }
    retryAttempt = 0;
  } catch {
    scheduleRetry();
  }
}

/**
 * Uploads the outbox with a single in-flight request. A call while a flush is
 * running schedules exactly one extra pass, so a quick local change is never
 * lost or uploaded twice.
 */
export function flushProgressOutbox(options: { readonly keepalive?: boolean } = {}): Promise<void> {
  if (flushing) {
    flushRequested = true;
    return flushing;
  }

  flushing = runFlush(options).finally(() => {
    flushing = null;
    if (flushRequested) {
      flushRequested = false;
      void flushProgressOutbox();
    }
  });
  return flushing;
}

function createOutboxEntry(change: PendingChange): OutboxEntry | null {
  const state = loadSyncState();
  const link = state.players[change.profileId];
  if (!link) {
    return null;
  }

  const key = progressKey(change.profileId, change.gameId);
  const pendingEntry = findOutboxEntry(readOutbox(), key);
  return {
    profileId: change.profileId,
    playerId: link.playerId,
    gameId: change.gameId,
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    baseRevision: state.progress[key]?.revision ?? pendingEntry?.baseRevision ?? 0,
    clientUpdatedAt: change.clientUpdatedAt,
    data: change.data,
  };
}

function commitPending(): void {
  if (!sessionActive || pending.size === 0) {
    pending.clear();
    return;
  }

  const changes = [...pending.values()];
  pending.clear();

  for (const change of changes) {
    const entry = createOutboxEntry(change);
    if (entry) {
      enqueueOutbox(entry);
    }
  }

  void flushProgressOutbox();
}

function flushPendingNow(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  commitPending();
}

function noteLocalProgressChange(gameId: string): void {
  if (!started || !isSyncGameId(gameId)) {
    return;
  }
  const adapter = getProgressAdapter(gameId);
  if (!adapter) {
    return;
  }

  const profileId = activeProfileId();
  const parsed = parseSyncableProgress(adapter.read(profileId));
  if (!parsed) {
    return;
  }

  const key = progressKey(profileId, gameId);
  const now = config.now().toISOString();
  const meta = loadSyncState().progress[key];
  // Remember the timestamp even without a session or opt-in, so a later
  // enable can tell whether the local setting is newer than the server copy.
  writeMeta(profileId, gameId, meta ? meta.revision : 0, now);

  if (!sessionActive || !isSyncEnabled(profileId)) {
    return;
  }

  const previous = pending.get(key);
  const data = previous
    ? mergeProgressData(
        {
          schemaVersion: PROGRESS_SCHEMA_VERSION,
          revision: 0,
          clientUpdatedAt: previous.clientUpdatedAt,
          data: previous.data,
        },
        {
          schemaVersion: PROGRESS_SCHEMA_VERSION,
          revision: 0,
          clientUpdatedAt: now,
          data: parsed,
        },
      )
    : parsed;

  pending.set(key, { profileId, gameId, data, clientUpdatedAt: now });

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    commitPending();
  }, config.debounceMs);
}

function onVisibilityChange(): void {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    flushPendingNow();
    void flushProgressOutbox({ keepalive: true });
    return;
  }
  void hydrateProgress();
}

function onPageHide(): void {
  flushPendingNow();
  void flushProgressOutbox({ keepalive: true });
}

function onOnline(): void {
  void hydrateProgress();
}

function onFocus(): void {
  if (Date.now() - lastHydrateAttempt < HYDRATE_THROTTLE_MS) {
    return;
  }
  void hydrateProgress();
}

function onAccountChanged(): void {
  lastHydrateAttempt = 0;
  void hydrateProgress();
}

function onProfilesChanged(): void {
  lastHydrateAttempt = 0;
  void hydrateProgress();
}

/**
 * The explicit opt-in flag for one profile, read from the persisted sync
 * state. The account page uses it to render the current toggle; absent
 * counts as off.
 */
export function isProfileSyncEnabled(profileId: string): boolean {
  return isSyncEnabled(profileId);
}

/**
 * Explicit per-profile opt-in. Enabling persists the flag and hydrates
 * immediately, which may create the server player for that slot, pull the
 * server state and queue the merged result. Disabling removes the flag
 * together with everything that could still upload for that profile, so a
 * turned-off profile never syncs again. Without a session the toggle still
 * persists locally and the games keep working unchanged.
 */
export function setProfileSyncEnabled(profileId: string, enabled: boolean): Promise<void> {
  if (!isProfileId(profileId)) {
    return Promise.resolve();
  }

  const state = loadSyncState();
  saveSyncState(setProfileSyncEnabledState(state, profileId, enabled));

  if (!enabled) {
    removeOutboxForProfile(profileId);
    for (const [key, change] of [...pending]) {
      if (change.profileId === profileId) {
        pending.delete(key);
      }
    }
    return Promise.resolve();
  }

  lastHydrateAttempt = 0;
  return hydrateProgress();
}

/**
 * Starts the listener set and the first hydration. Call once from the app
 * entry point. Without a session every call is a cheap no-op and the local
 * games keep working exactly as before.
 */
export function startProgressSync(options: ProgressSyncOptions = {}): void {
  config = {
    api: options.api ?? defaultConfig.api,
    now: options.now ?? defaultConfig.now,
    createIdempotencyKey: options.createIdempotencyKey ?? defaultConfig.createIdempotencyKey,
    debounceMs: options.debounceMs ?? defaultConfig.debounceMs,
    retryBaseMs: options.retryBaseMs ?? defaultConfig.retryBaseMs,
    retryMaxMs: options.retryMaxMs ?? defaultConfig.retryMaxMs,
  };

  if (started) {
    return;
  }
  started = true;

  unsubscribers = [
    subscribeProgressChanges(noteLocalProgressChange),
    subscribeProfilesChanged(onProfilesChanged),
  ];

  if (typeof window !== "undefined") {
    window.addEventListener("online", onOnline);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("focus", onFocus);
    window.addEventListener(ACCOUNT_CHANGED_EVENT, onAccountChanged);
  }
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  void hydrateProgress();
}

/** Removes listeners and timers; used by tests and on a full app teardown. */
export function stopProgressSync(): void {
  started = false;
  sessionActive = false;
  pending.clear();

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  retryAttempt = 0;
  flushRequested = false;
  lastHydrateAttempt = 0;

  for (const unsubscribe of unsubscribers) {
    unsubscribe();
  }
  unsubscribers = [];

  if (typeof window !== "undefined") {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener(ACCOUNT_CHANGED_EVENT, onAccountChanged);
  }
  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }
}
