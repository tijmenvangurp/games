import { FLAG_LEVELS, FLAG_SCOPES, type FlagLevel, type FlagScope } from "@entities/geography";
import { readStoredJson, writeStoredJson } from "@shared/lib";
import { DEFAULT_FLAG_SETTINGS, FLAG_MODES, type FlagMode, type FlagSettings } from "./settings";

const STORAGE_KEY = "games.vlaggen.v1";
const MAX_STARS = 10;

export interface FlagState {
  settings: FlagSettings;
  best: Record<string, number>;
}

const FALLBACK: FlagState = {
  settings: DEFAULT_FLAG_SETTINGS,
  best: {},
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isScope(value: unknown): value is FlagScope {
  return typeof value === "string" && (FLAG_SCOPES as readonly string[]).includes(value);
}

function isLevel(value: unknown): value is FlagLevel {
  return typeof value === "string" && (FLAG_LEVELS as readonly string[]).includes(value);
}

function isMode(value: unknown): value is FlagMode {
  return typeof value === "string" && (FLAG_MODES as readonly string[]).includes(value);
}

/** Older saves have no mode; those are flag quiz games. */
function toSettings(value: unknown): FlagSettings | undefined {
  if (!isRecord(value) || !isScope(value.scope) || !isLevel(value.level)) {
    return undefined;
  }
  const mode = value.mode === undefined ? "vlaggen" : value.mode;

  return isMode(mode) ? { mode, scope: value.scope, level: value.level } : undefined;
}

/**
 * The quiz stores "scope:level"; the puzzle prefixes its key so both scores
 * can live next to each other under the same games key.
 */
function isBestKey(key: string): boolean {
  const parts = key.split(":");
  if (parts.length === 2) {
    return isScope(parts[0]) && isLevel(parts[1]);
  }
  if (parts.length === 3) {
    return parts[0] === "kaartpuzzel" && isScope(parts[1]) && isLevel(parts[2]);
  }
  return false;
}

function isBest(value: unknown): value is Record<string, number> {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(([key, score]) => {
    return (
      isBestKey(key) &&
      typeof score === "number" &&
      Number.isInteger(score) &&
      score >= 0 &&
      score <= MAX_STARS
    );
  });
}

export function loadFlagState(): FlagState {
  const parsed = readStoredJson(STORAGE_KEY);
  if (!isRecord(parsed)) {
    return FALLBACK;
  }

  return {
    settings: toSettings(parsed.settings) ?? FALLBACK.settings,
    best: isBest(parsed.best) ? parsed.best : {},
  };
}

export function saveFlagState(state: FlagState): void {
  writeStoredJson(STORAGE_KEY, state);
}
