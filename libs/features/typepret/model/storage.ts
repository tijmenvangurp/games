import { emptyProgress, LESSONS, MAX_LOG_ENTRIES, type Progress } from "@entities/typepret";
import { isRecord, readStoredJson, writeStoredJson } from "@shared/lib";

/** Versie 2 volgens ADR 0026: een profielklaar log. Lokaal blijft het `local`. */
const STORAGE_KEY = "games.typepret.v2";
const PROFILE_ID = "local";
const LESSON_IDS = new Set(LESSONS.map((lesson) => lesson.id));

function isAccuracy(value: unknown): value is number {
  return typeof value === "number" && value >= 0 && value <= 1;
}

function toCompleted(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return LESSONS.map((lesson) => lesson.id).filter((id) => value.includes(id));
}

function toBest(value: unknown): Record<string, number> {
  const best: Record<string, number> = {};
  if (!isRecord(value)) {
    return best;
  }
  for (const [lessonId, accuracy] of Object.entries(value)) {
    if (LESSON_IDS.has(lessonId) && isAccuracy(accuracy)) {
      best[lessonId] = accuracy;
    }
  }
  return best;
}

function toLog(value: unknown): Progress["log"] {
  if (!Array.isArray(value)) {
    return [];
  }
  const log: Progress["log"][number][] = [];
  for (const entry of value) {
    if (
      isRecord(entry) &&
      typeof entry.lessonId === "string" &&
      LESSON_IDS.has(entry.lessonId) &&
      isAccuracy(entry.accuracy) &&
      typeof entry.at === "number" &&
      Number.isFinite(entry.at)
    ) {
      log.push({ lessonId: entry.lessonId, accuracy: entry.accuracy, at: entry.at });
    }
  }
  return log.slice(-MAX_LOG_ENTRIES);
}

export function loadTypepretProgress(): Progress {
  const parsed = readStoredJson(STORAGE_KEY);
  if (!isRecord(parsed) || parsed.version !== 2) {
    return emptyProgress();
  }
  return {
    completed: toCompleted(parsed.completed),
    best: toBest(parsed.best),
    log: toLog(parsed.log),
  };
}

export function saveTypepretProgress(progress: Progress): void {
  writeStoredJson(STORAGE_KEY, { version: 2, profileId: PROFILE_ID, ...progress });
}
