import { describe, expect, it } from "vitest";
import {
  countMistakes,
  createPlayState,
  enterValue,
  eraseCell,
  filledCount,
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

  it("moves the selection with bounds", () => {
    const state = selectCell(createPlayState(puzzle), 0);
    expect(moveSelection(state, 0, 1).selected).toBe(1);
    expect(moveSelection(state, -1, -1).selected).toBe(0);
    expect(moveSelection(selectCell(state, 15), 1, 1).selected).toBe(15);
    const noSelection = moveSelection(createPlayState(puzzle), 1, 1);
    expect(noSelection.selected).toBe(5);
  });

  it("reveals a hint in the selected cell", () => {
    const wrong = enterValue(selectCell(createPlayState(puzzle), 1), 3);
    const hinted = revealHint(wrong);

    expect(hinted.entries[1]).toBe(2);
    expect(hinted.hinted[1]).toBe(true);
    expect(countMistakes(hinted.entries, puzzle.solution)).toEqual([]);
    expect(enterValue(hinted, 4)).toBe(hinted);
    expect(eraseCell(hinted)).toBe(hinted);
  });

  it("reveals a hint elsewhere when the selection is a given", () => {
    const state = createPlayState(puzzle);
    const hinted = revealHint(selectCell(state, 0));
    expect(hinted.entries[1]).toBe(2);
    expect(hinted.hinted[1]).toBe(true);
    expect(hinted.selected).toBe(1);
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
