import {
  FRENCH_PROGRESS_VERSION,
  emptyFrenchProgress,
  type FrenchItemProgress,
  type FrenchProgressState,
} from "@entities/french";
import { isFiniteNumber, isNonNegativeInteger, isNonNegativeNumber, isRecord } from "@shared/lib";

const STORAGE_KEY = "games.french.v1";

function isBox(value: unknown): value is number {
  return isNonNegativeInteger(value) && value <= 5;
}

function isEntry(value: unknown): value is FrenchItemProgress {
  if (!isRecord(value)) {
    return false;
  }
  return [
    isBox(value.box),
    isFiniteNumber(value.dueAt),
    isNonNegativeNumber(value.correct),
    isNonNegativeNumber(value.seen),
  ].every(Boolean);
}

export function loadFrenchProgress(): FrenchProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyFrenchProgress();
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      parsed.version !== FRENCH_PROGRESS_VERSION ||
      !isRecord(parsed.items)
    ) {
      return emptyFrenchProgress();
    }

    const items: Record<string, FrenchItemProgress> = {};
    for (const [itemId, entry] of Object.entries(parsed.items)) {
      if (isEntry(entry)) {
        items[itemId] = entry;
      }
    }
    return { version: FRENCH_PROGRESS_VERSION, items };
  } catch {
    return emptyFrenchProgress();
  }
}

export function saveFrenchProgress(progress: FrenchProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage may be unavailable (private mode); playing still works.
  }
}
