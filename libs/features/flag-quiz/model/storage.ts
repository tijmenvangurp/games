import { FLAG_LEVELS, FLAG_SCOPES, type FlagLevel, type FlagScope } from "@entities/geography";
import { readStoredJson, writeStoredJson } from "@shared/lib";
import { DEFAULT_FLAG_SETTINGS, type FlagSettings } from "./settings";

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

function isSettings(value: unknown): value is FlagSettings {
  return isRecord(value) && isScope(value.scope) && isLevel(value.level);
}

function isBest(value: unknown): value is Record<string, number> {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(([key, score]) => {
    const [scope, level] = key.split(":");
    return (
      isScope(scope) &&
      isLevel(level) &&
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
    settings: isSettings(parsed.settings) ? parsed.settings : FALLBACK.settings,
    best: isBest(parsed.best) ? parsed.best : {},
  };
}

export function saveFlagState(state: FlagState): void {
  writeStoredJson(STORAGE_KEY, state);
}
