import { LEVEL_COUNT } from "@entities/gear";

/** Storage key shared by every version of the Draaiwerk progress shape. */
export const DRAAIWERK_STORAGE_KEY = "games.draaiwerk.v1";

/** Version of the persisted shape; `1` is the first Zustand `persist` format. */
export const DRAAIWERK_STORAGE_VERSION = 1;

export interface DraaiwerkProgress {
  /** Number of unlocked levels, 1 through LEVEL_COUNT. */
  unlocked: number;
  /** Index of the level the player last opened. */
  current: number;
  /** True once the final level has been solved. */
  finished: boolean;
}

export const DEFAULT_DRAAIWERK_PROGRESS: DraaiwerkProgress = {
  unlocked: 1,
  current: 0,
  finished: false,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Coerces untrusted storage input to a playable progress value. */
export function normalizeDraaiwerkProgress(value: unknown): DraaiwerkProgress {
  if (!isRecord(value) || typeof value.unlocked !== "number" || typeof value.current !== "number") {
    return DEFAULT_DRAAIWERK_PROGRESS;
  }

  const unlocked = clamp(Math.floor(value.unlocked), 1, Math.max(1, LEVEL_COUNT));
  const current = clamp(Math.floor(value.current), 0, unlocked - 1);
  const finished = value.finished === true;
  return { unlocked, current, finished };
}
