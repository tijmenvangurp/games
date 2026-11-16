import { create } from "zustand";
import type { AdaptiveState, Attempt, RoundSummary } from "@entities/adaptive";
import type { Cell, PersonId, Puzzle } from "@entities/murdoku";
import { sameClueFocus, type MurdokuClueFocus } from "../lib/clue-words";
import { evaluateMurdokuRound, type MurdokuRoundInput } from "./adaptive";
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
import { MAX_STORED_ATTEMPTS, restoreMurdokuState, saveMurdokuState } from "./storage";

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
  /** De adaptieve stand: een index in de geordende niveauladder. */
  adaptive: AdaptiveState;
  /** Het begrensde, lokale log van afgeronde en gestopte zaken. */
  attempts: readonly Attempt[];
  /** De uitkomst van de laatste ronde, voor de rustige feedback na een zaak. */
  lastRound: RoundSummary | null;
  /** Wanneer de lopende zaak begon; `null` zonder ronde. */
  roundStartedAt: number | null;
  /** Of de lopende zaak nog als ronde telt; stoppen en oplossen sluiten hem. */
  roundOpen: boolean;
  start: (puzzle: Puzzle) => void;
  selectPerson: (person: PersonId) => void;
  setMode: (mode: MurdokuMode) => void;
  tapCell: (cell: Cell) => void;
  undo: () => void;
  /** Controleert de zaak tegen de oplossing; zie {@link checkMurdokuPlay}. */
  check: (solution: ReadonlyMap<PersonId, Cell>) => void;
  /**
   * Sluit de lopende ronde als het kind weggaat voordat de zaak klaar is.
   * Dat is het "halverwege stoppen" uit ADR 0026; een lege ronde telt niet.
   */
  abandon: () => void;
  /**
   * Eén tik op de hintknop: eerst wijzen (rij, kolom of kamer), daarna één
   * gedwongen zet. De deductie-engine bepaalt de stap; de hint straft nooit.
   */
  showHint: () => void;
  /** Een tik op een woord in een aanwijzing; nog eens tikken heft het op. */
  focusClue: (focus: MurdokuClueFocus, label: string) => void;
  /** De rij en kolom van een geplaatst persoon automatisch wegstrepen. */
  setAutoCross: (enabled: boolean) => void;
}

function withHistory(history: MurdokuPlayState[], play: MurdokuPlayState): MurdokuPlayState[] {
  return [...history, play].slice(-MAX_HISTORY);
}

const CLEARED_HINT = { hint: null, clueFocus: null, clueFocusLabel: null } as const;

/** Het log groeit nooit voorbij de vaste grens uit ADR 0026. */
function appendAttempt(attempts: readonly Attempt[], attempt: Attempt): Attempt[] {
  return [...attempts, attempt].slice(-MAX_STORED_ATTEMPTS);
}

/** Een zaak met een plaatsing, kruisje of hint is begonnen; leeg is geen ronde. */
function hasRoundProgress(play: MurdokuPlayState, hintsUsed: number): boolean {
  return play.placements.size > 0 || play.manualCrosses.size > 0 || hintsUsed > 0;
}

interface FinishedRound {
  adaptive: AdaptiveState;
  attempts: readonly Attempt[];
  lastRound: RoundSummary;
}

/** Past één ronde toe op het niveau en het log. */
function finishRound(
  state: { adaptive: AdaptiveState; attempts: readonly Attempt[] },
  input: MurdokuRoundInput,
): FinishedRound {
  const outcome = evaluateMurdokuRound(state.adaptive, input);
  return {
    adaptive: outcome.summary.state,
    attempts: appendAttempt(state.attempts, outcome.attempt),
    lastRound: outcome.summary,
  };
}

function roundInput(
  state: { play: MurdokuPlayState | null; hintsUsed: number; roundStartedAt: number | null },
  solved: boolean,
  abandoned: boolean,
  at: number,
): MurdokuRoundInput {
  return {
    caseId: state.play?.levelId ?? "",
    solved,
    abandoned,
    hints: state.hintsUsed,
    durationMs: state.roundStartedAt === null ? 0 : Math.max(0, at - state.roundStartedAt),
    at,
  };
}

