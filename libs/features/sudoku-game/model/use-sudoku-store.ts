import { create } from "zustand";
import {
  createPlayState,
  enterValue,
  eraseCell,
  findHint,
  generatePuzzle,
  moveSelection,
  restartPuzzle,
  revealHint,
  selectCell,
  type Difficulty,
  type PlayState,
  type SudokuHint,
  type SudokuPuzzle,
  type SudokuSize,
} from "@entities/sudoku";
import {
  DEFAULT_SETTINGS,
  type MistakeMode,
  type SudokuSettings,
  type SymbolTheme,
} from "./settings";
import { loadSudokuState, saveSudokuState } from "./storage";

const MAX_HISTORY = 50;

interface SudokuStore {
  play: PlayState | null;
  settings: SudokuSettings;
  history: PlayState[];
  hintPreview: SudokuHint | null;
  hintUnavailable: boolean;
  hintDetailed: boolean;
  start: (puzzle: SudokuPuzzle) => void;
  newPuzzle: () => void;
  select: (index: number) => void;
  move: (rowDelta: number, colDelta: number) => void;
  enter: (value: number) => void;
  erase: () => void;
  previewHint: () => void;
  detailHint: () => void;
  applyHint: () => void;
  undo: () => void;
  restart: () => void;
  chooseSize: (size: SudokuSize) => void;
  chooseDifficulty: (difficulty: Difficulty) => void;
  chooseTheme: (theme: SymbolTheme) => void;
  chooseMistakeMode: (mode: MistakeMode) => void;
}

function withHistory(history: PlayState[], play: PlayState): PlayState[] {
  return [...history, play].slice(-MAX_HISTORY);
}

const clearedHint = { hintPreview: null, hintUnavailable: false, hintDetailed: false };

const restored = loadSudokuState();

export const useSudokuStore = create<SudokuStore>((set) => ({
  play: restored?.play ?? null,
  settings: restored?.settings ?? DEFAULT_SETTINGS,
  history: [],
  hintPreview: null,
  hintUnavailable: false,
  hintDetailed: false,

  start: (puzzle) =>
    set((state) => ({
      play: createPlayState(puzzle),
      settings: {
        ...state.settings,
        size: puzzle.size,
        difficulty: puzzle.difficulty,
        theme: puzzle.size === 9 ? "numbers" : state.settings.theme,
      },
      history: [],
      ...clearedHint,
    })),

  newPuzzle: () =>
    set((state) => ({
      play: createPlayState(generatePuzzle(state.settings.size, state.settings.difficulty)),
      history: [],
      ...clearedHint,
    })),

  select: (index) =>
    set((state) =>
      state.play ? { play: selectCell(state.play, index), ...clearedHint } : clearedHint,
    ),

  move: (rowDelta, colDelta) =>
    set((state) =>
      state.play
        ? { play: moveSelection(state.play, rowDelta, colDelta), ...clearedHint }
        : clearedHint,
    ),

  enter: (value) =>
    set((state) => {
      if (!state.play) {
        return {};
      }
      const play = enterValue(state.play, value);
      if (play === state.play) {
        return clearedHint;
      }
      return {
        play,
        history: withHistory(state.history, state.play),
        ...clearedHint,
      };
    }),

  erase: () =>
    set((state) => {
      if (!state.play) {
        return {};
      }
      const play = eraseCell(state.play);
      if (play === state.play) {
        return clearedHint;
      }
      return {
        play,
        history: withHistory(state.history, state.play),
        ...clearedHint,
      };
    }),

  previewHint: () =>
    set((state) => {
      if (!state.play) {
        return {};
      }
      const hint = findHint(state.play.puzzle, state.play.entries, state.play.selected);
      return { hintPreview: hint, hintUnavailable: hint === null, hintDetailed: false };
    }),

  detailHint: () => set((state) => (state.hintPreview ? { hintDetailed: true } : {})),

  applyHint: () =>
    set((state) => {
      if (!state.play || !state.hintPreview) {
        return {};
      }
      const play = revealHint(state.play, state.hintPreview);
      if (play === state.play) {
        return clearedHint;
      }
      return {
        play,
        history: withHistory(state.history, state.play),
        ...clearedHint,
      };
    }),

  undo: () =>
    set((state) => {
      const previous = state.history.at(-1);
      if (!previous) {
        return {};
      }
      return {
        play: previous,
        history: state.history.slice(0, -1),
        ...clearedHint,
      };
    }),

  restart: () =>
    set((state) => {
      if (!state.play) {
        return {};
      }
      const play = restartPuzzle(state.play);
      return {
        play,
        history: withHistory(state.history, state.play),
        ...clearedHint,
      };
    }),

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

  chooseMistakeMode: (mistakeMode) =>
    set((state) => ({ settings: { ...state.settings, mistakeMode } })),
}));

useSudokuStore.subscribe((state) => {
  saveSudokuState({ play: state.play, settings: state.settings });
});
