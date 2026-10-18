import { describe, expect, it } from "vitest";
import {
  POKEMON_LOOKALIKE_GROUPS,
  QUIZ_DIFFICULTIES,
  QUIZ_OPTION_COUNT,
  createQuizQuestion,
  isFragmentDifficulty,
  isSilhouetteDifficulty,
  lookalikeIdsFor,
} from "@features/pokemon-quiz";
import { POKEDEX, getPokemon } from "@entities/pokedex";

describe("pokémon quiz generator", () => {
  for (const difficulty of QUIZ_DIFFICULTIES) {
    it(`builds a ${difficulty} question with ${QUIZ_OPTION_COUNT[difficulty]} names`, () => {
      const question = createQuizQuestion(difficulty, 2026);
      const optionCount = QUIZ_OPTION_COUNT[difficulty];

      expect(question.difficulty).toBe(difficulty);
      expect(question.optionIds).toHaveLength(optionCount);
      expect(new Set(question.optionIds).size).toBe(optionCount);
      expect(question.optionIds).toContain(question.targetId);
      expect(question.optionIds.filter((id) => id === question.targetId)).toHaveLength(1);

      for (const id of question.optionIds) {
        expect(getPokemon(id)).toBeDefined();
        expect(POKEDEX.some((pokemon) => pokemon.id === id)).toBe(true);
      }
    });
  }

  it("is deterministic per seed", () => {
    expect(createQuizQuestion("gemiddeld", 77)).toEqual(createQuizQuestion("gemiddeld", 77));
  });

  it("varies between seeds", () => {
    expect(createQuizQuestion("gemiddeld", 1)).not.toEqual(createQuizQuestion("gemiddeld", 2));
  });

  it("offers more names on harder levels", () => {
    const easy = createQuizQuestion("makkelijk", 5);
    const hard = createQuizQuestion("moeilijk", 5);
    expect(hard.optionIds.length).toBeGreaterThan(easy.optionIds.length);
  });

  it("keeps the hardest level to five names", () => {
    expect(createQuizQuestion("meester", 11).optionIds).toHaveLength(5);
  });

  it("puts every Pokémon in exactly one lookalike group with enough names", () => {
    const seen = new Map<number, number>();

    for (const group of POKEMON_LOOKALIKE_GROUPS) {
      expect(group.length).toBeGreaterThanOrEqual(5);
      for (const id of group) {
        seen.set(id, (seen.get(id) ?? 0) + 1);
      }
    }

    expect(seen.size).toBe(POKEDEX.length);
    for (const pokemon of POKEDEX) {
      expect(seen.get(pokemon.id)).toBe(1);
      expect(lookalikeIdsFor(pokemon.id)).toContain(pokemon.id);
    }
  });

  for (const difficulty of ["moeilijk", "meester"] as const) {
    it(`uses only lookalike names on ${difficulty}`, () => {
      for (let seed = 0; seed < 25; seed += 1) {
        const question = createQuizQuestion(difficulty, seed);
        const group = lookalikeIdsFor(question.targetId);

        expect(group.length).toBeGreaterThanOrEqual(question.optionIds.length);
        for (const id of question.optionIds) {
          expect(group).toContain(id);
        }
      }
    });
  }

  it("marks only meester as a fragment level", () => {
    expect(QUIZ_DIFFICULTIES.filter(isFragmentDifficulty)).toEqual(["meester"]);
    expect(QUIZ_DIFFICULTIES.filter(isSilhouetteDifficulty)).toEqual(["moeilijk", "meester"]);
  });
});
