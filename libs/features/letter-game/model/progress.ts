import {
  createEmptyProgressMap,
  LETTER_ORDER,
  type LetterProgress,
  type LetterProgressMap,
} from "@entities/letter";
import { readStoredJson, writeStoredJson } from "@shared/lib";

const STORAGE_KEY = "games.letters.v1";
const STAGES = new Set(["nieuw", "oefenen", "bijna", "vast"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isDate(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isProgress(value: unknown): value is LetterProgress {
  return (
    isRecord(value) &&
    isCount(value.attempts) &&
    isCount(value.correct) &&
    isDate(value.lastSeen) &&
    isDate(value.nextReview) &&
    typeof value.stage === "string" &&
    STAGES.has(value.stage)
  );
}

export function loadLetterProgress(): LetterProgressMap {
  const parsed = readStoredJson(STORAGE_KEY);
  const progress = createEmptyProgressMap();
  if (!isRecord(parsed)) {
    return progress;
  }

  for (const letter of LETTER_ORDER) {
    const item = parsed[letter];
    if (isProgress(item)) {
      progress[letter] = item;
    }
  }

  return progress;
}

export function saveLetterProgress(progress: LetterProgressMap): void {
  writeStoredJson(STORAGE_KEY, progress);
}
