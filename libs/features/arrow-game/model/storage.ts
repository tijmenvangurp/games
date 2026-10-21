import type { StateStorage } from "zustand/middleware";
import { LEVEL_COUNT } from "@entities/arrow";

/** Storage key shared by every version of the arrows progress shape. */
export const ARROWS_STORAGE_KEY = "games.arrows.v2";

/** Version of the persisted shape; `1` is the first Zustand `persist` format. */
export const ARROWS_STORAGE_VERSION = 1;

export interface ArrowsProgress {
  /** Number of unlocked levels, 1 through LEVEL_COUNT. */
  unlocked: number;
  /** Index of the level shown on the intro screen. */
  current: number;
}

export const DEFAULT_ARROWS_PROGRESS: ArrowsProgress = {
  unlocked: 1,
  current: 0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Coerces untrusted storage input to a playable progress value. */
export function normalizeArrowsProgress(value: unknown): ArrowsProgress {
  if (!isRecord(value) || typeof value.unlocked !== "number" || typeof value.current !== "number") {
    return DEFAULT_ARROWS_PROGRESS;
  }
  const unlocked = clamp(Math.floor(value.unlocked), 1, LEVEL_COUNT);
  const current = clamp(Math.floor(value.current), 0, unlocked - 1);
  return { unlocked, current };
}

function browserStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/**
 * Zustand storage that keeps the flat `{ unlocked, current }` progress written
 * before the store used `persist`. Older saves are upgraded in place instead of
 * being dropped, so players keep their unlocked levels.
 */
export const arrowsStorage: StateStorage = {
  getItem: (name) => {
    const storage = browserStorage();
    if (!storage) {
      return null;
    }
    try {
      const raw = storage.getItem(name);
      if (raw === null) {
        return null;
      }
      const parsed: unknown = JSON.parse(raw);
      if (isRecord(parsed) && "state" in parsed) {
        return raw;
      }
      return JSON.stringify({
        state: normalizeArrowsProgress(parsed),
        version: ARROWS_STORAGE_VERSION,
      });
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      browserStorage()?.setItem(name, value);
    } catch {
      // Storage may be unavailable (private mode); playing still works.
    }
  },
  removeItem: (name) => {
    try {
      browserStorage()?.removeItem(name);
    } catch {
      // Storage may be unavailable (private mode); playing still works.
    }
  },
};
