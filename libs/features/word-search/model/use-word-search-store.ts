import { create } from "zustand";
import {
  cellsBetween,
  createWordSearch,
  selectionMatches,
  type Cell,
  type WordSearchDifficulty,
  type WordSearchPuzzle,
  type WordSearchTheme,
} from "@entities/word-search";
import { playHaptic, playSound } from "@shared/lib";
import { loadWordSearchState, saveWordSearchState } from "./storage";
import type { WordSearchSettings } from "./settings";

interface Hint {
  word: string;
  cells: readonly Cell[];
  /** 1 = first letter only, 2 = the whole placement. */
  stage: 1 | 2;
}

interface WordSearchStore {
  puzzle: WordSearchPuzzle | null;
  found: readonly string[];
  lastFound: string | null;
  selected: readonly Cell[];
  dragStart: Cell | null;
  wrong: boolean;
  hint: Hint | null;
  settings: WordSearchSettings;
  start: () => void;
  newPuzzle: () => void;
  chooseTheme: (theme: WordSearchTheme) => void;
  chooseDifficulty: (difficulty: WordSearchDifficulty) => void;
  tapCell: (cell: Cell) => void;
  startDrag: (cell: Cell) => void;
  dragTo: (cell: Cell) => void;
  commitDrag: () => void;
  cancelDrag: () => void;
  clearWrong: () => void;
  showHint: (word: string) => void;
  clearHint: () => void;
}

type StoreSet = (
  partial: Partial<WordSearchStore> | ((state: WordSearchStore) => Partial<WordSearchStore>),
) => void;

type StoreGet = () => WordSearchStore;

function startGame(set: StoreSet, get: StoreGet): void {
  const { settings } = get();
  const puzzle = createWordSearch(settings.theme, settings.difficulty);
  set({
    puzzle,
    found: [],
    lastFound: null,
    selected: [],
    dragStart: null,
    wrong: false,
    hint: null,
  });
  saveWordSearchState({ settings, puzzle, found: [] });
}

function setTheme(set: StoreSet, get: StoreGet, theme: WordSearchTheme): void {
  const settings = { ...get().settings, theme };
  set({ settings });
  saveWordSearchState({ settings, puzzle: get().puzzle, found: get().found });
}

function setDifficulty(set: StoreSet, get: StoreGet, difficulty: WordSearchDifficulty): void {
  const settings = { ...get().settings, difficulty };
  set({ settings });
  saveWordSearchState({ settings, puzzle: get().puzzle, found: get().found });
}

function resolveSelection(set: StoreSet, get: StoreGet, cells: readonly Cell[]): void {
  const { puzzle, found } = get();
  if (!puzzle) {
    return;
  }

  const matched = puzzle.placements.find((placement) => selectionMatches(placement, cells));
  if (!matched) {
    set({ selected: cells, dragStart: null, wrong: true, lastFound: null });
    return;
  }

  if (found.includes(matched.word)) {
    set({ selected: [], dragStart: null, wrong: false });
    playSound("tap");
    playHaptic("tap");
    return;
  }

  const nextFound = [...found, matched.word];
  set({
    found: nextFound,
    lastFound: matched.word,
    selected: [],
    dragStart: null,
    wrong: false,
    hint: null,
  });
  playSound("match");
  playHaptic("match");
  saveWordSearchState({ settings: get().settings, puzzle, found: nextFound });
}

function handleTap(set: StoreSet, get: StoreGet, cell: Cell): void {
  const { puzzle, selected } = get();
  if (!puzzle) {
    return;
  }

  if (selected.length === 0) {
    set({ selected: [cell], dragStart: null, wrong: false, lastFound: null });
    playSound("tap");
    return;
  }

  const start = selected[0];
  if (!start) {
    return;
  }

  if (start.row === cell.row && start.col === cell.col) {
    set({ selected: [], dragStart: null, wrong: false, lastFound: null });
    return;
  }

  const cells = cellsBetween(start, cell);
  if (cells.length === 0) {
    set({ selected: [cell], dragStart: null, wrong: false, lastFound: null });
    playSound("tap");
    return;
  }

  resolveSelection(set, get, cells);
}

function startDrag(set: StoreSet, cell: Cell): void {
  set({ selected: [cell], dragStart: cell, wrong: false, lastFound: null });
}

function dragTo(set: StoreSet, get: StoreGet, cell: Cell): void {
  const { dragStart } = get();
  if (!dragStart) {
    return;
  }

  const cells = cellsBetween(dragStart, cell);
  if (cells.length === 0) {
    return;
  }

  set({ selected: cells, wrong: false });
}

function commitDrag(set: StoreSet, get: StoreGet): void {
  const { selected } = get();
  set({ dragStart: null });
  if (selected.length >= 2) {
    resolveSelection(set, get, selected);
  }
}

function cancelDrag(set: StoreSet): void {
  set({ selected: [], dragStart: null, wrong: false, lastFound: null });
}

function handleHint(set: StoreSet, get: StoreGet, word: string): void {
  const { puzzle, found, hint } = get();
  if (!puzzle || found.includes(word)) {
    return;
  }
  const placement = puzzle.placements.find((item) => item.word === word);
  if (!placement) {
    return;
  }
  // First click shows only the first letter; a second click on the same word
  // shows the placement. The child still has to trace the word.
  const stage = hint?.word === word ? 2 : 1;
  const cells = stage === 1 ? placement.cells.slice(0, 1) : placement.cells;
  set({ hint: { word, cells, stage } });
  playSound("hint");
}

const initial = loadWordSearchState();

export const useWordSearchStore = create<WordSearchStore>((set, get) => ({
  puzzle: initial.puzzle,
  found: initial.found,
  lastFound: null,
  selected: [],
  dragStart: null,
  wrong: false,
  hint: null,
  settings: initial.settings,

  start: () => startGame(set, get),
  newPuzzle: () => startGame(set, get),
  chooseTheme: (theme) => setTheme(set, get, theme),
  chooseDifficulty: (difficulty) => setDifficulty(set, get, difficulty),
  tapCell: (cell) => handleTap(set, get, cell),
  startDrag: (cell) => startDrag(set, cell),
  dragTo: (cell) => dragTo(set, get, cell),
  commitDrag: () => commitDrag(set, get),
  cancelDrag: () => cancelDrag(set),
  clearWrong: () => set({ selected: [], dragStart: null, wrong: false }),
  showHint: (word) => handleHint(set, get, word),
  clearHint: () => set({ hint: null }),
}));
