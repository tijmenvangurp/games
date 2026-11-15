import { describe, expect, it } from "vitest";
import {
  dueReviewIds,
  emptyReviewState,
  isReviewDue,
  pickReviewIds,
  recordReview,
} from "@entities/adaptive";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = 1_000_000_000_000;

describe("review queue", () => {
  it("puts a missed item back in box 0 and makes it due immediately", () => {
    const state = recordReview(emptyReviewState(), "25", false, NOW);
    expect(state["25"]).toEqual({ box: 0, dueAt: NOW, correct: 0, seen: 1 });
    expect(isReviewDue(state["25"], NOW)).toBe(true);
    expect(dueReviewIds(state, NOW)).toEqual(["25"]);
  });

  it("moves a correct item one box up with a longer interval", () => {
    const missed = recordReview(emptyReviewState(), "25", false, NOW);
    const fixed = recordReview(missed, "25", true, NOW);
    expect(fixed["25"]?.box).toBe(1);
    expect(fixed["25"]?.dueAt).toBe(NOW + DAY_MS);
    expect(isReviewDue(fixed["25"], NOW)).toBe(false);
    expect(isReviewDue(fixed["25"], NOW + DAY_MS)).toBe(true);
  });

  it("caps the box at the longest interval", () => {
    let state = emptyReviewState();
    for (let index = 0; index < 10; index += 1) {
      state = recordReview(state, "25", true, NOW);
    }
    expect(state["25"]?.box).toBe(5);
    expect(state["25"]?.dueAt).toBe(NOW + 30 * DAY_MS);
  });

  it("returns due items oldest first and respects the limit", () => {
    let state = recordReview(emptyReviewState(), "a", false, NOW - 2000);
    state = recordReview(state, "b", false, NOW - 1000);
    state = recordReview(state, "c", false, NOW + DAY_MS);

    expect(dueReviewIds(state, NOW)).toEqual(["a", "b"]);
    expect(pickReviewIds(state, 1, NOW)).toEqual(["a"]);
    expect(pickReviewIds(state, 0, NOW)).toEqual([]);
  });
});
