import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  FRENCH_CURRICULUM,
  LESSON_ANIMAUX,
  localizeItem,
  localizeLesson,
  validateCurriculum,
  type FrenchItem,
  type FrenchLesson,
} from "@entities/french";
import { createRound, lessonText, LESSONS, wordsFor } from "@entities/typepret";
import {
  createWordSearch,
  WORD_SEARCH_CONFIG,
  WORD_SEARCH_DIFFICULTIES,
  WORD_SEARCH_THEMES,
  WORD_SEARCH_WORDS,
  wordSearchWords,
} from "@entities/word-search";
import { wordSearchFeedbackSpeech } from "@features/word-search";
import { setLanguage } from "@shared/i18n";
import { mulberry32 } from "@shared/lib";

beforeEach(() => setLanguage("en"));
afterEach(() => setLanguage("nl"));

describe("Typepret in het Engels", () => {
  it("heeft Engelse oefenwoorden met alleen basisrij-letters", () => {
    expect(wordsFor("nl")).not.toEqual(wordsFor("en"));
    for (const word of wordsFor("en")) {
      expect(word).toMatch(/^[asdfghjkl]{3,5}$/);
    }
  });

  it("vult elke woordles met Engelse woorden van de juiste lengte", () => {
    for (const lesson of LESSONS.filter((candidate) => candidate.kind === "woorden")) {
      const { min, max } = lesson.wordLength ?? { min: 0, max: 0 };
      for (let seed = 1; seed <= 25; seed += 1) {
        const round = createRound(lesson, mulberry32(seed));
        expect(round.targets).toHaveLength(20);
        for (const word of round.groups) {
          expect(wordsFor("en")).toContain(word);
          expect(word.length).toBeGreaterThanOrEqual(min);
          expect(word.length).toBeLessThanOrEqual(max);
        }
      }
    }
  });

  it("heeft voor elke les een Engelse titel en uitleg", () => {
    for (const lesson of LESSONS) {
      expect(lessonText(lesson, "nl")).toMatchObject({
        title: lesson.title,
        description: lesson.description,
      });
      const english = lessonText(lesson, "en");
      expect(english.title).not.toBe(lesson.title);
      expect(english.description.length).toBeGreaterThan(0);
    }
  });
});

describe("Woordzoeker in het Engels", () => {
  it("heeft genoeg Engelse woorden per thema, A-Z zonder accenten", () => {
    for (const theme of WORD_SEARCH_THEMES) {
      expect(wordSearchWords(theme, "nl")).toBe(WORD_SEARCH_WORDS[theme]);
      const pool = wordSearchWords(theme, "en");
      expect(pool.length).toBeGreaterThanOrEqual(WORD_SEARCH_CONFIG.moeilijk.wordCount);
      expect(new Set(pool).size).toBe(pool.length);
      for (const word of pool) {
        expect(word).toMatch(/^[A-Za-z]{3,9}$/);
      }
    }
    expect(wordSearchWords("tuin", "en")).not.toEqual(WORD_SEARCH_WORDS.tuin);
    expect(wordSearchWords("pokemon", "en")).toEqual(WORD_SEARCH_WORDS.pokemon);
  });

  it("bouwt elk bord met Engelse woorden", () => {
    for (const theme of WORD_SEARCH_THEMES) {
      for (const difficulty of WORD_SEARCH_DIFFICULTIES) {
        const puzzle = createWordSearch(theme, difficulty, 7);
        expect(puzzle.size).toBe(WORD_SEARCH_CONFIG[difficulty].size);
        expect(puzzle.placements).toHaveLength(WORD_SEARCH_CONFIG[difficulty].wordCount);
        for (const placement of puzzle.placements) {
          expect(wordSearchWords(theme, "en")).toContain(placement.word);
        }
      }
    }
  });

  it("geeft Engelse status zonder de Nederlandse spraak te veranderen", () => {
    const base = {
      puzzleId: "puzzle",
      complete: false,
      wrong: false,
      selectedCount: 0,
      lastFound: null,
    } as const;
    expect(wordSearchFeedbackSpeech({ ...base, complete: true }).text).toBe(
      "You found all the words!",
    );
    expect(wordSearchFeedbackSpeech({ ...base, wrong: true }).text).toMatch(/^Not that one/);
    const found = wordSearchFeedbackSpeech({ ...base, lastFound: "fish" });
    expect(found.text).toBe("You found fish!");
    expect(found.lines.map((line) => line.id)).toEqual(["word-found"]);
  });
});

