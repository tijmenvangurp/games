import {
  FRENCH_PROGRESS_VERSION,
  emptyFrenchProgress,
  type FrenchItemProgress,
  type FrenchProgressState,
} from "@entities/french";
import { GAME_STORAGE_KEYS, profileStorageKey } from "@shared/lib";

const STORAGE_KEY = GAME_STORAGE_KEYS.french;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isCount(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isBox(value: unknown): value is number {
  return isCount(value) && value <= 5 && Number.isInteger(value);
}

function isEntry(value: unknown): value is FrenchItemProgress {
  if (!isRecord(value)) {
    return false;
  }
  return [
    isBox(value.box),
    isFiniteNumber(value.dueAt),
    isCount(value.correct),
    isCount(value.seen),
  ].every(Boolean);
}

export function loadFrenchProgress(): FrenchProgressState {
  try {
    const raw = localStorage.getItem(profileStorageKey(STORAGE_KEY));
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
    localStorage.setItem(profileStorageKey(STORAGE_KEY), JSON.stringify(progress));
  } catch {
    // Storage may be unavailable (private mode); playing still works.
  }
}
