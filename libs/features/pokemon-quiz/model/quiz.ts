import { POKEDEX } from "@entities/pokedex";
import { createSeed, mulberry32, shuffledIndexes } from "@shared/lib";
import { lookalikeIdsFor } from "./lookalikes";

export const QUIZ_DIFFICULTIES = ["makkelijk", "gemiddeld", "moeilijk", "meester"] as const;

export type QuizDifficulty = (typeof QUIZ_DIFFICULTIES)[number];

export const QUIZ_MODES = ["naam", "geluid", "plaatje"] as const;

export type QuizMode = (typeof QUIZ_MODES)[number];

export const QUIZ_OPTION_COUNT: Record<QuizDifficulty, number> = {
  makkelijk: 3,
  gemiddeld: 4,
  moeilijk: 5,
  meester: 5,
};

/** Harder levels hide the colours until the player has answered. */
export function isSilhouetteDifficulty(difficulty: QuizDifficulty): boolean {
  return difficulty === "moeilijk" || difficulty === "meester";
}

/** The hardest level only shows a small part of the artwork. */
export function isFragmentDifficulty(difficulty: QuizDifficulty): boolean {
  return difficulty === "meester";
}

/** Harder levels pick wrong answers from the target's lookalike group. */
function usesLookalikeDistractors(difficulty: QuizDifficulty): boolean {
  return difficulty === "moeilijk" || difficulty === "meester";
}

export interface QuizQuestion {
  seed: number;
  difficulty: QuizDifficulty;
  /**
   * "naam" shows the artwork and name options, "geluid" plays the cry with
   * picture options, "plaatje" shows the artwork with cry options.
   */
  mode: QuizMode;
  /** The Pokémon shown in the artwork or heard in the cry. */
  targetId: number;
  /** Three, four or five Pokémon IDs, including the target, already shuffled. */
  optionIds: number[];
}

function pickDistractors(
  targetId: number,
  count: number,
  difficulty: QuizDifficulty,
  random: () => number,
): number[] {
  const pool = usesLookalikeDistractors(difficulty)
    ? lookalikeIdsFor(targetId)
    : POKEDEX.map((pokemon) => pokemon.id);
  const candidates = pool.filter((pokemonId) => pokemonId !== targetId);
  const distractors = shuffledIndexes(candidates.length, random)
    .slice(0, count)
    .map((index) => candidates[index]);

  if (distractors.length === count) {
    return distractors;
  }

  // Defensive fallback: the lookalike data should always provide enough names.
  const used = new Set(distractors);
  const rest = POKEDEX.map((pokemon) => pokemon.id).filter(
    (pokemonId) => pokemonId !== targetId && !used.has(pokemonId),
  );
  for (const index of shuffledIndexes(rest.length, random)) {
    if (distractors.length === count) {
      break;
    }
    distractors.push(rest[index]);
  }
  return distractors;
}

/**
 * Builds one round: a target Pokémon and 3, 4 or 5 shuffled name or picture
 * options.
 *
 * The target is always included exactly once and the distractors are unique.
 * Harder levels draw their distractors from the target's lookalike group.
 */
export function createQuizQuestion(
  difficulty: QuizDifficulty,
  seed: number = createSeed(),
  mode: QuizMode = "naam",
): QuizQuestion {
  const random = mulberry32(seed);
  const optionCount = QUIZ_OPTION_COUNT[difficulty];
  const targetIndex = Math.floor(random() * POKEDEX.length);
  const targetId = POKEDEX[targetIndex].id;

  const distractors = pickDistractors(targetId, optionCount - 1, difficulty, random);
  const optionIds = [targetId, ...distractors];
  for (let index = optionIds.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    const current = optionIds[index];
    optionIds[index] = optionIds[swapWith];
    optionIds[swapWith] = current;
  }

  return { seed, difficulty, mode, targetId, optionIds };
}