/** De voorbeeldzin van een item, of een lege zin als het item er geen heeft. */
function exampleOf(item: FrenchItem): Partial<NonNullable<FrenchItem["example"]>> {
  return item.example ?? {};
}

/** Het Frans van de voorbeeldzin blijft; de vertaling is nieuw. */
function expectTranslatedExample(item: FrenchItem, target: FrenchItem) {
  const source = exampleOf(item);
  const translated = exampleOf(target);
  expect(translated.fr).toBe(source.fr);
  expect(Boolean(translated.nl)).toBe(Boolean(source.nl));
  expect(translated.nl === source.nl).toBe(!item.example);
}

/** Een item met afleiders krijgt evenveel, maar vertaalde afleiders. */
function expectTranslatedDistractors(item: FrenchItem, target: FrenchItem) {
  expect(target.distractors?.length).toBe(item.distractors?.length);
  if (item.distractors) {
    expect(target.distractors).not.toEqual(item.distractors);
  }
}

/** Het Frans blijft staan; betekenis, uitleg, voorbeeldzin en afleiders zijn vertaald. */
function expectTranslatedItem(item: FrenchItem, target: FrenchItem) {
  expect(target.id).toBe(item.id);
  expect(target.fr).toBe(item.fr);
  expect(target.nl.length).toBeGreaterThan(0);
  expect(Boolean(target.note)).toBe(Boolean(item.note));
  expect(target.note).not.toBe(item.note);
  expectTranslatedExample(item, target);
  expectTranslatedDistractors(item, target);
}

describe("Bonjour ! in het Engels", () => {
  const english = FRENCH_CURRICULUM.map((lesson) => localizeLesson(lesson, "en"));

  it("houdt het Nederlands ongewijzigd", () => {
    expect(localizeLesson(LESSON_ANIMAUX, "nl")).toBe(LESSON_ANIMAUX);
    expect(localizeItem(LESSON_ANIMAUX.items[0], "nl")).toBe(LESSON_ANIMAUX.items[0]);
  });

  it("voldoet in het Engels aan hetzelfde inhoudscontract", () => {
    expect(validateCurriculum(english)).toEqual([]);
  });

  it("vertaalt elke betekenis, uitleg, voorbeeldzin en afleider", () => {
    FRENCH_CURRICULUM.forEach((lesson, lessonIndex) => {
      const translated = english[lessonIndex];
      expect(translated.title).toBe(lesson.title);
      expect(translated.subtitle).not.toBe(lesson.subtitle);
      expect(translated.category.length).toBeGreaterThan(0);
      lesson.items.forEach((item, itemIndex) =>
        expectTranslatedItem(item, translated.items[itemIndex]),
      );
    });
  });

  it("geeft steeds hetzelfde object terug", () => {
    expect(localizeLesson(LESSON_ANIMAUX, "en")).toBe(english[1]);
    expect(localizeItem(LESSON_ANIMAUX.items[0], "en")).toBe(english[1].items[0]);
  });

  it("laat onbekende lessen en items zoals ze zijn", () => {
    const review: FrenchLesson = { ...LESSON_ANIMAUX, id: "review", items: [] };
    expect(localizeLesson(review, "en")).toBe(review);
    const unknown = { ...LESSON_ANIMAUX.items[0], id: "onbekend" };
    expect(localizeItem(unknown, "en")).toBe(unknown);
  });
});
