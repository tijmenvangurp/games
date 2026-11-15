import { describe, expect, it } from "vitest";
import {
  cellsBetween,
  createWordSearch,
  selectionMatches,
  WORD_SEARCH_CONFIG,
  WORD_SEARCH_DIFFICULTIES,
  WORD_SEARCH_DIRECTIONS,
  WORD_SEARCH_THEMES,
  WORD_SEARCH_WORDS,
  type WordSearchDirection,
  type WordSearchPlacement,
  type WordSearchPuzzle,
} from "@entities/word-search";

function placementDirection(placement: WordSearchPlacement): WordSearchDirection | null {
  const first = placement.cells[0];
  const second = placement.cells[1];
  if (!first || !second) {
    return null;
  }
  return { row: second.row - first.row, col: second.col - first.col };
}

function allowsDirection(
  directions: readonly WordSearchDirection[],
  step: WordSearchDirection,
): boolean {
  return directions.some((direction) => direction.row === step.row && direction.col === step.col);
}

function expectValidPlacement(
  puzzle: WordSearchPuzzle,
  theme: (typeof WORD_SEARCH_THEMES)[number],
  difficulty: (typeof WORD_SEARCH_DIFFICULTIES)[number],
  placement: WordSearchPlacement,
): void {
  expect(WORD_SEARCH_WORDS[theme]).toContain(placement.word);
  expect(placement.cells).toHaveLength(placement.word.length);

  const first = placement.cells[0];
  const last = placement.cells.at(-1);
  if (!first || !last) {
    throw new Error(`Plaatsing zonder cellen voor ${placement.word}`);
  }
  expect(cellsBetween(first, last)).toEqual(placement.cells);

  const step = placementDirection(placement);
  expect(step).not.toBeNull();
  if (step) {
    expect(allowsDirection(WORD_SEARCH_DIRECTIONS[difficulty], step)).toBe(true);
  }

  placement.cells.forEach((cell, index) => {
    expect(cell.row).toBeGreaterThanOrEqual(0);
    expect(cell.row).toBeLessThan(puzzle.size);
    expect(cell.col).toBeGreaterThanOrEqual(0);
    expect(cell.col).toBeLessThan(puzzle.size);
    expect(puzzle.grid[cell.row]?.[cell.col]).toBe(placement.word[index]?.toUpperCase());
  });
}

function expectValidPuzzle(
  puzzle: WordSearchPuzzle,
  theme: (typeof WORD_SEARCH_THEMES)[number],
  difficulty: (typeof WORD_SEARCH_DIFFICULTIES)[number],
): void {
  const config = WORD_SEARCH_CONFIG[difficulty];
  expect(puzzle.theme).toBe(theme);
  expect(puzzle.difficulty).toBe(difficulty);
  expect(puzzle.size).toBe(config.size);
  expect(puzzle.grid).toHaveLength(config.size);
  expect(puzzle.placements).toHaveLength(config.wordCount);

  const words = new Set(puzzle.placements.map((placement) => placement.word));
  expect(words.size).toBe(config.wordCount);

  for (const placement of puzzle.placements) {
    expectValidPlacement(puzzle, theme, difficulty, placement);
  }

  for (const row of puzzle.grid) {
    expect(row).toHaveLength(config.size);
    for (const letter of row) {
      expect(letter).toMatch(/^[A-Z]$/);
    }
  }
}

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
        expect(word).toMatch(/^[A-Za-z]{3,9}$/);
      }
    }
  });
});

describe("createWordSearch", () => {
  for (const theme of WORD_SEARCH_THEMES) {
    for (const difficulty of WORD_SEARCH_DIFFICULTIES) {
      it(`builds a valid ${theme}/${difficulty} puzzle`, () => {
        for (const seed of [1, 2, 3]) {
          expectValidPuzzle(createWordSearch(theme, difficulty, seed), theme, difficulty);
        }
      });
    }
  }

  it("is deterministic for the same seed", () => {
    const first = createWordSearch("tuin", "gemiddeld", 123);
    const second = createWordSearch("tuin", "gemiddeld", 123);

    expect(second.grid).toEqual(first.grid);
    expect(second.placements).toEqual(first.placements);
  });

  it("opens more directions per difficulty", () => {
    expect(WORD_SEARCH_DIRECTIONS.makkelijk).toEqual([
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ]);
    expect(WORD_SEARCH_DIRECTIONS.gemiddeld).toHaveLength(4);
    expect(WORD_SEARCH_DIRECTIONS.moeilijk).toHaveLength(8);
  });

  it("places every word across many seeds", () => {
    for (const theme of WORD_SEARCH_THEMES) {
      for (const difficulty of WORD_SEARCH_DIFFICULTIES) {
        for (let seed = 1; seed <= 30; seed += 1) {
          const puzzle = createWordSearch(theme, difficulty, seed);
          expect(puzzle.placements).toHaveLength(WORD_SEARCH_CONFIG[difficulty].wordCount);
        }
      }
    }
  });
});
