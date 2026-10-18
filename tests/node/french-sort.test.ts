import { describe, expect, it } from "vitest";
import { FRENCH_CURRICULUM } from "@entities/french";
import { createSortRound, isSortCorrect } from "@features/french-listening";

describe("Franse woorden sorteren", () => {
  it("maakt een ronde met drie categorieën en twee woorden per categorie", () => {
    const round = createSortRound(FRENCH_CURRICULUM, 9);
    expect(round.categories).toHaveLength(3);
    expect(round.words).toHaveLength(6);
    expect(new Set(round.words.map((word) => word.item.id)).size).toBe(6);

    for (const word of round.words) {
      expect(round.categories.map((category) => category.lessonId)).toContain(word.lessonId);
    }
  });

  it("is deterministisch per seed en controleert de categorie", () => {
    const first = createSortRound(FRENCH_CURRICULUM, 4);
    expect(createSortRound(FRENCH_CURRICULUM, 4)).toEqual(first);

    const word = first.words[0];
    const correctCategory = first.categories.find(
      (category) => category.lessonId === word.lessonId,
    );
    if (!correctCategory) {
      throw new Error("Geen juiste categorie");
    }
    expect(isSortCorrect(word, correctCategory.lessonId)).toBe(true);
    const other = first.categories.find((category) => category.lessonId !== word.lessonId);
    if (other) {
      expect(isSortCorrect(word, other.lessonId)).toBe(false);
    }
  });
});
