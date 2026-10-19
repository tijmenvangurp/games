import { describe, expect, it } from "vitest";
import {
  createEmptyProgressMap,
  createLetterRound,
  createWordRound,
  WORDS,
} from "@entities/letter";
import { mulberry32 } from "@shared/lib";

function validateRound(round: ReturnType<typeof createLetterRound>): void {
  expect(round.questions).toHaveLength(6);
  expect(round.questions.map((question) => question.id)).toEqual([
    "q1",
    "q2",
    "q3",
    "q4",
    "q5",
    "q6",
  ]);

  for (const question of round.questions) {
    if (question.kind === "klank") {
      expect(question.choices).toHaveLength(3);
      expect(question.choices).toContain(question.target);
      expect(new Set(question.choices).size).toBe(3);
      expect(question.sound).toBe(`/audio/letters/v1/sounds/${question.target}.wav`);
    }
    if (question.kind === "vanger") {
      expect(question.choices).toHaveLength(3);
      expect(question.choices).toContain(question.target);
      expect(new Set(question.choices).size).toBe(3);
      expect(question.word.letter).toBe(question.target);
    }
    if (question.kind === "jacht") {
      expect(question.choices).toHaveLength(6);
      expect(question.choices).toContain(question.target);
      expect(new Set(question.choices).size).toBe(6);
    }
    if (question.kind === "trein") {
      expect(question.tiles).toHaveLength(question.word.letters.length + 1);
      for (const letter of question.word.letters) {
        expect(question.tiles).toContain(letter);
      }
      expect(new Set(question.tiles).size).toBe(question.tiles.length);
    }
  }
}

describe("letter round", () => {
  it("bouwt een vaste, gemengde ronde", () => {
    const round = createLetterRound(createEmptyProgressMap(), mulberry32(42), "2026-10-18");
    expect(round.lesson).toBe("letters");
    expect(round.newLetters).toEqual(["i", "k"]);
    expect(round.questions.map((question) => question.kind)).toEqual([
      "klank",
      "vanger",
      "jacht",
      "klank",
      "trein",
      "jacht",
    ]);
    validateRound(round);
  });

  it("is deterministisch met dezelfde seed", () => {
    const first = createLetterRound(createEmptyProgressMap(), mulberry32(7), "2026-10-18");
    const second = createLetterRound(createEmptyProgressMap(), mulberry32(7), "2026-10-18");
    expect(first).toEqual(second);
  });

  it("werkt ook als alle letters al zijn gezien", () => {
    const progress = createEmptyProgressMap();
    for (const letter of Object.keys(progress) as (keyof typeof progress)[]) {
      progress[letter] = {
        attempts: 2,
        correct: 1,
        lastSeen: "2026-10-17",
        nextReview: "2026-10-18",
        stage: "oefenen",
      };
    }

    const round = createLetterRound(progress, mulberry32(3), "2026-10-18");
    validateRound(round);
    expect(round.newLetters).toHaveLength(1);
  });

  it("speelt bij de eerste vraag een losse klank, geen letternaam", () => {
    const round = createLetterRound(createEmptyProgressMap(), mulberry32(11), "2026-10-18");
    const first = round.questions[0];
    expect(first?.kind).toBe("klank");
    if (first?.kind === "klank") {
      expect(first.sound).toMatch(/^\/audio\/letters\/v1\/sounds\/[a-z]\.wav$/);
    }
  });
});

describe("word round", () => {
  it("bouwt zes leesvragen met drie geschreven woorden", () => {
    const round = createWordRound(mulberry32(5));
    expect(round.lesson).toBe("woorden");
    expect(round.newLetters).toEqual([]);
    expect(round.questions).toHaveLength(6);

    const targets = new Set<string>();
    for (const question of round.questions) {
      expect(question.kind).toBe("lees");
      if (question.kind !== "lees") {
        continue;
      }

      targets.add(question.target.id);
      expect(question.choices).toHaveLength(3);
      expect(new Set(question.choices.map((word) => word.id)).size).toBe(3);
      expect(question.choices.map((word) => word.id)).toContain(question.target.id);
      expect(WORDS.map((word) => word.id)).toContain(question.target.id);

      for (const choice of question.choices) {
        if (choice.id !== question.target.id) {
          // Afleiders beginnen met een andere letter, zodat de beginletter
          // alleen niet genoeg is om het antwoord te raden.
          expect(choice.letter).not.toBe(question.target.letter);
        }
      }
    }

    expect(targets.size).toBe(6);
  });

  it("is deterministisch met dezelfde seed", () => {
    const first = createWordRound(mulberry32(9));
    const second = createWordRound(mulberry32(9));
    expect(first).toEqual(second);
  });

  it("gebruikt alleen woorden met een lokaal audiobestand", () => {
    const round = createWordRound(mulberry32(13));
    for (const question of round.questions) {
      if (question.kind === "lees") {
        expect(question.target.audio).toMatch(/^\/audio\/letters\/v1\/words\/[a-z]+\.wav$/);
      }
    }
  });
});
