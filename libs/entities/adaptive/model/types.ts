/** One locally stored attempt. Kept small and free of personal data. */
export interface Attempt {
  readonly itemId: string;
  readonly ok: boolean;
  /** Epoch milliseconds. */
  readonly at: number;
  readonly durationMs: number;
  readonly hints: number;
}

/** The adaptive position inside one game-specific, ordered level list. */
export interface AdaptiveState {
  /** Index into the game's own level list, not a universal difficulty number. */
  readonly levelIndex: number;
  /** Consecutive successful attempts; resets on a failure or a level change. */
  readonly streak: number;
}

export interface AdaptiveConfig {
  /** Number of entries in the game-specific level list. */
  readonly levelCount: number;
  /** Index of the level a new player starts on. */
  readonly startIndex: number;
  /** Successful attempts in a row needed to move one level up. Defaults to 2. */
  readonly successesToLevelUp?: number;
  /** Maximum level steps one round may move. Defaults to 1. */
  readonly maxStepsPerRound?: number;
}

/** Everything a round tells the controller. */
export interface RoundSignals {
  /** One entry per attempt, in play order. A board game uses its own attempt unit. */
  readonly outcomes: readonly boolean[];
  /** Hints used during this round. */
  readonly hints?: number;
  /** Taps that were ignored, for example on a blocked arrow or a matched card. */
  readonly invalidTaps?: number;
  /** True when the child left the round before finishing it. */
  readonly abandoned?: boolean;
}

export interface RoundSummary {
  readonly state: AdaptiveState;
  /** Actual applied change after the level bounds and the per-round cap. */
  readonly delta: number;
  /** Share of successful attempts in this round, from 0 to 1. */
  readonly accuracy: number;
  /** True when the round showed a cluster of stuck signals. */
  readonly stuck: boolean;
}
