import {
  isSyncGameId,
  mergeProgressData,
  parseSyncableProgress,
  PROGRESS_SCHEMA_VERSION,
  type SyncableProgress,
  type SyncGameId,
} from "@entities/progress";
import { readStoredJson } from "@shared/lib";
import { progressKey } from "./sync-state";

const SYNC_OUTBOX_KEY = "games.sync.outbox.v1";
const OUTBOX_VERSION = 1;
const PROFILE_ID_PATTERN = /^p[1-9]\d*$/;
const PLAYER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * One merged snapshot per local profile and game. A newer local change folds
 * into the pending entry instead of creating a second upload.
 */
export interface OutboxEntry {
  readonly profileId: string;
  readonly playerId: string;
  readonly gameId: SyncGameId;
  readonly schemaVersion: number;
  readonly baseRevision: number;
  readonly clientUpdatedAt: string;
  readonly data: SyncableProgress;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProfileId(value: unknown): value is string {
  return typeof value === "string" && PROFILE_ID_PATTERN.test(value);
}

function isPlayerId(value: unknown): value is string {
  return typeof value === "string" && PLAYER_ID_PATTERN.test(value);
}

function hasValidIdentity(value: Record<string, unknown>): boolean {
  return isProfileId(value.profileId) && isPlayerId(value.playerId) && isSyncGameId(value.gameId);
}

function hasValidRevision(value: Record<string, unknown>): boolean {
  return (
    value.schemaVersion === PROGRESS_SCHEMA_VERSION &&
    typeof value.baseRevision === "number" &&
    Number.isInteger(value.baseRevision) &&
    value.baseRevision >= 0 &&
    typeof value.clientUpdatedAt === "string" &&
    value.clientUpdatedAt.length > 0
  );
}

function readEntry(value: unknown): OutboxEntry | null {
  if (!isRecord(value) || !hasValidIdentity(value) || !hasValidRevision(value)) {
    return null;
  }

  const data = parseSyncableProgress(value.data);
  if (!data) {
    return null;
  }

  return {
    profileId: value.profileId as string,
    playerId: value.playerId as string,
    gameId: value.gameId as SyncGameId,
    schemaVersion: value.schemaVersion as number,
    baseRevision: value.baseRevision as number,
    clientUpdatedAt: value.clientUpdatedAt as string,
    data,
  };
}

export function readOutbox(): OutboxEntry[] {
  const raw = readStoredJson(SYNC_OUTBOX_KEY);
  if (!isRecord(raw) || raw.version !== OUTBOX_VERSION || !Array.isArray(raw.entries)) {
    return [];
  }

  const entries: OutboxEntry[] = [];
  for (const candidate of raw.entries) {
    const entry = readEntry(candidate);
    if (entry) {
      entries.push(entry);
    }
  }
  return entries;
}

function writeOutbox(entries: readonly OutboxEntry[]): void {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(SYNC_OUTBOX_KEY, JSON.stringify({ version: OUTBOX_VERSION, entries }));
  } catch {
    // Storage may be unavailable; retrying later in this session still works.
  }
}

function entryKey(entry: Pick<OutboxEntry, "profileId" | "gameId">): string {
  return progressKey(entry.profileId, entry.gameId);
}

export function findOutboxEntry(
  entries: readonly OutboxEntry[],
  key: string,
): OutboxEntry | undefined {
  return entries.find((entry) => entryKey(entry) === key);
}

/**
 * Adds a local snapshot. If one is already pending for the same profile and
 * game, the two are merged with the same rules as a server conflict.
 */
export function enqueueOutbox(entry: OutboxEntry): readonly OutboxEntry[] {
  const entries = readOutbox();
  const key = entryKey(entry);
  const existing = findOutboxEntry(entries, key);
  if (!existing) {
    const next = [...entries, entry];
    writeOutbox(next);
    return next;
  }

  const merged = mergeProgressData(
    {
      schemaVersion: existing.schemaVersion,
      revision: existing.baseRevision,
      clientUpdatedAt: existing.clientUpdatedAt,
      data: existing.data,
    },
    {
      schemaVersion: entry.schemaVersion,
      revision: entry.baseRevision,
      clientUpdatedAt: entry.clientUpdatedAt,
      data: entry.data,
    },
  );

  const combined: OutboxEntry = {
    ...existing,
    playerId: entry.playerId,
    baseRevision: existing.baseRevision,
    clientUpdatedAt:
      entry.clientUpdatedAt > existing.clientUpdatedAt
        ? entry.clientUpdatedAt
        : existing.clientUpdatedAt,
    data: merged,
  };
  const next = entries.map((candidate) => (candidate === existing ? combined : candidate));
  writeOutbox(next);
  return next;
}

export function replaceOutboxEntry(entry: OutboxEntry): readonly OutboxEntry[] {
  const key = entryKey(entry);
  const next = readOutbox().map((candidate) => (entryKey(candidate) === key ? entry : candidate));
  writeOutbox(next);
  return next;
}

export function removeOutboxEntry(entry: Pick<OutboxEntry, "profileId" | "gameId">): void {
  const key = entryKey(entry);
  writeOutbox(readOutbox().filter((candidate) => entryKey(candidate) !== key));
}
