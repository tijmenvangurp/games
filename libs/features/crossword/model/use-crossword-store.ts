import { create } from "zustand";
import {
  entryCells,
  POKEMON_CROSSWORD,
  type CrosswordDirection,
  type CrosswordEntry,
  type CrosswordPoint,
  type CrosswordPuzzle,
} from "@entities/crossword";
import { playHaptic, playSound } from "@shared/lib";
import { loadCrosswordLetters, saveCrosswordLetters } from "./storage";

interface Evaluation {
  complete: boolean;
  wrong: Set<string>;
  solved: boolean;
}

interface CrosswordStore {
  puzzle: CrosswordPuzzle;
  letters: Record<string, string>;
  selected: CrosswordPoint | null;
  direction: CrosswordDirection;
  entryIndex: number | null;
  wrong: ReadonlySet<string>;
  hinted: ReadonlySet<string>;
  solved: boolean;
  checked: boolean;
  start: () => void;
  restart: () => void;
  selectCell: (row: number, col: number) => void;
  selectEntry: (index: number) => void;
  typeLetter: (letter: string) => void;
  backspace: () => void;
  move: (rowDelta: number, colDelta: number) => void;
  check: () => void;
  hint: () => void;
}

type StoreSet = (
  partial: Partial<CrosswordStore> | ((state: CrosswordStore) => Partial<CrosswordStore>),
) => void;

type StoreGet = () => CrosswordStore;

function cellKey(cell: CrosswordPoint): string {
  return `${cell.row}:${cell.col}`;
}

function entryCellIndex(entry: CrosswordEntry, cell: CrosswordPoint): number {
  return entryCells(entry).findIndex((point) => point.row === cell.row && point.col === cell.col);
}

function entriesAt(
  puzzle: CrosswordPuzzle,
  row: number,
  col: number,
): { entry: CrosswordEntry; index: number }[] {
  return puzzle.entries.flatMap((entry, index) => {
    const contains = entryCells(entry).some((cell) => cell.row === row && cell.col === col);
    return contains ? [{ entry, index }] : [];
  });
}

function evaluate(puzzle: CrosswordPuzzle, letters: Record<string, string>): Evaluation {
  const wrong = new Set<string>();
  let complete = true;

  for (const cell of puzzle.cells.flat()) {
    if (!cell.solution) {
      continue;
    }
    const letter = letters[cellKey(cell)];
    if (!letter) {
      complete = false;
    } else if (letter !== cell.solution) {
      wrong.add(cellKey(cell));
    }
  }

  return { complete, wrong, solved: complete && wrong.size === 0 };
}

function startGame(set: StoreSet): void {
  const puzzle = POKEMON_CROSSWORD;
  const letters = loadCrosswordLetters(puzzle);
  const first = puzzle.entries[0];
  const evaluation = evaluate(puzzle, letters);

  set({
    letters,
    selected: first ? { row: first.row, col: first.col } : null,
    direction: first?.direction ?? "across",
    entryIndex: first ? 0 : null,
    wrong: new Set(),
    hinted: new Set(),
    solved: evaluation.solved,
    checked: false,
  });
}

function restartGame(set: StoreSet): void {
  const puzzle = POKEMON_CROSSWORD;
  const first = puzzle.entries[0];
  saveCrosswordLetters({});

  set({
    letters: {},
    selected: first ? { row: first.row, col: first.col } : null,
    direction: first?.direction ?? "across",
    entryIndex: first ? 0 : null,
    wrong: new Set(),
    hinted: new Set(),
    solved: false,
    checked: false,
  });
}

function selectCellAction(set: StoreSet, get: StoreGet, row: number, col: number): void {
  const { puzzle, selected, direction } = get();
  const options = entriesAt(puzzle, row, col);
  if (options.length === 0) {
    return;
  }

  if (selected?.row === row && selected.col === col) {
    const other = options.find((option) => option.entry.direction !== direction);
    if (other) {
      set({ direction: other.entry.direction, entryIndex: other.index });
      return;
    }
  }

  const chosen = options.find((option) => option.entry.direction === direction) ?? options[0];
  if (!chosen) {
    return;
  }
  set({
    selected: { row, col },
    direction: chosen.entry.direction,
    entryIndex: chosen.index,
  });
}

function selectEntryAction(set: StoreSet, get: StoreGet, index: number): void {
  const entry = get().puzzle.entries[index];
  if (!entry) {
    return;
  }
  set({
    entryIndex: index,
    direction: entry.direction,
    selected: { row: entry.row, col: entry.col },
  });
}

function normalizeLetter(value: string): string | null {
  const letter = value.toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : null;
}

function nextCellInEntry(
  entry: CrosswordEntry | undefined,
  selected: CrosswordPoint,
): CrosswordPoint {
  if (!entry) {
    return selected;
  }
  const cells = entryCells(entry);
  const index = entryCellIndex(entry, selected);
  return index >= 0 && index + 1 < cells.length ? (cells[index + 1] ?? selected) : selected;
}

