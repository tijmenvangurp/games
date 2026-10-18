import { describe, expect, it } from "vitest";
import {
  cellsBetween,
  createWordSearch,
  selectionMatches,
  WORD_SEARCH_CONFIG,
  WORD_SEARCH_DIFFICULTIES,
  WORD_SEARCH_THEMES,
  WORD_SEARCH_WORDS,
  type WordSearchPlacement,
} from "@entities/word-search";

describe("cellsBetween", () => {
  it("walks a horizontal line", () => {
    expect(cellsBetween({ row: 2, col: 1 }, { row: 2, col: 3 })).toEqual([
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
    ]);
  });

  it("walks a vertical line and returns a single cell for the same point", () => {
    expect(cellsBetween({ row: 0, col: 4 }, { row: 2, col: 4 })).toEqual([
      { row: 0, col: 4 },
      { row: 1, col: 4 },
      { row: 2, col: 4 },
    ]);
    expect(cellsBetween({ row: 3, col: 3 }, { row: 3, col: 3 })).toEqual([{ row: 3, col: 3 }]);
  });

  it("walks diagonals in both directions", () => {
    expect(cellsBetween({ row: 0, col: 0 }, { row: 2, col: 2 })).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
    ]);
    expect(cellsBetween({ row: 2, col: 2 }, { row: 0, col: 0 })).toEqual([
      { row: 2, col: 2 },
      { row: 1, col: 1 },
      { row: 0, col: 0 },
    ]);
  });

  it("rejects a line that is not straight", () => {
    expect(cellsBetween({ row: 0, col: 0 }, { row: 1, col: 2 })).toEqual([]);
  });
});

describe("selectionMatches", () => {
  const placement: WordSearchPlacement = {
    word: "bloem",
    cells: [
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 1, col: 4 },
      { row: 1, col: 5 },
    ],
  };

  it("accepts a selection in both directions", () => {
    expect(selectionMatches(placement, placement.cells)).toBe(true);
    expect(selectionMatches(placement, [...placement.cells].reverse())).toBe(true);
  });

  it("rejects a wrong word or a different length", () => {
    expect(selectionMatches(placement, placement.cells.slice(0, 4))).toBe(false);
    expect(
      selectionMatches(placement, [
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
        { row: 1, col: 4 },
        { row: 1, col: 6 },
      ]),
    ).toBe(false);
  });
});

describe("word search words", () => {
  it("has enough theme words for the largest puzzle", () => {
    for (const theme of WORD_SEARCH_THEMES) {
      const pool = WORD_SEARCH_WORDS[theme];
      expect(pool.length).toBeGreaterThanOrEqual(WORD_SEARCH_CONFIG.moeilijk.wordCount);

      for (const word of pool) {
        expect(word).toMatch(/^[a-z]{3,8}$/);
      }
    }
  });
});

describe("createWordSearch", () => {
  for (const theme of WORD_SEARCH_THEMES) {
    for (const difficulty of WORD_SEARCH_DIFFICULTIES) {
      it(`builds a valid ${theme}/${difficulty} puzzle`, () => {
        const config = WORD_SEARCH_CONFIG[difficulty];

        for (const seed of [1, 2, 3]) {
          const puzzle = createWordSearch(theme, difficulty, seed);

          expect(puzzle.theme).toBe(theme);
          expect(puzzle.difficulty).toBe(difficulty);
          expect(puzzle.size).toBe(config.size);
          expect(puzzle.grid).toHaveLength(config.size);
          expect(puzzle.placements).toHaveLength(config.wordCount);

          const words = new Set(puzzle.placements.map((placement) => placement.word));
          expect(words.size).toBe(config.wordCount);

          for (const placement of puzzle.placements) {
            expect(WORD_SEARCH_WORDS[theme]).toContain(placement.word);
            expect(placement.cells).toHaveLength(placement.word.length);

            const first = placement.cells[0];
            const last = placement.cells.at(-1);
            if (!first || !last) {
              throw new Error(`Plaatsing zonder cellen voor ${placement.word}`);
            }
            expect(cellsBetween(first, last)).toEqual(placement.cells);

            placement.cells.forEach((cell, index) => {
              expect(cell.row).toBeGreaterThanOrEqual(0);
              expect(cell.row).toBeLessThan(puzzle.size);
              expect(cell.col).toBeGreaterThanOrEqual(0);
              expect(cell.col).toBeLessThan(puzzle.size);
              expect(puzzle.grid[cell.row]?.[cell.col]).toBe(placement.word[index]?.toUpperCase());
            });
          }

          for (const row of puzzle.grid) {
            expect(row).toHaveLength(config.size);
            for (const letter of row) {
              expect(letter).toMatch(/^[A-Z]$/);
            }
          }
        }
      });
    }
  }
});
