export const MATH_MODES = ["plus", "min", "keer", "deel"] as const;

export type MathMode = (typeof MATH_MODES)[number];

export const MATH_LEVELS = ["makkelijk", "gemiddeld", "moeilijk"] as const;

export type MathLevel = (typeof MATH_LEVELS)[number];

export interface MathQuestion {
  id: number;
  mode: MathMode;
  level: MathLevel;
  left: number;
  right: number;
  answer: number;
  prompt: string;
  choices: readonly number[];
}

export interface MathRound {
  mode: MathMode;
  level: MathLevel;
  seed: number;
  questions: readonly MathQuestion[];
}