/** De bewaarde zaak, opgeloste zaken, instellingen en het adaptieve log. */
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
  adaptive: restored.adaptive,
  attempts: restored.attempts,
  lastRound: null,
  roundStartedAt: restored.play?.phase === "playing" ? Date.now() : null,
  roundOpen: restored.play?.phase === "playing",

  start: (puzzle) => {
    const state = get();
    const at = Date.now();
    const previous = state.play;
    const abandoning = Boolean(
      previous &&
      previous.phase === "playing" &&
      state.roundOpen !== false &&
      hasRoundProgress(previous, state.hintsUsed),
    );
    const finished = abandoning
      ? finishRound(state, roundInput({ ...state, play: previous }, false, true, at))
      : {};

    set({
      ...finished,
      puzzle,
      play: createMurdokuPlay(puzzle.id),
      history: [],
      hint: null,
      hintsUsed: 0,
      clueFocus: null,
      clueFocusLabel: null,
      // Opgeloste zaken, instellingen en het niveau blijven staan.
      solvedCaseIds: state.solvedCaseIds,
      settings: state.settings,
      lastRound: null,
      roundStartedAt: at,
      roundOpen: true,
    });
  },

  selectPerson: (person) =>
    set((state) => (state.play ? { play: selectPerson(state.play, person) } : {})),

  setMode: (mode) => set((state) => (state.play ? { play: setMurdokuMode(state.play, mode) } : {})),

  tapCell: (cell) => {
    const { puzzle, play, settings } = get();
    if (!puzzle || !play) return;
    const next = tapMurdokuCell(puzzle, play, cell, {
      autoCross: settings.autoCross,
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
    const { puzzle, play, solvedCaseIds, roundOpen } = get();
    if (!puzzle || !play) return;
    const next = checkMurdokuPlay(puzzle, play, solution);
    if (next === play) return;
    // Controleren verandert hooguit de afloop, nooit de bordgeschiedenis.
    const solved = next.phase === "solved" ? new Set([...solvedCaseIds, puzzle.id]) : solvedCaseIds;

    if (next.phase !== "solved") {
      set({ play: next, solvedCaseIds: solved, ...CLEARED_HINT });
      return;
    }

    // Een ronde die al als gestopt is gelogd, wordt niet nog eens geteld.
    if (roundOpen === false) {
      set({ play: next, solvedCaseIds: solved, ...CLEARED_HINT });
      return;
    }

    const at = Date.now();
    const finished = finishRound(get(), roundInput(get(), true, false, at));
    set({
      play: next,
      solvedCaseIds: solved,
      ...CLEARED_HINT,
      ...finished,
      roundStartedAt: null,
      roundOpen: false,
    });
  },

  abandon: () => {
    const state = get();
    const { play } = state;
    if (!play || play.phase !== "playing" || state.roundOpen === false) return;

    if (!hasRoundProgress(play, state.hintsUsed)) {
      set({ roundStartedAt: null, roundOpen: false });
      return;
    }

    const at = Date.now();
    set({
      ...finishRound(state, roundInput(state, false, true, at)),
      roundStartedAt: null,
      roundOpen: false,
    });
  },

  showHint: () => {
    const { puzzle, play, hint, hintsUsed, history } = get();
    if (!puzzle || !play || play.phase === "solved") return;

    const plan = planMurdokuHint(puzzle, play, hint);
    const nextPlay = plan.apply ? applyMurdokuHint(puzzle, play, plan.apply) : play;
    // Eén hintstap telt bij de eerste tik (de clue-nudge). De tweede tik geeft
    // de exacte plek met de reden, de derde past de zet toe; alleen de eerste
    // tik telt, zodat de niveauteller hints telt en niet tikken.
    const startsStep = hint === null || (hint.stage !== "clue" && hint.stage !== "focus");
    set({
      play: nextPlay,
      history: nextPlay === play ? history : withHistory(history, play),
      hint: plan.state,
      hintsUsed: hintsUsed + (startsStep ? 1 : 0),
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
}));

useMurdokuStore.subscribe((state) => {
  saveMurdokuState({
    play: state.play,
    hint: state.hint,
    hintsUsed: state.hintsUsed,
    solvedCaseIds: state.solvedCaseIds,
    settings: state.settings,
    adaptive: state.adaptive,
    attempts: state.attempts,
  });
});
