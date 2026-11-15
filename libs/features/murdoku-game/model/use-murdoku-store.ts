import { create } from "zustand";
import type { Cell, PersonId, Puzzle } from "@entities/murdoku";
import {
  createMurdokuPlay,
  selectPerson,
  setMurdokuMode,
  tapMurdokuCell,
  type MurdokuMode,
  type MurdokuPlayState,
} from "./play";

const MAX_HISTORY = 200;

interface MurdokuStore {
  /** De geladen zaak; de pure regels hebben het bord nodig. */
  puzzle: Puzzle | null;
  /** `null` zolang de pagina de zaak nog niet heeft gestart. */
  play: MurdokuPlayState | null;
  /** Eerdere bordtoestanden, voor ongedaan maken. */
  history: MurdokuPlayState[];
  start: (puzzle: Puzzle) => void;
  selectPerson: (person: PersonId) => void;
  setMode: (mode: MurdokuMode) => void;
  tapCell: (cell: Cell) => void;
  undo: () => void;
}

function withHistory(history: MurdokuPlayState[], play: MurdokuPlayState): MurdokuPlayState[] {
  return [...history, play].slice(-MAX_HISTORY);
}

export const useMurdokuStore = create<MurdokuStore>((set, get) => ({
  puzzle: null,
  play: null,
  history: [],

  start: (puzzle) =>
    set({
      puzzle,
      play: createMurdokuPlay(puzzle.id),
      history: [],
    }),

  selectPerson: (person) =>
    set((state) => (state.play ? { play: selectPerson(state.play, person) } : {})),

  setMode: (mode) => set((state) => (state.play ? { play: setMurdokuMode(state.play, mode) } : {})),

  tapCell: (cell) => {
    const { puzzle, play } = get();
    if (!puzzle || !play) return;
    const next = tapMurdokuCell(puzzle, play, cell);
    if (next === play) return;
    set({ play: next, history: withHistory(get().history, play) });
  },

  undo: () =>
    set((state) => {
      const previous = state.history.at(-1);
      if (!previous) return {};
      return { play: previous, history: state.history.slice(0, -1) };
    }),
}));
