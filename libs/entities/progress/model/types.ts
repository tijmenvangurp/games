/** Version of the envelope and of the data that the client understands. */
export const PROGRESS_SCHEMA_VERSION = 1;

/**
 * Games that sync a small, conflict-friendly slice of their state. Active
 * boards, word-search grids and SRS state deliberately stay local.
 */
const SYNC_GAME_IDS = ["memory", "math", "pokemon-quiz", "seek", "arrows"] as const;

export type SyncGameId = (typeof SYNC_GAME_IDS)[number];

export function isSyncGameId(value: unknown): value is SyncGameId {
  return typeof value === "string" && (SYNC_GAME_IDS as readonly string[]).includes(value);
}

/** A primitive setting value; objects and arrays are never synced. */
export type SyncableSetting = string | number | boolean;

/**
 * The only game data that the sync layer understands. Every game maps its
 * local state to this shape; the server treats it as an opaque JSON object.
 */
export interface SyncableProgress {
  readonly settings?: Readonly<Record<string, SyncableSetting>>;
  /** Best score per key (for example `keer:moeilijk`). Merged with `max`. */
  readonly best?: Readonly<Record<string, number>>;
  /** Number of unlocked levels. Merged with `max`. */
  readonly unlocked?: number;
}

/** A progress document as stored by the server. */
export interface ProgressDocument {
  readonly gameId: string;
  readonly schemaVersion: number;
  readonly revision: number;
  readonly data: SyncableProgress;
  readonly clientUpdatedAt: string;
  readonly serverUpdatedAt: string;
}

/**
 * The part of a document that participates in a merge. The sync engine uses it
 * for both the server document and the local snapshot.
 */
export interface ProgressVersion {
  readonly schemaVersion: number;
  readonly revision: number;
  readonly data: SyncableProgress;
  readonly clientUpdatedAt: string;
}

export interface PlayerRecord {
  readonly id: string;
  readonly slot: number;
  readonly avatar: string;
  readonly createdAt: string;
}

export interface PlayerListResponse {
  readonly players: readonly PlayerRecord[];
}

export interface ProgressListResponse {
  readonly progress: readonly ProgressDocument[];
}
