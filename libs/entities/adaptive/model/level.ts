import type { AdaptiveConfig, AdaptiveState, RoundSignals, RoundSummary } from "./types";

const DEFAULT_SUCCESSES_TO_LEVEL_UP = 2;
const DEFAULT_MAX_STEPS_PER_ROUND = 1;

function wholeNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.floor(value) : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Clamps an index to a game-specific level list. */
export function clampLevelIndex(index: number, levelCount: number): number {
  if (levelCount <= 0) {
    return 0;
  }
  return clamp(wholeNumber(index, 0), 0, levelCount - 1);
}

export function initialAdaptiveState(config: AdaptiveConfig): AdaptiveState {
  return {
    levelIndex: clampLevelIndex(config.startIndex, config.levelCount),
    streak: 0,
  };
}

export function accuracyOf(outcomes: readonly boolean[]): number {
  if (outcomes.length === 0) {
    return 0;
  }
  return outcomes.filter(Boolean).length / outcomes.length;
}

/**
 * A round is stuck when the child shows a cluster of signals, not when the
 * child simply makes a mistake. At the 70% target, three in ten mistakes are
 * expected; rescuing every mistake would remove the learning pit.
 */
export function isStuck(signals: RoundSignals): boolean {
  const accuracy = accuracyOf(signals.outcomes);
  const hints = Math.max(0, wholeNumber(signals.hints ?? 0, 0));
  const invalidTaps = Math.max(0, wholeNumber(signals.invalidTaps ?? 0, 0));

  if (signals.abandoned && accuracy < 0.5) {
    return true;
  }
  if (invalidTaps >= 5) {
    return true;
  }
  return hints >= 3 && accuracy < 0.6;
}

/**
 * Applies one round to the adaptive state.
 *
 * The streak is carried between rounds. A level change resets it. The level
 * moves at most `maxStepsPerRound` steps, and never outside the game's list.
 * A stuck round forces at least one step down, even when the raw streak would
 * have moved up.
 */
export function applyRound(
  state: AdaptiveState,
  signals: RoundSignals,
  config: AdaptiveConfig,
): RoundSummary {
  const levelCount = Math.max(1, wholeNumber(config.levelCount, 1));
  const start = clampLevelIndex(state.levelIndex, levelCount);
  const successesToLevelUp = Math.max(
    1,
    wholeNumber(
      config.successesToLevelUp ?? DEFAULT_SUCCESSES_TO_LEVEL_UP,
      DEFAULT_SUCCESSES_TO_LEVEL_UP,
    ),
  );
  const maxSteps = Math.max(
    1,
    wholeNumber(
      config.maxStepsPerRound ?? DEFAULT_MAX_STEPS_PER_ROUND,
      DEFAULT_MAX_STEPS_PER_ROUND,
    ),
  );

  let streak = Math.max(0, wholeNumber(state.streak, 0));
  let rawDelta = 0;

  for (const ok of signals.outcomes) {
    if (ok) {
      streak += 1;
      if (streak >= successesToLevelUp) {
        rawDelta += 1;
        streak = 0;
      }
    } else {
      streak = 0;
      rawDelta -= 1;
    }
  }

  const stuck = isStuck(signals);
  if (stuck) {
    rawDelta = Math.min(rawDelta, -1);
  }

  const delta = clamp(rawDelta, -maxSteps, maxSteps);
  const levelIndex = clampLevelIndex(start + delta, levelCount);
  const appliedDelta = levelIndex - start;

  return {
    state: {
      levelIndex,
      streak: appliedDelta === 0 && !stuck ? streak : 0,
    },
    delta: appliedDelta,
    accuracy: accuracyOf(signals.outcomes),
    stuck,
  };
}