function backspaceTarget(
  letters: Record<string, string>,
  selected: CrosswordPoint,
  entry: CrosswordEntry | undefined,
  cells: readonly CrosswordPoint[],
): CrosswordPoint {
  if (letters[cellKey(selected)]) {
    return selected;
  }
  const index = entry ? entryCellIndex(entry, selected) : -1;
  return index > 0 ? (cells[index - 1] ?? selected) : selected;
}

function typeLetterAction(set: StoreSet, get: StoreGet, value: string): void {
  const state = get();
  if (state.solved || !state.selected) {
    return;
  }

  const letter = normalizeLetter(value);
  if (!letter) {
    return;
  }

  const key = cellKey(state.selected);
  const nextLetters = { ...state.letters, [key]: letter };
  const nextHinted = new Set(state.hinted);
  nextHinted.delete(key);

  const entry = state.entryIndex === null ? undefined : state.puzzle.entries[state.entryIndex];
  const nextSelected = nextCellInEntry(entry, state.selected);
  const evaluation = evaluate(state.puzzle, nextLetters);

  set({
    letters: nextLetters,
    selected: nextSelected,
    wrong: evaluation.complete ? evaluation.wrong : new Set(),
    hinted: nextHinted,
    solved: evaluation.solved,
    checked: evaluation.complete,
  });
  saveCrosswordLetters(nextLetters);

  if (evaluation.solved) {
    playSound("win");
    playHaptic("win");
  }
}

function backspaceAction(set: StoreSet, get: StoreGet): void {
  const state = get();
  if (state.solved || !state.selected) {
    return;
  }

  const entry = state.entryIndex === null ? undefined : state.puzzle.entries[state.entryIndex];
  const cells = entry ? entryCells(entry) : [];
  const target = backspaceTarget(state.letters, state.selected, entry, cells);
  const targetKey = cellKey(target);
  if (!state.letters[targetKey]) {
    set({ selected: target });
    return;
  }

  const nextLetters = { ...state.letters };
  delete nextLetters[targetKey];
  const nextHinted = new Set(state.hinted);
  nextHinted.delete(targetKey);

  set({
    letters: nextLetters,
    selected: target,
    wrong: new Set(),
    hinted: nextHinted,
    checked: false,
  });
  saveCrosswordLetters(nextLetters);
}

function moveAction(set: StoreSet, get: StoreGet, rowDelta: number, colDelta: number): void {
  const { puzzle, selected } = get();
  if (!selected) {
    return;
  }
  const row = selected.row + rowDelta;
  const col = selected.col + colDelta;
  if (!puzzle.cells[row]?.[col]?.solution) {
    return;
  }
  selectCellAction(set, get, row, col);
}

function checkAction(set: StoreSet, get: StoreGet): void {
  const { puzzle, letters } = get();
  const evaluation = evaluate(puzzle, letters);
  set({ wrong: evaluation.wrong, solved: evaluation.solved, checked: true });

  if (evaluation.solved) {
    playSound("win");
    playHaptic("win");
  } else if (evaluation.wrong.size > 0) {
    playSound("wrong");
    playHaptic("wrong");
  } else {
    playSound("tap");
    playHaptic("tap");
  }
}

function hintAction(set: StoreSet, get: StoreGet): void {
  const { puzzle, letters, selected, hinted, solved } = get();
  if (solved || !selected) {
    return;
  }

  const cell = puzzle.cells[selected.row]?.[selected.col];
  if (!cell?.solution) {
    return;
  }

  const key = cellKey(selected);
  const nextLetters = { ...letters, [key]: cell.solution };
  const nextHinted = new Set(hinted);
  nextHinted.add(key);
  const evaluation = evaluate(puzzle, nextLetters);

  set({
    letters: nextLetters,
    hinted: nextHinted,
    wrong: new Set(),
    solved: evaluation.solved,
    checked: evaluation.complete,
  });
  saveCrosswordLetters(nextLetters);
  playSound("hint");
  playHaptic("hint");

  if (evaluation.solved) {
    playSound("win");
    playHaptic("win");
  }
}

export const useCrosswordStore = create<CrosswordStore>((set, get) => ({
  puzzle: POKEMON_CROSSWORD,
  letters: {},
  selected: null,
  direction: "across",
  entryIndex: null,
  wrong: new Set(),
  hinted: new Set(),
  solved: false,
  checked: false,

  start: () => startGame(set),
  restart: () => restartGame(set),
  selectCell: (row, col) => selectCellAction(set, get, row, col),
  selectEntry: (index) => selectEntryAction(set, get, index),
  typeLetter: (letter) => typeLetterAction(set, get, letter),
  backspace: () => backspaceAction(set, get),
  move: (rowDelta, colDelta) => moveAction(set, get, rowDelta, colDelta),
  check: () => checkAction(set, get),
  hint: () => hintAction(set, get),
}));
