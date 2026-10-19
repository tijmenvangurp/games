import { describe, expect, it } from "vitest";
import {
  COUNTRIES,
  countryShapeCodes,
  createPuzzleRound,
  provinceMap,
  provincePuzzleMap,
  provinceShapeCodes,
  puzzleMap,
  worldShapeCodes,
} from "@entities/geography";

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
    const codes = await countryShapeCodes();
    const round = createPuzzleRound("europa", "gemiddeld", codes, 3);

    expect(round.questions).toHaveLength(8);
    expect(new Set(round.questions.map((question) => question.subject.code)).size).toBe(8);
    for (const question of round.questions) {
      expect(question.subject.region).toBe("europa");
      expect(codes.has(question.subject.code)).toBe(true);
    }
  });

  it("is deterministic for a seed and varies across seeds", async () => {
    const codes = await countryShapeCodes();
    const first = createPuzzleRound("afrika", "makkelijk", codes, 9);
    const again = createPuzzleRound("afrika", "makkelijk", codes, 9);
    const other = createPuzzleRound("afrika", "makkelijk", codes, 10);

    expect(again).toEqual(first);
    expect(other).not.toEqual(first);
  });

  it("shrinks the round when a continent has fewer outlines", async () => {
    const codes = await countryShapeCodes();
    const round = createPuzzleRound("oceanie", "makkelijk", codes, 1);

    // Fiji valt af: die vorm kruist de antimeridiaan en zou afgeknipt worden.
    expect(round.questions).toHaveLength(5);
  });

  it("plays the twelve provinces as pieces", async () => {
    const codes = await provinceShapeCodes();
    expect(codes.size).toBe(12);

    const round = createPuzzleRound("nederland", "moeilijk", codes, 5);

    expect(round.questions).toHaveLength(8);
    for (const question of round.questions) {
      expect(question.subject.region).toBe("nederland");
    }
  });

  it("refuses a scope without shapes", async () => {
    const codes = await countryShapeCodes();

    expect(() => createPuzzleRound("nederland", "makkelijk", codes, 1)).toThrow();
  });
});

describe("puzzle map", () => {
  it("draws the board and a piece for every selected country", async () => {
    const codes = await countryShapeCodes();
    const round = createPuzzleRound("zuid-amerika", "makkelijk", codes, 4);
    const map = await puzzleMap(
      round.questions.map((question) => question.subject),
      WIDTH,
      HEIGHT,
    );

    expect(map.areas.length).toBeGreaterThan(150);
    expect(map.pieces).toHaveLength(8);

    for (const piece of map.pieces) {
      expect(piece.path.startsWith("M")).toBe(true);
      expect(piece.path).not.toContain("NaN");
      expect(piece.width).toBe(84);
      expect(piece.height).toBe(84);
    }

    const board = new Set(map.areas.map((area) => area.code));
    for (const question of round.questions) {
      expect(board.has(question.subject.code)).toBe(true);
    }
  });

  it("keeps every selected country's centre inside the board", async () => {
    const codes = await countryShapeCodes();
    const round = createPuzzleRound("wereld", "moeilijk", codes, 11);
    const map = await puzzleMap(
      round.questions.map((question) => question.subject),
      WIDTH,
      HEIGHT,
    );
    const board = new Map(map.areas.map((area) => [area.code, area]));

    for (const question of round.questions) {
      const area = board.get(question.subject.code);
      expect(area).toBeDefined();
      expect(area?.x).toBeGreaterThanOrEqual(0);
      expect(area?.x).toBeLessThanOrEqual(WIDTH);
      expect(area?.y).toBeGreaterThanOrEqual(0);
      expect(area?.y).toBeLessThanOrEqual(HEIGHT);
    }
  });

  it("draws the province puzzle from the twelve province shapes", async () => {
    const codes = await provinceShapeCodes();
    const round = createPuzzleRound("nederland", "gemiddeld", codes, 7);
    const map = await provincePuzzleMap(
      round.questions.map((question) => question.subject),
      WIDTH,
      HEIGHT,
    );

    expect(map.areas).toHaveLength(12);
    expect(map.pieces).toHaveLength(8);
    for (const piece of map.pieces) {
      expect(piece.path.startsWith("M")).toBe(true);
      expect(piece.path).not.toContain("NaN");
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

  it("highlights one province on the province map", async () => {
    const map = await provinceMap("nl-dr", WIDTH, HEIGHT);

    expect(map.land.startsWith("M")).toBe(true);
    expect(map.highlight.startsWith("M")).toBe(true);
    expect(map.highlight).not.toBe(map.land);
    expect(Number.isFinite(map.marker.x)).toBe(true);
    expect(Number.isFinite(map.marker.y)).toBe(true);
  });
});
