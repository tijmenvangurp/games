import { POKEDEX } from "@entities/pokedex";
import { createSeed, mulberry32, shuffledIndexes } from "@shared/lib";

export const QUIZ_DIFFICULTIES = ["makkelijk", "gemiddeld", "moeilijk"] as const;

export type QuizDifficulty = (typeof QUIZ_DIFFICULTIES)[number];

export const QUIZ_OPTION_COUNT: Record<QuizDifficulty, number> = {
  makkelijk: 3,
  gemiddeld: 4,
  moeilijk: 5,
};

export interface QuizQuestion {
  seed: number;
  difficulty: QuizDifficulty;
  /** The Pokémon shown in the artwork. */
  targetId: number;
  /** Three, four or five Pokémon IDs, including the target, already shuffled. */
  optionIds: number[];
}

/**
 * Builds one round: a target Pokémon and 3, 4 or 5 shuffled name options.
 *
 * The target is always included exactly once and the distractors are unique.
 */
export function createQuizQuestion(
  difficulty: QuizDifficulty,
  seed: number = createSeed(),
): QuizQuestion {
  const random = mulberry32(seed);
  const optionCount = QUIZ_OPTION_COUNT[difficulty];
  const targetIndex = Math.floor(random() * POKEDEX.length);
  const targetId = POKEDEX[targetIndex].id;

  const distractors = shuffledIndexes(POKEDEX.length, random)
    .filter((index) => index !== targetIndex)
    .slice(0, optionCount - 1)
    .map((index) => POKEDEX[index].id);

  const optionIds = [targetId, ...distractors];
  for (let index = optionIds.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    const current = optionIds[index];
    optionIds[index] = optionIds[swapWith];
    optionIds[swapWith] = current;
  }

  return { seed, difficulty, targetId, optionIds };
}
