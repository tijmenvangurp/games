import { describe, expect, it } from "vitest";
import { flipCard, type FlipState } from "@features/memory-game";

function state(overrides: Partial<FlipState> = {}): FlipState {
  return {
    cards: [1, 2, 1, 2],
    matched: [false, false, false, false],
    flipped: [],
    moves: 0,
    locked: false,
    found: false,
    ...overrides,
  };
}

describe("memory flip rules", () => {
  it("turns over a first card without counting a move", () => {
    const outcome = flipCard(state(), 0);
    expect(outcome?.flipped).toEqual([0]);
    expect(outcome?.moves).toBe(0);
    expect(outcome?.locked).toBe(false);
  });

  it("matches two equal cards", () => {
    const outcome = flipCard(state({ flipped: [0] }), 2);
    expect(outcome?.matched).toEqual([true, false, true, false]);
    expect(outcome?.flipped).toEqual([]);
    expect(outcome?.moves).toBe(1);
    expect(outcome?.locked).toBe(false);
  });

  it("locks mismatched cards until they are resolved", () => {
    const outcome = flipCard(state({ flipped: [0] }), 1);
    expect(outcome?.matched).toEqual([false, false, false, false]);
    expect(outcome?.flipped).toEqual([0, 1]);
    expect(outcome?.locked).toBe(true);
    expect(outcome?.moves).toBe(1);
    expect(flipCard(state({ flipped: [0, 1], locked: true, moves: 1 }), 2)).toBeNull();
  });

  it("detects a complete board", () => {
    const outcome = flipCard(
      state({
        matched: [true, true, true, false],
        flipped: [3],
        moves: 1,
      }),
      3,
    );
    expect(outcome).toBeNull();

    const final = flipCard(
      state({
        matched: [true, false, true, false],
        flipped: [1],
        moves: 1,
      }),
      3,
    );
    expect(final?.matched.every(Boolean)).toBe(true);
    expect(final?.found).toBe(true);
  });

  it("ignores invalid or repeated taps", () => {
    expect(flipCard(state({ found: true }), 0)).toBeNull();
    expect(flipCard(state(), -1)).toBeNull();
    expect(flipCard(state(), 4)).toBeNull();
    expect(flipCard(state({ matched: [true, false, false, false] }), 0)).toBeNull();
    expect(flipCard(state({ flipped: [1] }), 1)).toBeNull();
  });
});
