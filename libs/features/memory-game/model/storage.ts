import type { Attempt, ReviewEntry, ReviewState } from "@entities/adaptive";
import { MEMORY_LEVELS, levelIndexForPairs } from "@entities/memory";
import { isFiniteNumber, isNonNegativeInteger, isRecord } from "@shared/lib";
import { DEFAULT_MEMORY_SETTINGS, type MemorySettings } from "./settings";

const STORAGE_KEY = "games.memory.v2";
const LEGACY_STORAGE_KEY = "games.memory.v1";
const STATE_VERSION = 2;
const MAX_STORED_ATTEMPTS = 200;
/** Profiles arrive with ADR 0012; until then every local player uses one slot. */
const PROFILE_ID = "local";

const LEGACY_PAIRS: Record<string, number> = {
  makkelijk: 6,
  gemiddeld: 8,
  moeilijk: 10,
};

export interface MemoryState {
  settings: MemorySettings;
  review: ReviewState;
  attempts: readonly Attempt[];
}

export const DEFAULT_MEMORY_STATE: MemoryState = {
  settings: DEFAULT_MEMORY_SETTINGS,
  review: {},
  attempts: [],
};

function isCount(value: unknown): value is number {
  return isNonNegativeInteger(value);
}

function isLevelIndex(value: unknown): value is number {
  return isCount(value) && value < MEMORY_LEVELS.length;
}

function isMode(value: unknown): value is MemorySettings["mode"] {
  return value === "auto" || value === "manual";
}

function isAdaptive(value: unknown): value is MemorySettings["adaptive"] {
  return isRecord(value) && isLevelIndex(value.levelIndex) && isCount(value.streak);
}

function isSettings(value: unknown): value is MemorySettings {
  return (
    isRecord(value) &&
    isMode(value.mode) &&
    isLevelIndex(value.manualIndex) &&
    isAdaptive(value.adaptive)
  );
}

function isReviewEntry(value: unknown): value is ReviewEntry {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isCount(value.box) &&
    value.box <= 5 &&
    isFiniteNumber(value.dueAt) &&
    isCount(value.correct) &&
    isCount(value.seen)
  );
}

function parseReview(value: unknown): ReviewState {
  if (!isRecord(value)) {
    return {};
  }

  const review: Record<string, ReviewEntry> = {};
  for (const [itemId, entry] of Object.entries(value)) {
    if (isReviewEntry(entry)) {
      review[itemId] = entry;
    }
  }
  return review;
}

function isAttempt(value: unknown): value is Attempt {
  return (
    isRecord(value) &&
    typeof value.itemId === "string" &&
    typeof value.ok === "boolean" &&
    isFiniteNumber(value.at) &&
    isCount(value.durationMs) &&
    isCount(value.hints)
  );
}

function parseAttempts(value: unknown): Attempt[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isAttempt).slice(-MAX_STORED_ATTEMPTS);
}

function stateFromParts(settings: MemorySettings, review: unknown, attempts: unknown): MemoryState {
  return {
    settings,
    review: parseReview(review),
    attempts: parseAttempts(attempts),
  };
}

function legacyState(): MemoryState | null {
  try {
    if (typeof localStorage === "undefined") {
      return null;
    }
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || typeof parsed.difficulty !== "string") {
      return null;
    }
    const pairs = LEGACY_PAIRS[parsed.difficulty];
    if (pairs === undefined) {
      return null;
    }
    const levelIndex = levelIndexForPairs(pairs);
    return {
      settings: {
        mode: "auto",
        manualIndex: levelIndex,
        adaptive: { levelIndex, streak: 0 },
      },
      review: {},
      attempts: [],
    };
  } catch {
    return null;
  }
}

export function loadMemoryState(): MemoryState {
  try {
    if (typeof localStorage === "undefined") {
      return DEFAULT_MEMORY_STATE;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return legacyState() ?? DEFAULT_MEMORY_STATE;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== STATE_VERSION || !isSettings(parsed.settings)) {
      return legacyState() ?? DEFAULT_MEMORY_STATE;
    }

    return stateFromParts(parsed.settings, parsed.review, parsed.attempts);
  } catch {
    return DEFAULT_MEMORY_STATE;
  }
}

export function saveMemoryState(state: MemoryState): void {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STATE_VERSION,
        profileId: PROFILE_ID,
        settings: state.settings,
        review: state.review,
        attempts: state.attempts.slice(-MAX_STORED_ATTEMPTS),
      }),
    );
  } catch {
    // Storage may be unavailable (private mode); playing still works.
  }
}
