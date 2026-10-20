import { create } from "zustand";
import {
  chooseTarget,
  createMolenspelGame,
  placePiece,
  rematchMolenspel,
  removePiece,
  selectPiece,
  type MolenspelGame,
  type MolenspelPlayer,
} from "@entities/molenspel";
import { loadMolenspelProgress, saveMolenspelProgress } from "./storage";

/** Het resultaat van een tik op het bord. */
type MolenspelTapResult =
  | "ignored"
  | "placed"
  | "selected"
  | "deselected"
  | "moved"
  | "removed"
  | "won"
  | "draw";

interface MolenspelStore {
  game: MolenspelGame;
  /** Eerdere standen, zodat een zet terug te draaien is. */
  history: MolenspelGame[];
  /** Of er een spel in beurt is. */
  started: boolean;
  start: (firstPlayer: MolenspelPlayer) => void;
  tap: (point: number) => MolenspelTapResult;
  undo: () => void;
  restart: () => void;
  backToSetup: () => void;
}

const MAX_HISTORY = 50;

const initial = loadMolenspelProgress();

/** Past de tik toe op het spel en geeft het resultaat terug. */
function tapRemoval(
  game: MolenspelGame,
  point: number,
): { game: MolenspelGame; result: MolenspelTapResult } {
  const next = removePiece(game, point);
  return { game: next, result: next === game ? "ignored" : "removed" };
}

function tapPlacement(
  game: MolenspelGame,
  point: number,
): { game: MolenspelGame; result: MolenspelTapResult } {
  const next = placePiece(game, point);
  return { game: next, result: next === game ? "ignored" : "placed" };
}

function tapWithSelection(
  game: MolenspelGame,
  point: number,
): { game: MolenspelGame; result: MolenspelTapResult } {
  const next = chooseTarget(game, point);
  if (next !== game) {
    return { game: next, result: "moved" };
  }
  // Tik naast een geldig doel: kies een andere steen als dat kan.
  const reselected = selectPiece(game, point);
  if (reselected === game) {
    return { game, result: "ignored" };
  }
  return { game: reselected, result: reselected.selected === null ? "deselected" : "selected" };
}

function tapSelection(
  game: MolenspelGame,
  point: number,
): { game: MolenspelGame; result: MolenspelTapResult } {
  const next = selectPiece(game, point);
  return { game: next, result: next === game ? "ignored" : "selected" };
}

function applyTap(
  game: MolenspelGame,
  point: number,
): { game: MolenspelGame; result: MolenspelTapResult } {
  if (game.awaitRemoval) {
    return tapRemoval(game, point);
  }
  if (game.inHand[game.turn] > 0) {
    return tapPlacement(game, point);
  }
  if (game.selected !== null) {
    return tapWithSelection(game, point);
  }
  return tapSelection(game, point);
}

function withHistory(history: MolenspelGame[], game: MolenspelGame): MolenspelGame[] {
  return [...history, game].slice(-MAX_HISTORY);
}

export const useMolenspelStore = create<MolenspelStore>((set, get) => ({
  game: initial?.game ?? createMolenspelGame("wit"),
  history: [],
  started: initial?.started ?? false,

  start: (firstPlayer) => {
    const game = createMolenspelGame(firstPlayer);
    set({ game, history: [], started: true });
    saveMolenspelProgress({ game, started: true });
  },

  tap: (point) => {
    const { game, started, history } = get();
    if (!started || game.winner || game.draw) {
      return "ignored";
    }

    const outcome = applyTap(game, point);
    if (outcome.game === game) {
      return outcome.result;
    }

    set({ game: outcome.game, history: withHistory(history, game) });
    saveMolenspelProgress({ game: outcome.game, started: true });

    if (outcome.game.winner) {
      return "won";
    }
    if (outcome.game.draw) {
      return "draw";
    }
    return outcome.result;
  },

  undo: () => {
    const { history, started } = get();
    if (!started || history.length === 0) {
      return;
    }
    const game = history[history.length - 1] as MolenspelGame;
    set({ game, history: history.slice(0, -1) });
    saveMolenspelProgress({ game, started: true });
  },

  restart: () => {
    const game = rematchMolenspel(get().game);
    set({ game, history: [], started: true });
    saveMolenspelProgress({ game, started: true });
  },

  backToSetup: () => {
    set({ started: false });
    saveMolenspelProgress({ game: get().game, started: false });
  },
}));
