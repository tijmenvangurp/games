import { boxIndexFor, geometryFor } from "./geometry";
import type { SudokuPuzzle } from "./types";
import { findHint } from "./hints";

export interface PlayState {
  puzzle: SudokuPuzzle;
  entries: number[];
  hinted: boolean[];
  selected: number | null;
  solved: boolean;
}

export function isComplete(puzzle: SudokuPuzzle, entries: readonly number[]): boolean {
  return entries.every(
    (value, index) => (puzzle.givens[index] || value) === puzzle.solution[index],
  );
}

export function countMistakes(entries: readonly number[], solution: readonly number[]): number[] {
  const mistakes: number[] = [];
  entries.forEach((value, index) => {
    if (value !== 0 && value !== solution[index]) {
      mistakes.push(index);
    }
  });
  return mistakes;
}

export function filledCount(entries: readonly number[]): number {
  return entries.reduce((total, value) => (value === 0 ? total : total + 1), 0);
}

/**
 * Returns the digits that already appear exactly once in every row, column and
 * box. Those digits are complete and cannot be placed anywhere else.
 */
export function completedValues(puzzle: SudokuPuzzle, entries: readonly number[]): Set<number> {
  const { size } = puzzle;
  const geometry = geometryFor(size);
  const boxCount = (size / geometry.boxRows) * (size / geometry.boxCols);
  const rows = Array.from({ length: size }, () => new Uint8Array(size + 1));
  const cols = Array.from({ length: size }, () => new Uint8Array(size + 1));
  const boxes = Array.from({ length: boxCount }, () => new Uint8Array(size + 1));

  for (let index = 0; index < puzzle.givens.length; index += 1) {
    const value = puzzle.givens[index] || entries[index] || 0;
    if (value === 0) {
      continue;
    }
    rows[Math.floor(index / size)][value] += 1;
    cols[index % size][value] += 1;
    boxes[boxIndexFor(index, geometry)][value] += 1;
  }

  const complete = new Set<number>();
  for (let value = 1; value <= size; value += 1) {
    const completeInRows = rows.every((counts) => counts[value] === 1);
    const completeInCols = cols.every((counts) => counts[value] === 1);
    const completeInBoxes = boxes.every((counts) => counts[value] === 1);
    if (completeInRows && completeInCols && completeInBoxes) {
      complete.add(value);
    }
  }
  return complete;
}

export function createPlayState(puzzle: SudokuPuzzle): PlayState {
  return {
    puzzle,
    entries: Array.from({ length: puzzle.givens.length }, () => 0),
    hinted: Array.from({ length: puzzle.givens.length }, () => false),
    selected: null,
    solved: false,
  };
}

export function selectCell(state: PlayState, index: number): PlayState {
  if (index < 0 || index >= state.entries.length) {
    return state;
  }
  return { ...state, selected: index };
}

export function moveSelection(state: PlayState, rowDelta: number, colDelta: number): PlayState {
  const { size } = state.puzzle;
  const current = state.selected ?? 0;
  const row = Math.min(size - 1, Math.max(0, Math.floor(current / size) + rowDelta));
  const col = Math.min(size - 1, Math.max(0, (current % size) + colDelta));
  return { ...state, selected: row * size + col };
}

export function enterValue(state: PlayState, value: number): PlayState {
  const { puzzle, selected } = state;
  if (selected === null || state.solved) {
    return state;
  }
  if (value < 1 || value > puzzle.size) {
    return state;
  }
  if (puzzle.givens[selected] !== 0 || state.hinted[selected]) {
    return state;
  }

  const entries = state.entries.slice();
  entries[selected] = entries[selected] === value ? 0 : value;

  return { ...state, entries, solved: isComplete(puzzle, entries) };
}

export function eraseCell(state: PlayState): PlayState {
  const { selected } = state;
  if (selected === null) {
    return state;
  }
  if (
    state.puzzle.givens[selected] !== 0 ||
    state.hinted[selected] ||
    state.entries[selected] === 0
  ) {
    return state;
  }

  const entries = state.entries.slice();
  entries[selected] = 0;

  return { ...state, entries, solved: false };
}

function reveal(state: PlayState, index: number, value: number): PlayState {
  const entries = state.entries.slice();
  entries[index] = value;
  const hinted = state.hinted.slice();
  hinted[index] = true;

  return {
    ...state,
    entries,
    hinted,
    selected: index,
    solved: isComplete(state.puzzle, entries),
  };
}

export function revealHint(state: PlayState): PlayState {
  if (state.solved) {
    return state;
  }

  const hint = findHint(state.puzzle, state.entries, state.selected);
  return hint ? reveal(state, hint.index, hint.value) : state;
}

export function restartPuzzle(state: PlayState): PlayState {
  return {
    ...state,
    entries: Array.from({ length: state.entries.length }, () => 0),
    hinted: Array.from({ length: state.hinted.length }, () => false),
    selected: null,
    solved: false,
  };
}
