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
import { playSound, vibrate } from "@shared/lib";
import { loadWordSearchState, saveWordSearchState } from "./storage";
import type { WordSearchSettings } from "./settings";

interface Hint {
  word: string;
  cells: readonly Cell[];
}

interface WordSearchStore {
  puzzle: WordSearchPuzzle | null;
  found: readonly string[];
  lastFound: string | null;
  selected: readonly Cell[];
  wrong: boolean;
  hint: Hint | null;
  settings: WordSearchSettings;
  start: () => void;
  newPuzzle: () => void;
  chooseTheme: (theme: WordSearchTheme) => void;
  chooseDifficulty: (difficulty: WordSearchDifficulty) => void;
  tapCell: (cell: Cell) => void;
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
  set({ puzzle, found: [], lastFound: null, selected: [], wrong: false, hint: null });
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

function handleTap(set: StoreSet, get: StoreGet, cell: Cell): void {
  const { puzzle, found, selected } = get();
  if (!puzzle) {
    return;
  }

  if (selected.length === 0) {
    set({ selected: [cell], wrong: false });
    playSound("tap");
    return;
  }

  const start = selected[0];
  if (!start) {
    return;
  }

  if (start.row === cell.row && start.col === cell.col) {
    set({ selected: [], wrong: false });
    return;
  }

  const cells = cellsBetween(start, cell);
  if (cells.length === 0) {
    set({ selected: [cell], wrong: false });
    playSound("tap");
    return;
  }

  const matched = puzzle.placements.find((placement) => selectionMatches(placement, cells));
  if (!matched) {
    set({ selected: cells, wrong: true });
    playSound("wrong");
    return;
  }

  if (found.includes(matched.word)) {
    set({ selected: [], wrong: false });
    playSound("tap");
    return;
  }

  const nextFound = [...found, matched.word];
  set({ found: nextFound, lastFound: matched.word, selected: [], wrong: false, hint: null });
  playSound("match");
  vibrate(20);
  saveWordSearchState({ settings: get().settings, puzzle, found: nextFound });
}

function handleHint(set: StoreSet, get: StoreGet, word: string): void {
  const { puzzle, found } = get();
  if (!puzzle || found.includes(word)) {
    return;
  }
  const placement = puzzle.placements.find((item) => item.word === word);
  if (!placement) {
    return;
  }
  set({ hint: { word, cells: placement.cells } });
  playSound("hint");
}

const initial = loadWordSearchState();

export const useWordSearchStore = create<WordSearchStore>((set, get) => ({
  puzzle: initial.puzzle,
  found: initial.found,
  lastFound: null,
  selected: [],
  wrong: false,
  hint: null,
  settings: initial.settings,

  start: () => startGame(set, get),
  newPuzzle: () => startGame(set, get),
  chooseTheme: (theme) => setTheme(set, get, theme),
  chooseDifficulty: (difficulty) => setDifficulty(set, get, difficulty),
  tapCell: (cell) => handleTap(set, get, cell),
  clearWrong: () => set({ selected: [], wrong: false }),
  showHint: (word) => handleHint(set, get, word),
  clearHint: () => set({ hint: null }),
}));
