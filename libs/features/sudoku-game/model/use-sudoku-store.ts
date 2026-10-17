import { create } from "zustand";
import {
  createPlayState,
  enterValue,
  eraseCell,
  generatePuzzle,
  moveSelection,
  restartPuzzle,
  revealHint,
  selectCell,
  type Difficulty,
  type PlayState,
  type SudokuPuzzle,
  type SudokuSize,
} from "@entities/sudoku";
import { DEFAULT_SETTINGS, type SudokuSettings, type SymbolTheme } from "./settings";
import { loadSudokuState, saveSudokuState } from "./storage";

interface SudokuStore {
  play: PlayState | null;
  settings: SudokuSettings;
  start: (puzzle: SudokuPuzzle) => void;
  newPuzzle: () => void;
  select: (index: number) => void;
  move: (rowDelta: number, colDelta: number) => void;
  enter: (value: number) => void;
  erase: () => void;
  hint: () => void;
  restart: () => void;
  chooseSize: (size: SudokuSize) => void;
  chooseDifficulty: (difficulty: Difficulty) => void;
  chooseTheme: (theme: SymbolTheme) => void;
}

const restored = loadSudokuState();

export const useSudokuStore = create<SudokuStore>((set) => ({
  play: restored?.play ?? null,
  settings: restored?.settings ?? DEFAULT_SETTINGS,

  start: (puzzle) =>
    set((state) => ({
      play: createPlayState(puzzle),
      settings: {
        ...state.settings,
        size: puzzle.size,
        difficulty: puzzle.difficulty,
        theme: puzzle.size === 9 ? "numbers" : state.settings.theme,
      },
    })),

  newPuzzle: () =>
    set((state) => ({
      play: createPlayState(generatePuzzle(state.settings.size, state.settings.difficulty)),
    })),

  select: (index) => set((state) => (state.play ? { play: selectCell(state.play, index) } : {})),

  move: (rowDelta, colDelta) =>
    set((state) => (state.play ? { play: moveSelection(state.play, rowDelta, colDelta) } : {})),

  enter: (value) => set((state) => (state.play ? { play: enterValue(state.play, value) } : {})),

  erase: () => set((state) => (state.play ? { play: eraseCell(state.play) } : {})),

  hint: () => set((state) => (state.play ? { play: revealHint(state.play) } : {})),

  restart: () => set((state) => (state.play ? { play: restartPuzzle(state.play) } : {})),

  chooseSize: (size) =>
    set((state) => ({
      settings: {
        ...state.settings,
        size,
        theme:
          size === 9 ? "numbers" : state.settings.size === 9 ? "animals" : state.settings.theme,
      },
    })),

  chooseDifficulty: (difficulty) =>
    set((state) => ({ settings: { ...state.settings, difficulty } })),

  chooseTheme: (theme) =>
    set((state) => ({
      settings: state.settings.size === 9 ? state.settings : { ...state.settings, theme },
    })),
}));

useSudokuStore.subscribe((state) => {
  saveSudokuState({ play: state.play, settings: state.settings });
});
