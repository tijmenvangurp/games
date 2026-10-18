import {
  PROGRESS_SCHEMA_VERSION,
  type PlayerListResponse,
  type PlayerRecord,
  type ProgressDocument,
  type ProgressListResponse,
  type SyncableProgress,
  type SyncableSetting,
} from "./types";

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const GAME_ID_PATTERN = /^[a-z0-9-]{1,32}$/;
const KEY_PATTERN = /^[a-zA-Z0-9:_-]{1,40}$/;
const MAX_SETTINGS = 16;
const MAX_BEST_ENTRIES = 64;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

function isSafeKey(key: string): boolean {
  return !FORBIDDEN_KEYS.has(key) && KEY_PATTERN.test(key);
}

function isSettingValue(value: unknown): value is SyncableSetting {
  return (
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function readSettings(value: unknown): Record<string, SyncableSetting> | null {
  if (!isRecord(value)) {
    return null;
  }
  const entries = Object.entries(value);
  if (entries.length > MAX_SETTINGS) {
    return null;
  }

  const settings: Record<string, SyncableSetting> = {};
  for (const [key, setting] of entries) {
    if (!isSafeKey(key) || !isSettingValue(setting)) {
      return null;
    }
    settings[key] = setting;
  }
  return settings;
}

function readBest(value: unknown): Record<string, number> | null {
  if (!isRecord(value)) {
    return null;
  }
  const entries = Object.entries(value);
  if (entries.length > MAX_BEST_ENTRIES) {
    return null;
  }

  const best: Record<string, number> = {};
  for (const [key, score] of entries) {
    if (!isSafeKey(key) || typeof score !== "number" || !Number.isInteger(score) || score < 0) {
      return null;
    }
    best[key] = score;
  }
  return best;
}

function readUnlocked(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

/**
 * Validates and normalises the syncable part of a game's state. Unknown keys
 * are ignored so a newer client can add fields without breaking older ones;
 * malformed known keys invalidate the whole payload.
 */
export function parseSyncableProgress(value: unknown): SyncableProgress | null {
  if (!isRecord(value)) {
    return null;
  }

  const result: {
    settings?: Record<string, SyncableSetting>;
    best?: Record<string, number>;
    unlocked?: number;
  } = {};

  if ("settings" in value && value.settings !== undefined) {
    const settings = readSettings(value.settings);
    if (!settings) {
      return null;
    }
    result.settings = settings;
  }

  if ("best" in value && value.best !== undefined) {
    const best = readBest(value.best);
    if (!best) {
      return null;
    }
    result.best = best;
  }

  if ("unlocked" in value && value.unlocked !== undefined) {
    const unlocked = readUnlocked(value.unlocked);
    if (!unlocked) {
      return null;
    }
    result.unlocked = unlocked;
  }

  return result;
}

function readTimestamp(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Parses one progress document from the server. */
export function parseProgressDocument(value: unknown): ProgressDocument | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.gameId !== "string" ||
    !GAME_ID_PATTERN.test(value.gameId) ||
    value.schemaVersion !== PROGRESS_SCHEMA_VERSION ||
    typeof value.revision !== "number" ||
    !Number.isInteger(value.revision) ||
    value.revision < 0
  ) {
    return null;
  }

  const clientUpdatedAt = readTimestamp(value.clientUpdatedAt);
  const serverUpdatedAt = readTimestamp(value.serverUpdatedAt);
  const data = parseSyncableProgress(value.data);
  if (!clientUpdatedAt || !serverUpdatedAt || !data) {
    return null;
  }

  return {
    gameId: value.gameId,
    schemaVersion: value.schemaVersion,
    revision: value.revision,
    data,
    clientUpdatedAt,
    serverUpdatedAt,
  };
}

export function parseProgressListResponse(value: unknown): ProgressListResponse | null {
  if (!isRecord(value) || !Array.isArray(value.progress)) {
    return null;
  }

  const progress: ProgressDocument[] = [];
  for (const candidate of value.progress) {
    const document = parseProgressDocument(candidate);
    if (!document) {
      return null;
    }
    progress.push(document);
  }
  return { progress };
}

export function parsePlayerRecord(value: unknown): PlayerRecord | null {
  if (!isRecord(value)) {
    return null;
  }
  const { id, slot, avatar, createdAt } = value;
  if (
    !isNonEmptyString(id, 64) ||
    !isIntegerInRange(slot, 1, 99) ||
    !isNonEmptyString(avatar, 32) ||
    !isNonEmptyString(createdAt, 64)
  ) {
    return null;
  }

  return { id, slot, avatar, createdAt };
}

export function parsePlayersResponse(value: unknown): PlayerListResponse | null {
  if (!isRecord(value) || !Array.isArray(value.players)) {
    return null;
  }

  const players: PlayerRecord[] = [];
  const slots = new Set<number>();
  for (const candidate of value.players) {
    const player = parsePlayerRecord(candidate);
    if (!player || slots.has(player.slot)) {
      return null;
    }
    slots.add(player.slot);
    players.push(player);
  }
  return { players };
}

/** Accepts `{ player }` from POST /api/players. */
export function parsePlayerResponse(value: unknown): PlayerRecord | null {
  if (!isRecord(value)) {
    return null;
  }
  return parsePlayerRecord(value.player);
}

/**
 * Accepts either `{ progress: document }` or a bare document, because a write
 * response and a conflict response have the same payload.
 */
export function parseProgressWriteResponse(value: unknown): ProgressDocument | null {
  if (isRecord(value) && "progress" in value) {
    return parseProgressDocument(value.progress);
  }
  return parseProgressDocument(value);
}
