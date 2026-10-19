import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  countriesFor,
  createRound,
  explanationFor,
  FLAG_CONTINENTS,
  FLAG_COUNTRIES,
  FLAG_LEVELS,
  FLAG_LOOKALIKES,
  FLAG_SCOPES,
  flagSrc,
  lookalikeCodes,
  type FlagQuestion,
  type FlagScope,
} from "@entities/flag";

const ASSET_DIR = path.resolve(process.cwd(), "apps/games/public/flags");

function choicesWithoutAnswer(question: FlagQuestion) {
  return question.choices.filter((choice) => choice.code !== question.country.code);
}

describe("flag countries", () => {
  it("holds a complete, consistent country list", () => {
    expect(FLAG_COUNTRIES.length).toBeGreaterThanOrEqual(190);

    const codes = FLAG_COUNTRIES.map((country) => country.code);
    const names = FLAG_COUNTRIES.map((country) => country.name);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(names).size).toBe(names.length);

    for (const country of FLAG_COUNTRIES) {
      expect(country.code).toMatch(/^[a-z]{2}$/);
      expect(country.name.trim()).toBe(country.name);
      expect(country.name.length).toBeGreaterThan(1);
      expect(FLAG_CONTINENTS).toContain(country.continent);
    }
  });

  it("keeps every continent big enough for a full round", () => {
    for (const continent of FLAG_CONTINENTS) {
      expect(countriesFor(continent).length).toBeGreaterThanOrEqual(10);
    }
    expect(countriesFor("wereld")).toHaveLength(FLAG_COUNTRIES.length);
  });

  it("builds local flag paths only", () => {
    for (const country of FLAG_COUNTRIES) {
      const src = flagSrc(country);
      expect(src).toBe(`/flags/${country.code}.svg`);
      expect(src.startsWith("http")).toBe(false);
    }
  });

  it("only points at existing countries in the lookalike list", () => {
    const known = new Set(FLAG_COUNTRIES.map((country) => country.code));

    for (const [code, lookalikes] of Object.entries(FLAG_LOOKALIKES)) {
      expect(known.has(code)).toBe(true);
      expect(lookalikes.length).toBeGreaterThan(0);
      for (const lookalike of lookalikes) {
        expect(known.has(lookalike)).toBe(true);
        expect(lookalike).not.toBe(code);
      }
    }
  });
});

describe("flag rounds", () => {
  it("creates ten unique countries with both directions", () => {
    const round = createRound("wereld", "makkelijk", 7);

    expect(round.questions).toHaveLength(10);
    expect(round.seed).toBe(7);
    expect(new Set(round.questions.map((question) => question.country.code)).size).toBe(10);

    const directions = round.questions.map((question) => question.direction);
    expect(directions.filter((direction) => direction === "vlag-naar-land")).toHaveLength(5);
    expect(directions.filter((direction) => direction === "land-naar-vlag")).toHaveLength(5);
  });

  it("gives every question distinct choices including the answer", () => {
    for (const level of FLAG_LEVELS) {
      const round = createRound("wereld", level, 11);
      for (const question of round.questions) {
        const expected = level === "makkelijk" ? 3 : 4;
        expect(question.choices).toHaveLength(expected);
        expect(new Set(question.choices.map((choice) => choice.code)).size).toBe(expected);
        expect(question.choices.some((choice) => choice.code === question.country.code)).toBe(true);
      }
    }
  });

  it("is deterministic for a seed and varies across seeds", () => {
    const first = createRound("europa", "gemiddeld", 123);
    const again = createRound("europa", "gemiddeld", 123);
    const other = createRound("europa", "gemiddeld", 124);

    expect(JSON.stringify(again)).toBe(JSON.stringify(first));
    expect(JSON.stringify(other)).not.toBe(JSON.stringify(first));
  });

  it("picks easy distractors from another continent", () => {
    const round = createRound("wereld", "makkelijk", 21);
    for (const question of round.questions) {
      for (const choice of choicesWithoutAnswer(question)) {
        expect(choice.continent).not.toBe(question.country.continent);
      }
    }
  });

  it("keeps harder distractors on the same continent or in the lookalike list", () => {
    for (const level of ["gemiddeld", "moeilijk"] as const) {
      const round = createRound("wereld", level, 31);
      for (const question of round.questions) {
        const lookalikes = new Set(lookalikeCodes(question.country.code));
        for (const choice of choicesWithoutAnswer(question)) {
          const related =
            choice.continent === question.country.continent || lookalikes.has(choice.code);
          expect(related).toBe(true);
        }
      }
    }
  });

  it("prefers lookalike flags on the hardest level", () => {
    const rounds = [1, 2, 3, 4, 5].map((seed) => createRound("wereld", "moeilijk", seed));
    const withLookalike = rounds
      .flatMap((round) => round.questions)
      .filter((question) => {
        const lookalikes = new Set(lookalikeCodes(question.country.code));
        return choicesWithoutAnswer(question).some((choice) => lookalikes.has(choice.code));
      });

    expect(withLookalike.length).toBeGreaterThan(0);
  });

  it("stays inside the chosen scope", () => {
    for (const scope of FLAG_SCOPES.filter((value) => value !== "wereld")) {
      const round = createRound(scope as FlagScope, "gemiddeld", 5);
      const countries = new Set(countriesFor(scope).map((country) => country.code));
      for (const question of round.questions) {
        expect(question.country.continent).toBe(scope);
        for (const choice of question.choices) {
          expect(countries.has(choice.code)).toBe(true);
        }
      }
    }
  });

  it("explains the answer with the country and its continent", () => {
    const round = createRound("afrika", "makkelijk", 8);
    for (const question of round.questions) {
      const explanation = explanationFor(question);
      expect(explanation).toContain(question.country.name);
      expect(explanation).toContain("Afrika");
    }
  });
});

describe("local flag assets", () => {
  it("has a flag for every country and nothing else", async () => {
    const files = (await readdir(ASSET_DIR)).filter((file) => file.endsWith(".svg"));
    expect(files).toHaveLength(FLAG_COUNTRIES.length);

    for (const country of FLAG_COUNTRIES) {
      const file = path.join(ASSET_DIR, `${country.code}.svg`);
      expect(existsSync(file)).toBe(true);
      const svg = await readFile(file, "utf8");
      expect(svg).toContain("<svg");
      expect(/https?:\/\/(?!www\.w3\.org)/.test(svg)).toBe(false);
    }
  });
});
