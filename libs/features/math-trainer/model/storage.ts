import { MATH_LEVELS, MATH_MODES, type MathLevel, type MathMode } from "@entities/math";
import {
  GAME_STORAGE_KEYS,
  profileStorageKey,
  readStoredJson,
  writeGameProgress,
} from "@shared/lib";
import { DEFAULT_MATH_SETTINGS, type MathSettings } from "./settings";

const STORAGE_KEY = GAME_STORAGE_KEYS.math;
export const MAX_MATH_STARS = 10;

export interface MathState {
  settings: MathSettings;
  best: Record<string, number>;
}

const FALLBACK: MathState = {
  settings: DEFAULT_MATH_SETTINGS,
  best: {},
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isMathMode(value: unknown): value is MathMode {
  return typeof value === "string" && (MATH_MODES as readonly string[]).includes(value);
}

export function isMathLevel(value: unknown): value is MathLevel {
  return typeof value === "string" && (MATH_LEVELS as readonly string[]).includes(value);
}

function isSettings(value: unknown): value is MathSettings {
  return isRecord(value) && isMathMode(value.mode) && isMathLevel(value.level);
}

function isBest(value: unknown): value is Record<string, number> {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(([key, score]) => {
    const [mode, level] = key.split(":");
    return (
      isMathMode(mode) &&
      isMathLevel(level) &&
      typeof score === "number" &&
      Number.isInteger(score) &&
      score >= 0 &&
      score <= MAX_MATH_STARS
    );
  });
}

export function loadMathState(profileId?: string): MathState {
  const parsed = readStoredJson(profileStorageKey(STORAGE_KEY, profileId));
  if (!isRecord(parsed)) {
    return FALLBACK;
  }

  return {
    settings: isSettings(parsed.settings) ? parsed.settings : FALLBACK.settings,
    best: isBest(parsed.best) ? parsed.best : {},
  };
}

export function saveMathState(state: MathState, profileId?: string): void {
  writeGameProgress(STORAGE_KEY, "math", state, profileId);
}
