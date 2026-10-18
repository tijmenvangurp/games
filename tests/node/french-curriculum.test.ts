import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FRENCH_CURRICULUM,
  LESSON_ANIMAUX,
  getLesson,
  listPublishedLessons,
  validateCurriculum,
} from "@entities/french";
import type { FrenchItem, FrenchLesson } from "@entities/french";

const audioDirectory = join(process.cwd(), "apps", "games", "public", "audio", "fr");
const audioExists = (fileName: string) => existsSync(join(audioDirectory, fileName));

function fixture(
  overrides: Partial<FrenchLesson> = {},
  items: readonly FrenchItem[] = LESSON_ANIMAUX.items,
): FrenchLesson {
  return { ...LESSON_ANIMAUX, ...overrides, items };
}

function messages(lesson: FrenchLesson, options = {}): string[] {
  return validateCurriculum([lesson], options).map((issue) => issue.message);
}

describe("Frans curriculum", () => {
  it("valideert de echte curriculum zonder fouten", () => {
    expect(validateCurriculum(FRENCH_CURRICULUM, { audioExists })).toEqual([]);
  });

  it("vindt gepubliceerde lessen en les-id's", () => {
    expect(listPublishedLessons().some((lesson) => lesson.id === "animaux")).toBe(true);
    expect(getLesson("animaux")).toBe(LESSON_ANIMAUX);
    expect(getLesson("bestaat-niet")).toBeUndefined();
  });

  it("meldt dubbele les-id's", () => {
    expect(
      validateCurriculum([LESSON_ANIMAUX, LESSON_ANIMAUX]).map((issue) => issue.message),
    ).toContain("Duplicate lesson id.");
  });

  it("meldt lege lesvelden", () => {
    const lesson = fixture({ id: "", title: "", subtitle: "", category: "" });
    const result = messages(lesson);
    expect(result).toContain("Lesson id is empty.");
    expect(result).toContain("Lesson title is empty.");
    expect(result).toContain("Lesson subtitle is empty.");
    expect(result).toContain("Lesson category is empty.");
  });

  it("meldt dubbele item-id's en een verkeerde prefix", () => {
    const duplicate = { ...LESSON_ANIMAUX.items[1], id: LESSON_ANIMAUX.items[0].id };
    const prefixed = { ...LESSON_ANIMAUX.items[2], id: "verkeerd-id" };
    const lesson = fixture({}, [
      LESSON_ANIMAUX.items[0],
      duplicate,
      prefixed,
      ...LESSON_ANIMAUX.items.slice(3),
    ]);
    const result = messages(lesson);
    expect(result).toContain("Duplicate item id.");
    expect(result).toContain('Item id must start with "animaux-".');
  });

  it("meldt lege Franse tekst en Nederlandse vertaling", () => {
    const emptyFr = { ...LESSON_ANIMAUX.items[0], fr: "" };
    const emptyNl = { ...LESSON_ANIMAUX.items[1], nl: "" };
    const result = messages(fixture({}, [emptyFr, emptyNl, ...LESSON_ANIMAUX.items.slice(2)]));
    expect(result).toContain("French text is empty.");
    expect(result).toContain("Dutch translation is empty.");
  });

  it("meldt dubbele Nederlandse vertalingen", () => {
    const first = LESSON_ANIMAUX.items[0];
    const second = { ...LESSON_ANIMAUX.items[1], nl: first.nl };
    const result = messages(fixture({}, [first, second, ...LESSON_ANIMAUX.items.slice(2)]));
    expect(result.some((message) => message.startsWith("Duplicate Dutch translation"))).toBe(true);
  });

  it("meldt een ontbrekende voorbeeldzin bij een woord", () => {
    const word = { ...LESSON_ANIMAUX.items[0], example: undefined };
    const result = messages(fixture({}, [word, ...LESSON_ANIMAUX.items.slice(1)]));
    expect(result).toContain("Word needs an example sentence.");
  });

  it("meldt lege voorbeeldzin en vertaling", () => {
    const item = LESSON_ANIMAUX.items[0];
    if (!item.example) {
      throw new Error("Geen voorbeeldzin");
    }
    const emptyExample = { ...item, example: { ...item.example, fr: "", nl: "" } };
    const result = messages(fixture({}, [emptyExample, ...LESSON_ANIMAUX.items.slice(1)]));
    expect(result).toContain("Example sentence is empty.");
    expect(result).toContain("Example translation is empty.");
  });

  it("meldt te weinig of dubbele afleiders bij een zin", () => {
    const phrase = LESSON_ANIMAUX.items.find((item) => item.kind === "phrase");
    if (!phrase) {
      throw new Error("Geen zin");
    }
    const tooFew = { ...phrase, distractors: ["De hond slaapt."] };
    const duplicate = { ...phrase, distractors: ["A", "A", "B"] };
    const answer = { ...phrase, distractors: [phrase.nl, "A", "B"] };
    expect(messages(fixture({}, [tooFew, ...LESSON_ANIMAUX.items.slice(1)]))).toContain(
      "Phrase needs at least 3 distractors.",
    );
    expect(messages(fixture({}, [duplicate, ...LESSON_ANIMAUX.items.slice(1)]))).toContain(
      "Phrase distractors must be unique.",
    );
    expect(messages(fixture({}, [answer, ...LESSON_ANIMAUX.items.slice(1)]))).toContain(
      "Phrase distractor cannot equal the answer.",
    );
  });

  it("meldt onbekende en zelfverwijzende contrastwoorden", () => {
    const unknown = { ...LESSON_ANIMAUX.items[0], contrastWith: ["bestaat-niet"] };
    const self = { ...LESSON_ANIMAUX.items[1], contrastWith: [LESSON_ANIMAUX.items[1].id] };
    const result = messages(fixture({}, [unknown, self, ...LESSON_ANIMAUX.items.slice(2)]));
    expect(result).toContain('Unknown contrast item "bestaat-niet".');
    expect(result).toContain("Item cannot contrast with itself.");
  });

  it("meldt ontbrekende audio en ongereviewde items in een gepubliceerde les", () => {
    const unreviewed = { ...LESSON_ANIMAUX.items[0], reviewed: false };
    const lesson = fixture({}, [unreviewed, ...LESSON_ANIMAUX.items.slice(1)]);
    const result = messages(lesson, { audioExists: () => false });
    expect(result).toContain("Reviewed lesson contains an unreviewed item.");
    expect(result.some((message) => message.startsWith("Missing audio file"))).toBe(true);
    expect(result.some((message) => message.startsWith("Missing example audio file"))).toBe(true);
  });

  it("meldt een te kleine gepubliceerde les", () => {
    const result = messages(fixture({}, LESSON_ANIMAUX.items.slice(0, 2)));
    expect(result).toContain("Reviewed lesson needs at least 10 words.");
    expect(result).toContain("Reviewed lesson needs at least 5 phrases.");
  });

  it("vraagt geen audio of minimumaantal bij een draft-les", () => {
    const draft = fixture({ status: "draft" });
    expect(messages(draft, { audioExists: () => false })).toEqual([]);
  });
});
