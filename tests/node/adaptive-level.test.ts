import { describe, expect, it } from "vitest";
import {
  applyRound,
  clampLevelIndex,
  initialAdaptiveState,
  isStuck,
  type AdaptiveConfig,
  type AdaptiveState,
} from "@entities/adaptive";

const config: AdaptiveConfig = {
  levelCount: 5,
  startIndex: 2,
  successesToLevelUp: 2,
  maxStepsPerRound: 1,
};

function state(overrides: Partial<AdaptiveState> = {}): AdaptiveState {
  return { levelIndex: 2, streak: 0, ...overrides };
}

describe("adaptive level controller", () => {
  it("clamps the start index to the game-specific list", () => {
    expect(initialAdaptiveState({ ...config, startIndex: -3 })).toEqual({
      levelIndex: 0,
      streak: 0,
    });
    expect(initialAdaptiveState({ ...config, startIndex: 99 })).toEqual({
      levelIndex: 4,
      streak: 0,
    });
    expect(clampLevelIndex(2.9, 5)).toBe(2);
    expect(clampLevelIndex(99, 0)).toBe(0);
  });

  it("moves one level up after two successes in a row", () => {
    const result = applyRound(state(), { outcomes: [true, true] }, config);
    expect(result.state).toEqual({ levelIndex: 3, streak: 0 });
    expect(result.delta).toBe(1);
    expect(result.accuracy).toBe(1);
  });

  it("moves one level down after a failure", () => {
    const result = applyRound(state(), { outcomes: [false] }, config);
    expect(result.state).toEqual({ levelIndex: 1, streak: 0 });
    expect(result.delta).toBe(-1);
  });

  it("carries a streak between rounds and resets it on a level change", () => {
    expect(applyRound(state({ streak: 1 }), { outcomes: [true] }, config).state).toEqual({
      levelIndex: 3,
      streak: 0,
    });
    expect(applyRound(state({ streak: 1 }), { outcomes: [false] }, config).state).toEqual({
      levelIndex: 1,
      streak: 0,
    });
    expect(applyRound(state({ streak: 0 }), { outcomes: [true] }, config).state).toEqual({
      levelIndex: 2,
      streak: 1,
    });
  });

  it("moves at most one step per round", () => {
    const result = applyRound(
      state(),
      {
        outcomes: [true, true, true, true, true, true],
      },
      config,
    );
    expect(result.delta).toBe(1);
    expect(result.state.levelIndex).toBe(3);
  });

  it("stays inside the level bounds", () => {
    const atTop = applyRound(state({ levelIndex: 4 }), { outcomes: [true, true] }, config);
    expect(atTop.state.levelIndex).toBe(4);
    expect(atTop.delta).toBe(0);

    const atBottom = applyRound(state({ levelIndex: 0 }), { outcomes: [false] }, config);
    expect(atBottom.state.levelIndex).toBe(0);
    expect(atBottom.delta).toBe(0);
  });

  it("balances two-up and one-down on a repeating pattern", () => {
    const result = applyRound(state(), { outcomes: [true, true, false] }, config);
    expect(result.delta).toBe(0);
    expect(result.accuracy).toBeCloseTo(2 / 3);
  });

  it("uses the configured streak length", () => {
    const threeUp: AdaptiveConfig = { ...config, successesToLevelUp: 3 };
    expect(applyRound(state(), { outcomes: [true, true] }, threeUp).state).toEqual({
      levelIndex: 2,
      streak: 2,
    });
    expect(applyRound(state({ streak: 2 }), { outcomes: [true] }, threeUp).state).toEqual({
      levelIndex: 3,
      streak: 0,
    });
  });

  it("does not treat one mistake as stuck", () => {
    expect(isStuck({ outcomes: [true, true, false, true] })).toBe(false);
    expect(isStuck({ outcomes: [false, true, true], hints: 1 })).toBe(false);
  });

  it("detects a cluster of stuck signals", () => {
    expect(isStuck({ outcomes: [], abandoned: true })).toBe(true);
    expect(isStuck({ outcomes: [false, true, false], abandoned: true })).toBe(true);
    expect(isStuck({ outcomes: [true, true, false], invalidTaps: 5 })).toBe(true);
    expect(isStuck({ outcomes: [false, false, true], hints: 3 })).toBe(true);
    expect(isStuck({ outcomes: [true, true, true, false], hints: 3 })).toBe(false);
  });

  it("forces one step down on a stuck round, even when the streak would go up", () => {
    const result = applyRound(
      state(),
      { outcomes: [true, true], hints: 3, invalidTaps: 6 },
      config,
    );
    expect(result.stuck).toBe(true);
    expect(result.delta).toBe(-1);
    expect(result.state).toEqual({ levelIndex: 1, streak: 0 });
  });

  it("does not go below the floor on a stuck round", () => {
    const result = applyRound(state({ levelIndex: 0 }), { outcomes: [], abandoned: true }, config);
    expect(result.delta).toBe(0);
    expect(result.state).toEqual({ levelIndex: 0, streak: 0 });
  });
});
