import {
  emptyProgress,
  LEVELS,
  MAX_LOG_ENTRIES,
  THEMES,
  type Attempt,
  type LevelId,
  type Progress,
  type ThemeId,
} from "@entities/geheime-code";
import {
  isFiniteNumber,
  isNonNegativeInteger,
  isRecord,
  readStoredJson,
  writeStoredJson,
} from "@shared/lib";

/** Versie 2 volgens ADR 0026: een profielklaar, begrensd lokaal log. */
const STORAGE_KEY = "games.geheime-code.v2";
const PROFILE_ID = "local";
const STORAGE_VERSION = 2;

function isTheme(value: unknown): value is ThemeId {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

function isLevel(value: unknown): value is LevelId {
  return typeof value === "number" && (LEVELS as readonly number[]).includes(value);
}

function isRound(value: unknown): value is 1 | 2 {
  return value === 1 || value === 2;
}

function isAttempt(value: unknown): value is Attempt {
  return (
    isRecord(value) &&
    isTheme(value.theme) &&
    isLevel(value.level) &&
    isRound(value.round) &&
    isNonNegativeInteger(value.firstTry) &&
    isNonNegativeInteger(value.total) &&
    isFiniteNumber(value.at)
  );
}

function isBestKey(value: string): boolean {
  const separator = value.lastIndexOf("-");
  if (separator <= 0) {
    return false;
  }
  const theme = value.slice(0, separator);
  const level = Number(value.slice(separator + 1));
  return isTheme(theme) && isLevel(level);
}

function readBest(value: unknown): Readonly<Record<string, number>> {
  if (!isRecord(value)) {
    return {};
  }
  const best: Record<string, number> = {};
  for (const [key, count] of Object.entries(value)) {
    if (isBestKey(key) && isNonNegativeInteger(count)) {
      best[key] = count;
    }
  }
  return best;
}

function readLog(value: unknown): readonly Attempt[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isAttempt).slice(-MAX_LOG_ENTRIES);
}

export function loadProgress(): Progress {
  const parsed = readStoredJson(STORAGE_KEY);
  if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION) {
    return emptyProgress();
  }
  return { best: readBest(parsed.best), log: readLog(parsed.log) };
}

export function saveProgress(progress: Progress): void {
  writeStoredJson(STORAGE_KEY, {
    version: STORAGE_VERSION,
    profileId: PROFILE_ID,
    best: progress.best,
    log: progress.log,
  });
}
