import { LEVEL_COUNT } from "@entities/arrow";
import { GAME_STORAGE_KEYS, profileStorageKey, writeGameProgress } from "@shared/lib";

const STORAGE_KEY = GAME_STORAGE_KEYS.arrows;

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

export function loadArrowsProgress(profileId?: string): ArrowsProgress {
  try {
    const raw = localStorage.getItem(profileStorageKey(STORAGE_KEY, profileId));
    if (!raw) {
      return DEFAULT_ARROWS_PROGRESS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      typeof parsed.unlocked !== "number" ||
      typeof parsed.current !== "number"
    ) {
      return DEFAULT_ARROWS_PROGRESS;
    }
    const unlocked = clamp(Math.floor(parsed.unlocked), 1, LEVEL_COUNT);
    const current = clamp(Math.floor(parsed.current), 0, unlocked - 1);
    return { unlocked, current };
  } catch {
    return DEFAULT_ARROWS_PROGRESS;
  }
}

export function saveArrowsProgress(progress: ArrowsProgress, profileId?: string): void {
  writeGameProgress(STORAGE_KEY, "arrows", progress, profileId);
}
