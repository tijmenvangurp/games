import { describe, expect, it } from "vitest";
import {
  countMistakes,
  completedUnits,
  createPlayState,
  digitCounts,
  enterValue,
  eraseCell,
  filledCount,
  findConflicts,
  isComplete,
  moveSelection,
  restartPuzzle,
  revealHint,
  selectCell,
  type SudokuPuzzle,
} from "@entities/sudoku";

const puzzle: SudokuPuzzle = {
  size: 4,
  difficulty: "makkelijk",
  seed: 1,
  givens: [1, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1],
  solution: [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1],
};

const sparsePuzzle: SudokuPuzzle = {
  ...puzzle,
  givens: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

function solveEverything(state: ReturnType<typeof createPlayState>) {
  let next = state;
  for (let index = 0; index < puzzle.givens.length; index += 1) {
    if (puzzle.givens[index] === 0) {
      next = enterValue(selectCell(next, index), puzzle.solution[index]);
    }
  }
  return next;
}

describe("sudoku play state", () => {
  it("starts with an empty grid", () => {
    const state = createPlayState(puzzle);
    expect(state.entries).toHaveLength(16);
    expect(filledCount(state.entries)).toBe(0);
    expect(state.selected).toBeNull();
    expect(state.solved).toBe(false);
  });

  it("selects cells within the grid only", () => {
    const state = createPlayState(puzzle);
    expect(selectCell(state, 5).selected).toBe(5);
    expect(selectCell(state, -1)).toBe(state);
    expect(selectCell(state, 16)).toBe(state);
  });

  it("ignores input without a selection", () => {
    const state = createPlayState(puzzle);
    expect(enterValue(state, 2)).toBe(state);
  });

  it("fills and toggles an editable cell", () => {
    const state = selectCell(createPlayState(puzzle), 1);
    const filled = enterValue(state, 2);
    expect(filled.entries[1]).toBe(2);
    expect(enterValue(filled, 2).entries[1]).toBe(0);
  });

  it("ignores out-of-range values", () => {
    const state = selectCell(createPlayState(puzzle), 1);
    expect(enterValue(state, 0)).toBe(state);
    expect(enterValue(state, 5)).toBe(state);
  });

  it("never overwrites givens", () => {
    const state = selectCell(createPlayState(puzzle), 0);
    expect(enterValue(state, 3)).toBe(state);
    expect(eraseCell(state)).toBe(state);
  });

  it("reports mistakes compared to the solution", () => {
    const state = enterValue(selectCell(createPlayState(puzzle), 1), 3);
    expect(countMistakes(state.entries, puzzle.solution)).toEqual([1]);
    expect(isComplete(puzzle, state.entries)).toBe(false);
  });

  it("erases an editable cell", () => {
    const filled = enterValue(selectCell(createPlayState(puzzle), 1), 2);
    const erased = eraseCell(filled);
    expect(erased.entries[1]).toBe(0);
    expect(eraseCell(erased)).toBe(erased);
  });

  it("detects a completed puzzle", () => {
    const solved = solveEverything(createPlayState(puzzle));
    expect(solved.solved).toBe(true);
    expect(isComplete(puzzle, solved.entries)).toBe(true);
  });

  it("counts visible digits for the number pad", () => {
    const empty = createPlayState(puzzle);
    expect(digitCounts(empty.puzzle, empty.entries)).toEqual([0, 2, 0, 0, 2]);

    const partial = enterValue(selectCell(empty, 6), 1);
    expect(digitCounts(partial.puzzle, partial.entries)[1]).toBe(3);

    const full = enterValue(selectCell(partial, 9), 1);
    expect(digitCounts(full.puzzle, full.entries)[1]).toBe(4);
  });

  it("counts every digit on a solved board", () => {
    const solved = solveEverything(createPlayState(puzzle));
    expect(digitCounts(solved.puzzle, solved.entries)).toEqual([0, 4, 4, 4, 4]);
  });

  it("marks duplicate digits in a row, column or box as conflicts", () => {
    const empty = createPlayState(puzzle);
    expect(findConflicts(empty.puzzle, empty.entries).size).toBe(0);

    const wrongButFree = enterValue(selectCell(empty, 1), 3);
    expect(findConflicts(wrongButFree.puzzle, wrongButFree.entries).size).toBe(0);

    const conflict = enterValue(selectCell(empty, 1), 4);
    expect(findConflicts(conflict.puzzle, conflict.entries)).toEqual(new Set([1, 5]));
  });

  it("reports completed rows and boxes", () => {
    const empty = createPlayState(puzzle);
    expect(completedUnits(empty.puzzle, empty.entries)).toEqual([]);

    let row = empty;
    row = enterValue(selectCell(row, 1), 2);
    row = enterValue(selectCell(row, 2), 3);
    row = enterValue(selectCell(row, 3), 4);
    expect(completedUnits(row.puzzle, row.entries)).toEqual([{ kind: "row", index: 0 }]);

    let box = empty;
    box = enterValue(selectCell(box, 1), 2);
    box = enterValue(selectCell(box, 4), 3);
    expect(completedUnits(box.puzzle, box.entries)).toEqual([{ kind: "box", index: 0 }]);
  });

  it("does not celebrate a full row with wrong digits", () => {
    let state = createPlayState(puzzle);
    state = enterValue(selectCell(state, 1), 3);
    state = enterValue(selectCell(state, 2), 2);
    state = enterValue(selectCell(state, 3), 4);

    expect(completedUnits(state.puzzle, state.entries)).toEqual([]);
  });

  it("moves the selection with bounds", () => {
    const state = selectCell(createPlayState(puzzle), 0);
    expect(moveSelection(state, 0, 1).selected).toBe(1);
    expect(moveSelection(state, -1, -1).selected).toBe(0);
    expect(moveSelection(selectCell(state, 15), 1, 1).selected).toBe(15);
    const noSelection = moveSelection(createPlayState(puzzle), 1, 1);
    expect(noSelection.selected).toBe(5);
  });

  it("reveals only a hint that follows from the board", () => {
    const state = createPlayState(puzzle);
    const hinted = revealHint(selectCell(state, 1));

    expect(hinted.entries[1]).toBe(0);
    expect(hinted.hinted[1]).toBe(false);
    expect(hinted.entries[3]).toBe(4);
    expect(hinted.hinted[3]).toBe(true);
    expect(hinted.selected).toBe(3);
    expect(countMistakes(hinted.entries, puzzle.solution)).toEqual([]);
    expect(enterValue(hinted, 2)).toBe(hinted);
    expect(eraseCell(hinted)).toBe(hinted);
  });

  it("prefers a forced digit in the selected cell", () => {
    const twoSingles: SudokuPuzzle = {
      ...puzzle,
      givens: [1, 2, 3, 0, 3, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    const hinted = revealHint(selectCell(createPlayState(twoSingles), 7));

    expect(hinted.entries[7]).toBe(2);
    expect(hinted.hinted[7]).toBe(true);
    expect(hinted.entries[3]).toBe(0);
    expect(hinted.selected).toBe(7);
  });

  it("reveals a naked single", () => {
    const nakedPuzzle: SudokuPuzzle = {
      ...puzzle,
      givens: [1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    const hinted = revealHint(createPlayState(nakedPuzzle));

    expect(hinted.entries[3]).toBe(4);
    expect(hinted.hinted[3]).toBe(true);
  });

  it("does not hint while the board contains a mistake", () => {
    const wrong = enterValue(selectCell(createPlayState(puzzle), 1), 3);
    expect(revealHint(wrong)).toBe(wrong);
  });

  it("does not guess when there is no logical move", () => {
    const state = selectCell(createPlayState(sparsePuzzle), 5);
    expect(revealHint(state)).toBe(state);
  });

  it("does nothing when there is nothing left to hint", () => {
    const solved = solveEverything(createPlayState(puzzle));
    expect(revealHint(solved)).toBe(solved);
  });

  it("restarts the current puzzle", () => {
    const started = enterValue(selectCell(createPlayState(puzzle), 1), 2);
    const restarted = restartPuzzle(started);
    expect(filledCount(restarted.entries)).toBe(0);
    expect(restarted.hinted.every((value) => !value)).toBe(true);
    expect(restarted.solved).toBe(false);
  });
});
