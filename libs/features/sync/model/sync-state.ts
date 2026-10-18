import { isSyncGameId, parsePlayerRecord, type SyncGameId } from "@entities/progress";
import { readStoredJson } from "@shared/lib";

const SYNC_STATE_KEY = "games.sync.state.v1";
const SYNC_STATE_VERSION = 1;
const PROFILE_ID_PATTERN = /^p[1-9]\d*$/;
const LINK_TIMESTAMP = "1970-01-01T00:00:00.000Z";

export interface PlayerLink {
  readonly playerId: string;
  readonly slot: number;
  readonly avatar: string;
}

export interface ProgressMeta {
  readonly revision: number;
  readonly clientUpdatedAt: string;
}

export interface SyncState {
  readonly version: typeof SYNC_STATE_VERSION;
  /** Local profile id (`p1`) to the server player that belongs to it. */
  readonly players: Readonly<Record<string, PlayerLink>>;
  /** Revision and last local timestamp per `profileId:gameId`. */
  readonly progress: Readonly<Record<string, ProgressMeta>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function progressKey(profileId: string, gameId: SyncGameId): string {
  return `${profileId}:${gameId}`;
}

function readLink(value: unknown): PlayerLink | null {
  if (!isRecord(value)) {
    return null;
  }
  const player = parsePlayerRecord({
    id: value.playerId,
    slot: value.slot,
    avatar: value.avatar,
    createdAt: LINK_TIMESTAMP,
  });
  return player ? { playerId: player.id, slot: player.slot, avatar: player.avatar } : null;
}

function readPlayers(value: unknown): Record<string, PlayerLink> | null {
  if (!isRecord(value)) {
    return null;
  }
  const players: Record<string, PlayerLink> = {};
  for (const [profileId, candidate] of Object.entries(value)) {
    if (!PROFILE_ID_PATTERN.test(profileId)) {
      return null;
    }
    const link = readLink(candidate);
    if (!link) {
      return null;
    }
    players[profileId] = link;
  }
  return players;
}

function readMeta(value: unknown): ProgressMeta | null {
  if (
    !isRecord(value) ||
    typeof value.revision !== "number" ||
    !Number.isInteger(value.revision) ||
    value.revision < 0 ||
    typeof value.clientUpdatedAt !== "string"
  ) {
    return null;
  }
  return { revision: value.revision, clientUpdatedAt: value.clientUpdatedAt };
}

function readProgress(value: unknown): Record<string, ProgressMeta> | null {
  if (!isRecord(value)) {
    return null;
  }
  const progress: Record<string, ProgressMeta> = {};
  for (const [key, candidate] of Object.entries(value)) {
    const [profileId, gameId, ...rest] = key.split(":");
    if (!profileId || !isSyncGameId(gameId) || rest.length > 0) {
      return null;
    }
    if (!PROFILE_ID_PATTERN.test(profileId)) {
      return null;
    }
    const meta = readMeta(candidate);
    if (!meta) {
      return null;
    }
    progress[key] = meta;
  }
  return progress;
}

function readState(value: unknown): SyncState | null {
  if (!isRecord(value) || value.version !== SYNC_STATE_VERSION) {
    return null;
  }

  const players = readPlayers(value.players);
  const progress = readProgress(value.progress);
  if (!players || !progress) {
    return null;
  }
  return { version: SYNC_STATE_VERSION, players, progress };
}

export function loadSyncState(): SyncState {
  return (
    readState(readStoredJson(SYNC_STATE_KEY)) ?? {
      version: SYNC_STATE_VERSION,
      players: {},
      progress: {},
    }
  );
}

export function saveSyncState(state: SyncState): void {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable; sync simply starts from an empty state.
  }
}
