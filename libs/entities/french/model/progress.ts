import type { FrenchItem, FrenchLesson } from "./types";

export interface FrenchItemProgress {
  /** Leitner box 0–5. */
  box: number;
  /** Epoch milliseconds; the item is due at or before this time. */
  dueAt: number;
  correct: number;
  seen: number;
}

export interface FrenchProgressState {
  version: 1;
  items: Record<string, FrenchItemProgress>;
}

export const FRENCH_PROGRESS_VERSION = 1;
const DAY_MS = 24 * 60 * 60 * 1000;
const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;
const MAX_BOX = INTERVAL_DAYS.length - 1;

export function emptyFrenchProgress(): FrenchProgressState {
  return { version: FRENCH_PROGRESS_VERSION, items: {} };
}

export function isDue(entry: FrenchItemProgress | undefined, now = Date.now()): boolean {
  return Boolean(entry && entry.dueAt <= now);
}

export function recordFrenchAnswer(
  state: FrenchProgressState,
  itemId: string,
  correct: boolean,
  now = Date.now(),
): FrenchProgressState {
  const current = state.items[itemId];
  const box = correct ? Math.min(MAX_BOX, (current?.box ?? 0) + 1) : 0;
  const dueAt = now + (correct ? INTERVAL_DAYS[box] : 0) * DAY_MS;

  return {
    ...state,
    items: {
      ...state.items,
      [itemId]: {
        box,
        dueAt,
        correct: (current?.correct ?? 0) + (correct ? 1 : 0),
        seen: (current?.seen ?? 0) + 1,
      },
    },
  };
}

export function dueItemIds(
  state: FrenchProgressState,
  items: readonly FrenchItem[],
  now = Date.now(),
): string[] {
  return items.filter((item) => isDue(state.items[item.id], now)).map((item) => item.id);
}

function starsForAccuracy(accuracy: number): 1 | 2 | 3 {
  if (accuracy >= 0.9) {
    return 3;
  }
  return accuracy >= 0.75 ? 2 : 1;
}

/** 0 = nog niet gedaan, 1–3 = sterren op basis van eerste-poging-accuratesse. */
export function lessonStars(state: FrenchProgressState, lesson: FrenchLesson): 0 | 1 | 2 | 3 {
  const items = lesson.items.filter((item) => item.reviewed);
  if (items.length === 0) {
    return 0;
  }
  const entries = items.map((item) => state.items[item.id]);
  if (entries.some((entry) => !entry || entry.seen === 0)) {
    return 0;
  }
  const seen = entries.reduce((sum, entry) => sum + (entry?.seen ?? 0), 0);
  const correct = entries.reduce((sum, entry) => sum + (entry?.correct ?? 0), 0);
  if (seen === 0) {
    return 0;
  }
  return starsForAccuracy(correct / seen);
}
