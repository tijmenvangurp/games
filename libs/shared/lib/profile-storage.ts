import { notifyProgressChanged } from "./progress-bridge";
import { readStoredJson } from "./storage";

/**
 * Profile-aware localStorage keys.
 *
 * Profile 1 keeps the historical `games.<game>.v1` keys, so existing progress
 * is profile 1 without a copy or a risky migration. Extra profiles use
 * `games.p<id>.<game>.v1`. This helper is the single place that knows that
 * layout; game storage modules must not build keys themselves.
 */
export const PROFILE_STORAGE_KEY = "games.profiles.v1";
export const LEGACY_PROFILE_ID = "p1";

export const GAME_STORAGE_KEYS = {
  sudoku: "games.sudoku.v1",
  math: "games.math.v1",
  memory: "games.memory.v1",
  pokemonQuiz: "games.pokemon-quiz.v1",
  wordSearch: "games.word-search.v1",
  arrows: "games.arrows.v2",
  seek: "games.seek.v1",
  french: "games.french.v1",
} as const;

export type GameStorageKey = (typeof GAME_STORAGE_KEYS)[keyof typeof GAME_STORAGE_KEYS];

export const GAME_STORAGE_KEY_LIST: readonly GameStorageKey[] = Object.values(GAME_STORAGE_KEYS);

const PROFILE_ID_PATTERN = /^p[1-9]\d*$/;
const PROFILE_NAMESPACE_PATTERN = /^games\.p[1-9]\d*\./;

export function isProfileId(value: unknown): value is string {
  return typeof value === "string" && PROFILE_ID_PATTERN.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reads the active profile without importing the profile feature. If the
 * preference is missing or corrupt, profile 1 (the legacy keys) is the safe
 * default during the first start and during a rollback to the old app.
 */
export function readActiveProfileId(): string {
  const parsed = readStoredJson(PROFILE_STORAGE_KEY);
  if (isRecord(parsed) && isProfileId(parsed.activeProfileId)) {
    return parsed.activeProfileId;
  }
  return LEGACY_PROFILE_ID;
}

/**
 * Resolves a base game key for a profile. Profile 1 deliberately returns the
 * base key unchanged; only extra profiles get a namespace.
 */
export function profileStorageKey(
  baseKey: string,
  profileId: string = readActiveProfileId(),
): string {
  if (!isProfileId(profileId) || profileId === LEGACY_PROFILE_ID) {
    return baseKey;
  }
  const suffix = baseKey.startsWith("games.") ? baseKey.slice("games.".length) : baseKey;
  return `games.${profileId}.${suffix}`;
}

/** True for keys that belong to an extra profile namespace. */
export function isProfileNamespaceKey(key: string): boolean {
  return PROFILE_NAMESPACE_PATTERN.test(key);
}

/**
 * Writes a game snapshot for one profile and tells sync about the change.
 * Identical values are skipped, so merely opening a game never schedules an
 * upload. Failures are swallowed: private mode still plays.
 */
export function writeGameProgress(
  baseKey: string,
  gameId: string,
  value: unknown,
  profileId?: string,
): void {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }
    const key = profileStorageKey(baseKey, profileId);
    const raw = JSON.stringify(value);
    if (localStorage.getItem(key) === raw) {
      return;
    }
    localStorage.setItem(key, raw);
    notifyProgressChanged(gameId);
  } catch {
    // Storage may be unavailable; the in-memory game still works.
  }
}
