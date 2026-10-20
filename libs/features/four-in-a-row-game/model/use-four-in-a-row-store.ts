import { create } from "zustand";
import {
  applyDrop,
  BOARD_SHAPES,
  createGame,
  startingPlayerAfter,
  undoDrop,
  winnerOf,
  type BoardSize,
  type FourInARowGame,
  type Player,
} from "@entities/four-in-a-row";
import { playHaptic, playSound } from "@shared/lib";
import type { FourInARowSettings } from "./settings";
import { loadFourInARowState, saveFourInARowState } from "./storage";

type FourInARowDropResult = "ignored" | "dropped" | "won" | "draw";

interface FourInARowStore {
  settings: FourInARowSettings;
  score: Record<Player, number>;
  /** De lopende partij; `null` betekent: eerst kiezen. */
  game: FourInARowGame | null;
  start: (size?: BoardSize) => void;
  drop: (column: number) => FourInARowDropResult;
  undo: () => void;
  resetScore: () => void;
  chooseSize: (size: BoardSize) => void;
}

type FourInARowSet = (partial: Partial<FourInARowStore>) => void;
type FourInARowGet = () => FourInARowStore;

const initial = loadFourInARowState();

function persist(state: FourInARowStore): void {
  saveFourInARowState({ settings: state.settings, score: state.score });
}

/** Een nieuwe partij; de verliezer van de vorige mag beginnen. */
function startAction(set: FourInARowSet, get: FourInARowGet, size?: BoardSize): void {
  const state = get();
  const nextSize = size ?? state.settings.size;

  set({
    settings: { size: nextSize },
    game: createGame(BOARD_SHAPES[nextSize], startingPlayerAfter(state.game)),
  });
  persist(get());
}

function dropAction(set: FourInARowSet, get: FourInARowGet, column: number): FourInARowDropResult {
  const state = get();
  if (!state.game) {
    return "ignored";
  }

  const game = applyDrop(state.game, column);
  if (!game) {
    return "ignored";
  }

  const winner = winnerOf(game);
  playSound(winner ? "match" : "tap");
  playHaptic(winner ? "win" : "tap");

  const score = winner ? { ...state.score, [winner]: state.score[winner] + 1 } : state.score;
  set({ game, score });

  if (winner || game.draw) {
    persist(get());
  }

  if (winner) {
    return "won";
  }
  return game.draw ? "draw" : "dropped";
}

function undoAction(set: FourInARowSet, get: FourInARowGet): void {
  const game = get().game;
  if (!game || game.drops.length === 0) {
    return;
  }

  playSound("tap");
  playHaptic("tap");
  set({ game: undoDrop(game) });
}

function resetScoreAction(set: FourInARowSet, get: FourInARowGet): void {
  set({ score: { one: 0, two: 0 } });
  persist(get());
}

export const useFourInARowStore = create<FourInARowStore>((set, get) => ({
  settings: initial.settings,
  score: initial.score,
  game: null,

  start: (size) => startAction(set, get, size),
  drop: (column) => dropAction(set, get, column),
  undo: () => undoAction(set, get),
  resetScore: () => resetScoreAction(set, get),
  chooseSize: (size) => {
    set({ settings: { size } });
    persist(get());
  },
}));
