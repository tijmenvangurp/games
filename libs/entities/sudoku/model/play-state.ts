import type { SudokuPuzzle } from "@entities/sudoku";

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

export function revealHint(state: PlayState): PlayState {
  if (state.solved) {
    return state;
  }

  const candidates: number[] = [];
  state.entries.forEach((value, index) => {
    const editable = state.puzzle.givens[index] === 0 && !state.hinted[index];
    if (editable && value !== state.puzzle.solution[index]) {
      candidates.push(index);
    }
  });

  if (candidates.length === 0) {
    return state;
  }

  const target =
    state.selected !== null && candidates.includes(state.selected) ? state.selected : candidates[0];

  const entries = state.entries.slice();
  entries[target] = state.puzzle.solution[target];
  const hinted = state.hinted.slice();
  hinted[target] = true;

  return {
    ...state,
    entries,
    hinted,
    selected: target,
    solved: isComplete(state.puzzle, entries),
  };
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
