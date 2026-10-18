import { MATH_LEVELS, MATH_MODES, type MathLevel, type MathMode } from "@entities/math";
import { DEFAULT_MATH_SETTINGS, type MathSettings } from "./settings";

const STORAGE_KEY = "games.math.v1";
const MAX_STARS = 10;

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

function isMode(value: unknown): value is MathMode {
  return typeof value === "string" && (MATH_MODES as readonly string[]).includes(value);
}

function isLevel(value: unknown): value is MathLevel {
  return typeof value === "string" && (MATH_LEVELS as readonly string[]).includes(value);
}

function isSettings(value: unknown): value is MathSettings {
  return isRecord(value) && isMode(value.mode) && isLevel(value.level);
}

function isBest(value: unknown): value is Record<string, number> {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(([key, score]) => {
    const [mode, level] = key.split(":");
    return (
      isMode(mode) &&
      isLevel(level) &&
      typeof score === "number" &&
      Number.isInteger(score) &&
      score >= 0 &&
      score <= MAX_STARS
    );
  });
}

export function loadMathState(): MathState {
  try {
    if (typeof localStorage === "undefined") {
      return FALLBACK;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return FALLBACK;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return FALLBACK;
    }

    return {
      settings: isSettings(parsed.settings) ? parsed.settings : FALLBACK.settings,
      best: isBest(parsed.best) ? parsed.best : {},
    };
  } catch {
    return FALLBACK;
  }
}

export function saveMathState(state: MathState): void {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable; the in-memory game still works.
  }
}
