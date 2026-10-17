import { describe, expect, it } from "vitest";
import { QUIZ_DIFFICULTIES, QUIZ_OPTION_COUNT, createQuizQuestion } from "@features/pokemon-quiz";
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
});
