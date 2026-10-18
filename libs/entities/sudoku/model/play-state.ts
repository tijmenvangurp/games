import { geometryFor } from "./geometry";
import type { SudokuPuzzle } from "./types";
import { findHint, type SudokuHint } from "./hints";
import { unitsFor } from "./units";

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
 * Counts how often each digit is visible on the board. Index 0 is unused.
 */
export function digitCounts(puzzle: SudokuPuzzle, entries: readonly number[]): number[] {
  const counts = Array.from({ length: puzzle.size + 1 }, () => 0);
  for (let index = 0; index < puzzle.givens.length; index += 1) {
    const value = puzzle.givens[index] || entries[index] || 0;
    if (value !== 0) {
      counts[value] += 1;
    }
  }
  return counts;
}

/**
 * Marks every cell that shares a digit with another cell in the same unit.
 */
function markUnitConflicts(
  indexes: readonly number[],
  values: readonly number[],
  conflicts: Set<number>,
): void {
  const positions = new Map<number, number[]>();
  for (const index of indexes) {
    const value = values[index];
    if (value === 0) {
      continue;
    }
    const matches = positions.get(value) ?? [];
    matches.push(index);
    positions.set(value, matches);
  }
  for (const matches of positions.values()) {
    if (matches.length > 1) {
      for (const index of matches) {
        conflicts.add(index);
      }
    }
  }
}

/**
 * Returns cells that share a digit with another cell in the same row, column
 * or box. These are invalid regardless of the puzzle solution.
 */
export function findConflicts(puzzle: SudokuPuzzle, entries: readonly number[]): Set<number> {
  const values = puzzle.givens.map((given, index) => given || entries[index] || 0);
  const conflicts = new Set<number>();

  for (const unit of unitsFor(geometryFor(puzzle.size))) {
    markUnitConflicts(unit.indexes, values, conflicts);
  }

  return conflicts;
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

export function revealHint(
  state: PlayState,
  hint: SudokuHint | null = findHint(state.puzzle, state.entries, state.selected),
): PlayState {
  if (state.solved || !hint) {
    return state;
  }

  return reveal(state, hint.index, hint.value);
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
