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

type MolenspelTapResult = "ignored" | "placed" | "selected" | "moved" | "removed" | "won" | "draw";

interface MolenspelStore {
  game: MolenspelGame;
  /** Of er een spel in beurt is. */
  started: boolean;
  start: (firstPlayer: MolenspelPlayer) => void;
  tap: (point: number) => MolenspelTapResult;
  restart: () => void;
  backToSetup: () => void;
}

const initial = loadMolenspelProgress();

/** Past de tik toe op het spel en geeft het resultaat terug. */
function applyTap(
  game: MolenspelGame,
  point: number,
): { game: MolenspelGame; result: MolenspelTapResult } {
  if (game.awaitRemoval) {
    const next = removePiece(game, point);
    return { game: next, result: next === game ? "ignored" : "removed" };
  }
  if (game.inHand[game.turn] > 0) {
    const next = placePiece(game, point);
    return { game: next, result: next === game ? "ignored" : "placed" };
  }
  if (game.selected !== null) {
    const next = chooseTarget(game, point);
    return { game: next, result: next === game ? "ignored" : "moved" };
  }
  const next = selectPiece(game, point);
  return { game: next, result: next === game ? "ignored" : "selected" };
}

export const useMolenspelStore = create<MolenspelStore>((set, get) => ({
  game: initial?.game ?? createMolenspelGame("wit"),
  started: initial?.started ?? false,

  start: (firstPlayer) => {
    const game = createMolenspelGame(firstPlayer);
    set({ game, started: true });
    saveMolenspelProgress({ game, started: true });
  },

  tap: (point) => {
    const { game, started } = get();
    if (!started || game.winner || game.draw) {
      return "ignored";
    }

    const outcome = applyTap(game, point);
    if (outcome.game === game) {
      return outcome.result;
    }

    set({ game: outcome.game });
    saveMolenspelProgress({ game: outcome.game, started: true });

    if (outcome.game.winner) {
      return "won";
    }
    if (outcome.game.draw) {
      return "draw";
    }
    return outcome.result;
  },

  restart: () => {
    const game = rematchMolenspel(get().game);
    set({ game, started: true });
    saveMolenspelProgress({ game, started: true });
  },

  backToSetup: () => {
    set({ started: false });
    saveMolenspelProgress({ game: get().game, started: false });
  },
}));
