import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FRENCH_LESSONS, LESSON_ANIMAUX, frenchAudioSrc } from "@entities/french";
import {
  FRENCH_OPTION_COUNT,
  createFrenchQuestion,
  createFrenchQueue,
} from "@features/french-listening";

const audioDirectory = join(process.cwd(), "apps", "games", "public", "audio", "fr");

describe("Frans luisterspel", () => {
  it("heeft unieke item-id's en een geldig audio-pad", () => {
    const ids = LESSON_ANIMAUX.items.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const item of LESSON_ANIMAUX.items) {
      expect(item.fr.length).toBeGreaterThan(0);
      expect(item.nl.length).toBeGreaterThan(0);
      expect(item.reviewed).toBe(true);
      expect(frenchAudioSrc(item)).toBe(`/audio/fr/${item.id}.mp3`);
      expect(existsSync(join(audioDirectory, `${item.id}.mp3`))).toBe(true);
    }
  });

  it("bevat alleen lessen met items", () => {
    expect(FRENCH_LESSONS.length).toBeGreaterThan(0);
    for (const lesson of FRENCH_LESSONS) {
      expect(lesson.items.length).toBeGreaterThan(0);
      expect(lesson.items.every((item) => item.theme === lesson.id)).toBe(true);
    }
  });

  for (const item of LESSON_ANIMAUX.items) {
    it(`bouwt vier unieke opties voor ${item.id}`, () => {
      for (let seed = 1; seed <= 5; seed += 1) {
        const question = createFrenchQuestion(item, LESSON_ANIMAUX.items, seed);
        expect(question.options).toHaveLength(FRENCH_OPTION_COUNT);
        expect(new Set(question.options).size).toBe(FRENCH_OPTION_COUNT);
        expect(question.options[question.correctIndex]).toBe(item.nl);
        expect(question.options.filter((option) => option === item.nl)).toHaveLength(1);
      }
    });
  }

  it("is deterministisch per seed en varieert tussen seeds", () => {
    const item = LESSON_ANIMAUX.items[0];
    expect(createFrenchQuestion(item, LESSON_ANIMAUX.items, 42)).toEqual(
      createFrenchQuestion(item, LESSON_ANIMAUX.items, 42),
    );
    expect(createFrenchQuestion(item, LESSON_ANIMAUX.items, 1)).not.toEqual(
      createFrenchQuestion(item, LESSON_ANIMAUX.items, 2),
    );
  });

  it("gebruikt de handmatige afleiders voor zinnen", () => {
    const phrase = LESSON_ANIMAUX.items.find((item) => item.kind === "phrase");
    if (!phrase?.distractors) {
      throw new Error("Geen zin met afleiders");
    }
    const question = createFrenchQuestion(phrase, LESSON_ANIMAUX.items, 3);
    for (const distractor of phrase.distractors) {
      expect(question.options).toContain(distractor);
    }
  });

  it("schudt alle gereviewde items door elkaar", () => {
    const queue = createFrenchQueue(LESSON_ANIMAUX, 7);
    expect(queue).toHaveLength(LESSON_ANIMAUX.items.length);
    expect(new Set(queue.map((item) => item.id)).size).toBe(queue.length);
    expect(queue.every((item) => item.reviewed)).toBe(true);
  });
});
