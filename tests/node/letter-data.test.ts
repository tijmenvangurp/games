import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONFUSION_GROUPS,
  LETTER_IDS,
  LETTER_ORDER,
  LETTERS,
  TRAIN_WORDS,
  WORDS,
  WORDS_BY_LETTER,
} from "@entities/letter";

const publicDirectory = join(process.cwd(), "apps", "games", "public");

describe("letter data", () => {
  it("heeft unieke letters en voor elke letter een woord", () => {
    expect(LETTER_ORDER).toEqual(LETTER_IDS);
    expect(new Set(LETTER_ORDER).size).toBe(LETTER_ORDER.length);

    for (const letter of LETTER_ORDER) {
      expect(WORDS_BY_LETTER[letter].length).toBeGreaterThan(0);
    }
  });

  it("heeft unieke woorden en lokale audiobestanden", () => {
    expect(new Set(WORDS.map((word) => word.id)).size).toBe(WORDS.length);
    expect(new Set(WORDS.map((word) => word.word)).size).toBe(WORDS.length);

    for (const word of WORDS) {
      expect(word.audio).toBe(`/audio/letters/v1/words/${word.id}.wav`);
      expect(word.letters.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("koppelt elke letter aan een losse klank", () => {
    for (const letter of LETTERS) {
      expect(letter.sound).toBe(`/audio/letters/v1/sounds/${letter.id}.wav`);
    }
  });

  it("laat elk woord met de opgegeven letter beginnen", () => {
    for (const word of WORDS) {
      expect(word.letters[0]).toBe(word.letter);
      expect(word.word.startsWith(word.letter)).toBe(true);
    }
  });

  it("gebruikt voor de woordtrein alleen woorden met unieke letters", () => {
    for (const word of TRAIN_WORDS) {
      expect(word.letters.length).toBeGreaterThanOrEqual(2);
      expect(new Set(word.letters).size).toBe(word.letters.length);
    }
  });

  it("heeft alleen geldige letters in de verwarringsgroepen", () => {
    for (const group of CONFUSION_GROUPS) {
      expect(group.length).toBeGreaterThanOrEqual(2);
      for (const letter of group) {
        expect(LETTER_IDS).toContain(letter);
      }
    }
  });

  it("heeft voor elke klank en elk woord een bestaand audiobestand", () => {
    for (const letter of LETTERS) {
      expect(existsSync(join(publicDirectory, letter.sound))).toBe(true);
    }
    for (const word of WORDS) {
      expect(existsSync(join(publicDirectory, word.audio))).toBe(true);
    }
  });
});
