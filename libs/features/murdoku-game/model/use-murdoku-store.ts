import { create } from "zustand";
import type { Cell, PersonId, Puzzle } from "@entities/murdoku";
import { sameClueFocus, type MurdokuClueFocus } from "../lib/clue-words";
import { applyMurdokuHint, planMurdokuHint, type MurdokuHintState } from "./hints";
import {
  checkMurdokuPlay,
  createMurdokuPlay,
  selectPerson,
  setMurdokuMode,
  tapMurdokuCell,
  type MurdokuMode,
  type MurdokuPlayState,
} from "./play";
import type { MurdokuSettings } from "./settings";
import { restoreMurdokuState, saveMurdokuState } from "./storage";

const MAX_HISTORY = 200;

interface MurdokuStore {
  /** De geladen zaak; de pure regels hebben het bord nodig. */
  puzzle: Puzzle | null;
  /** `null` zolang de pagina de zaak nog niet heeft gestart. */
  play: MurdokuPlayState | null;
  /** Eerdere bordtoestanden, voor ongedaan maken. */
  history: MurdokuPlayState[];
  /** Zaken die zijn opgelost; de zaakkeuze toont ze, ook na herladen. */
  solvedCaseIds: ReadonlySet<string>;
  /** De hint die nu op het bord staat; `null` als het kind niets vroeg. */
  hint: MurdokuHintState | null;
  /** Hoe vaak er om een hint is gevraagd. Nooit een straf, alleen een telling. */
  hintsUsed: number;
  /** Het woord uit een aanwijzing dat nu op het bord oplicht. */
  clueFocus: MurdokuClueFocus | null;
  /** Dat woord zoals het in de zin stond, voor de melding onder het bord. */
  clueFocusLabel: string | null;
  /** Voorkeuren van het kind; ze gelden voor elke zaak en blijven bewaard. */
  settings: MurdokuSettings;
  start: (puzzle: Puzzle) => void;
  selectPerson: (person: PersonId) => void;
  setMode: (mode: MurdokuMode) => void;
  tapCell: (cell: Cell) => void;
  undo: () => void;
  /** Controleert de zaak tegen de oplossing; zie {@link checkMurdokuPlay}. */
  check: (solution: ReadonlyMap<PersonId, Cell>) => void;
  /**
   * Eén tik op de hintknop: eerst wijzen (rij, kolom of kamer), daarna één
   * gedwongen zet. De deductie-engine bepaalt de stap; de hint straft nooit.
   */
  showHint: () => void;
  /** Een tik op een woord in een aanwijzing; nog eens tikken heft het op. */
  focusClue: (focus: MurdokuClueFocus, label: string) => void;
  /** De rij en kolom van een geplaatst persoon automatisch wegstrepen. */
  setAutoCross: (enabled: boolean) => void;
  /** Ook een kruisje mogen zetten op een vakje waar niemand kan staan. */
  setCrossOnBlocked: (enabled: boolean) => void;
}

function withHistory(history: MurdokuPlayState[], play: MurdokuPlayState): MurdokuPlayState[] {
  return [...history, play].slice(-MAX_HISTORY);
}

const CLEARED_HINT = { hint: null, clueFocus: null, clueFocusLabel: null } as const;

/** De bewaarde zaak, opgeloste zaken en instellingen van de vorige keer. */
const restored = restoreMurdokuState();

export const useMurdokuStore = create<MurdokuStore>((set, get) => ({
  puzzle: restored.puzzle,
  play: restored.play,
  history: [],
  solvedCaseIds: restored.solvedCaseIds,
  hint: restored.hint,
  hintsUsed: restored.hintsUsed,
  clueFocus: null,
  clueFocusLabel: null,
  settings: restored.settings,

  start: (puzzle) =>
    set((state) => ({
      puzzle,
      play: createMurdokuPlay(puzzle.id),
      history: [],
      hint: null,
      hintsUsed: 0,
      clueFocus: null,
      clueFocusLabel: null,
      // Opgeloste zaken en instellingen blijven staan als het kind een nieuwe zaak kiest.
      solvedCaseIds: state.solvedCaseIds,
      settings: state.settings,
    })),

  selectPerson: (person) =>
    set((state) => (state.play ? { play: selectPerson(state.play, person) } : {})),

  setMode: (mode) => set((state) => (state.play ? { play: setMurdokuMode(state.play, mode) } : {})),

  tapCell: (cell) => {
    const { puzzle, play, settings } = get();
    if (!puzzle || !play) return;
    const next = tapMurdokuCell(puzzle, play, cell, {
      autoCross: settings.autoCross,
      crossOnBlocked: settings.crossOnBlocked,
    });
    if (next === play) return;
    set({ play: next, history: withHistory(get().history, play), ...CLEARED_HINT });
  },

  undo: () =>
    set((state) => {
      if (state.play?.phase === "solved") return {};
      const previous = state.history.at(-1);
      if (!previous) return {};
      return {
        play: previous,
        history: state.history.slice(0, -1),
        ...CLEARED_HINT,
      };
    }),

  check: (solution) => {
    const { puzzle, play, solvedCaseIds } = get();
    if (!puzzle || !play) return;
    const next = checkMurdokuPlay(puzzle, play, solution);
    if (next === play) return;
    // Controleren verandert hooguit de afloop, nooit de bordgeschiedenis.
    const solved = next.phase === "solved" ? new Set([...solvedCaseIds, puzzle.id]) : solvedCaseIds;
    set({ play: next, solvedCaseIds: solved, ...CLEARED_HINT });
  },

  showHint: () => {
    const { puzzle, play, hint, hintsUsed, history } = get();
    if (!puzzle || !play || play.phase === "solved") return;

    const plan = planMurdokuHint(puzzle, play, hint);
    const nextPlay = plan.apply ? applyMurdokuHint(puzzle, play, plan.apply) : play;
    set({
      play: nextPlay,
      history: nextPlay === play ? history : withHistory(history, play),
      hint: plan.state,
      hintsUsed: hintsUsed + 1,
      // Een hint vervangt de markering van een woord; het bord toont één uitleg.
      clueFocus: null,
      clueFocusLabel: null,
    });
  },

  focusClue: (focus, label) =>
    set((state) => {
      const active = sameClueFocus(state.clueFocus, focus);
      return {
        clueFocus: active ? null : focus,
        clueFocusLabel: active ? null : label,
        hint: null,
      };
    }),

  setAutoCross: (autoCross) => set((state) => ({ settings: { ...state.settings, autoCross } })),

  setCrossOnBlocked: (crossOnBlocked) =>
    set((state) => ({ settings: { ...state.settings, crossOnBlocked } })),
}));

useMurdokuStore.subscribe((state) => {
  saveMurdokuState({
    play: state.play,
    hint: state.hint,
    hintsUsed: state.hintsUsed,
    solvedCaseIds: state.solvedCaseIds,
    settings: state.settings,
  });
});
