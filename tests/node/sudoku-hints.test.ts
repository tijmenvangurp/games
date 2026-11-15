import { describe, expect, it } from "vitest";
import { findHint, hintDetailCells, type SudokuPuzzle } from "@entities/sudoku";

const puzzle: SudokuPuzzle = {
  size: 4,
  difficulty: "makkelijk",
  seed: 1,
  givens: [1, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1],
  solution: [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1],
};

const entryless = Array.from({ length: 16 }, () => 0);

describe("sudoku hint details", () => {
  it("highlights the unit for a hidden single", () => {
    const hint = findHint(puzzle, entryless, null);
    expect(hint?.technique).toBe("hidden-single");
    if (!hint) {
      throw new Error("Expected a hidden single");
    }

    expect(hintDetailCells(puzzle, hint)).toEqual([0, 1, 2, 3]);
  });

  it("highlights the row, column and box for a naked single", () => {
    const nakedPuzzle: SudokuPuzzle = {
      ...puzzle,
      givens: [1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    const hint = findHint(nakedPuzzle, entryless, null);
    expect(hint?.technique).toBe("naked-single");
    if (!hint) {
      throw new Error("Expected a naked single");
    }

    const cells = hintDetailCells(nakedPuzzle, hint);
    expect(cells).toContain(0);
    expect(cells).toContain(7);
    expect(cells).toContain(2);
    expect(cells).not.toContain(hint.index);
  });
});
