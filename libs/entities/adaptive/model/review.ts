export interface ReviewEntry {
  /** Leitner box 0–5. */
  readonly box: number;
  /** Epoch milliseconds; the item is due at or before this time. */
  readonly dueAt: number;
  readonly correct: number;
  readonly seen: number;
}

export type ReviewState = Readonly<Record<string, ReviewEntry>>;

const REVIEW_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_BOX = REVIEW_INTERVALS_DAYS.length - 1;

export function emptyReviewState(): ReviewState {
  return {};
}

export function isReviewDue(entry: ReviewEntry | undefined, now = Date.now()): boolean {
  return Boolean(entry && entry.dueAt <= now);
}

/**
 * Records one review answer. A mistake goes back to box 0 and is due
 * immediately; a success moves one box up with a longer interval.
 */
export function recordReview(
  state: ReviewState,
  itemId: string,
  correct: boolean,
  now = Date.now(),
): ReviewState {
  const current = state[itemId];
  const box = correct ? Math.min(MAX_BOX, (current?.box ?? 0) + 1) : 0;
  const dueAt = now + (correct ? REVIEW_INTERVALS_DAYS[box] : 0) * DAY_MS;

  return {
    ...state,
    [itemId]: {
      box,
      dueAt,
      correct: (current?.correct ?? 0) + (correct ? 1 : 0),
      seen: (current?.seen ?? 0) + 1,
    },
  };
}

export function dueReviewIds(state: ReviewState, now = Date.now()): string[] {
  return Object.entries(state)
    .filter(([, entry]) => isReviewDue(entry, now))
    .sort(([, left], [, right]) => left.dueAt - right.dueAt)
    .map(([itemId]) => itemId);
}

/** Returns at most `limit` due items, oldest first. */
export function pickReviewIds(state: ReviewState, limit: number, now = Date.now()): string[] {
  const safeLimit = Math.max(0, Math.floor(limit));
  return dueReviewIds(state, now).slice(0, safeLimit);
}
