import { describe, expect, it } from "vitest";
import { COUNTRIES, createPuzzleRound, puzzleMap, worldShapeCodes } from "@entities/geography";

const WIDTH = 360;
const HEIGHT = 280;

describe("puzzle rounds", () => {
  it("knows which countries have an outline", async () => {
    const codes = await worldShapeCodes();

    expect(codes.has("528")).toBe(true); // Nederland
    expect(codes.has("250")).toBe(true); // Frankrijk
    expect(codes.has("")).toBe(false); // Kosovo heeft geen numeric-code
  });

  it("only picks countries with an outline from the chosen scope", async () => {
    const codes = await worldShapeCodes();
    const round = createPuzzleRound("europa", "gemiddeld", codes, 3);

    expect(round.questions).toHaveLength(8);
    expect(new Set(round.questions.map((question) => question.country.code)).size).toBe(8);
    for (const question of round.questions) {
      expect(question.country.region).toBe("europa");
      expect(codes.has(question.country.numeric)).toBe(true);
    }
  });

  it("is deterministic for a seed and varies across seeds", async () => {
    const codes = await worldShapeCodes();
    const first = createPuzzleRound("afrika", "makkelijk", codes, 9);
    const again = createPuzzleRound("afrika", "makkelijk", codes, 9);
    const other = createPuzzleRound("afrika", "makkelijk", codes, 10);

    expect(again).toEqual(first);
    expect(other).not.toEqual(first);
  });

  it("shrinks the round when a continent has fewer outlines", async () => {
    const codes = await worldShapeCodes();
    const round = createPuzzleRound("oceanie", "makkelijk", codes, 1);

    expect(round.questions).toHaveLength(6);
  });

  it("has no puzzle for the provinces without a province map", async () => {
    const codes = await worldShapeCodes();

    expect(() => createPuzzleRound("nederland", "makkelijk", codes, 1)).toThrow();
  });
});

describe("puzzle map", () => {
  it("draws the board and a piece for every selected country", async () => {
    const codes = await worldShapeCodes();
    const round = createPuzzleRound("zuid-amerika", "makkelijk", codes, 4);
    const map = await puzzleMap(
      round.questions.map((question) => question.country),
      WIDTH,
      HEIGHT,
    );

    expect(map.countries.length).toBeGreaterThan(150);
    expect(map.pieces).toHaveLength(8);

    for (const piece of map.pieces) {
      expect(piece.path.startsWith("M")).toBe(true);
      expect(piece.path).not.toContain("NaN");
      expect(piece.width).toBe(84);
      expect(piece.height).toBe(84);
    }

    const board = new Set(map.countries.map((country) => country.code));
    for (const question of round.questions) {
      expect(board.has(question.country.code)).toBe(true);
    }
  });

  it("keeps every selected country's centre inside the board", async () => {
    const codes = await worldShapeCodes();
    const round = createPuzzleRound("wereld", "moeilijk", codes, 11);
    const map = await puzzleMap(
      round.questions.map((question) => question.country),
      WIDTH,
      HEIGHT,
    );
    const board = new Map(map.countries.map((country) => [country.code, country]));

    for (const question of round.questions) {
      const country = board.get(question.country.code);
      expect(country).toBeDefined();
      expect(country?.x).toBeGreaterThanOrEqual(0);
      expect(country?.x).toBeLessThanOrEqual(WIDTH);
      expect(country?.y).toBeGreaterThanOrEqual(0);
      expect(country?.y).toBeLessThanOrEqual(HEIGHT);
    }
  });

  it("keeps the islands of an archipelago in the piece", async () => {
    const indonesia = COUNTRIES.find((country) => country.code === "id");
    if (!indonesia) {
      throw new Error("Indonesië ontbreekt");
    }

    const map = await puzzleMap([indonesia], WIDTH, HEIGHT);
    const piece = map.pieces[0];

    expect(piece).toBeDefined();
    // More than one subpath: the piece is not just the largest island.
    expect(piece?.path.match(/M/g)?.length ?? 0).toBeGreaterThan(1);
  });
});
