import { create } from "zustand";
import {
  applyDrop,
  BOARD_SHAPES,
  chooseComputerColumn,
  createGame,
  isFinished,
  startingPlayerAfter,
  undoDrop,
  winnerOf,
  type BoardSize,
  type ComputerLevel,
  type FourInARowGame,
  type FourInARowMode,
  type Player,
} from "@entities/four-in-a-row";
import { playHaptic, playSound } from "@shared/lib";
import type { FourInARowMatch } from "./match";
import type { FourInARowSettings } from "./settings";
import { loadFourInARowState, saveFourInARowState } from "./storage";

type FourInARowDropResult = "ignored" | "dropped" | "won" | "draw";

interface FourInARowStore {
  settings: FourInARowSettings;
  score: Record<Player, number>;
  /** De lopende partij; `null` betekent: eerst kiezen. */
  game: FourInARowGame | null;
  /** Waarmee de lopende partij begon; wijzigen in het menu raakt haar niet. */
  match: FourInARowMatch | null;
  start: (size?: BoardSize) => void;
  drop: (column: number) => FourInARowDropResult;
  playComputer: () => void;
  undo: () => void;
  resetScore: () => void;
  chooseSize: (size: BoardSize) => void;
  chooseMode: (mode: FourInARowMode) => void;
  chooseLevel: (level: ComputerLevel) => void;
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
  const { mode, level } = state.settings;
  // De computer verliest nooit "zijn" startrecht: het kind begint altijd.
  const first: Player = mode === "computer" ? "one" : startingPlayerAfter(state.game);

  set({
    settings: { ...state.settings, size: nextSize },
    match: { mode, level },
    game: createGame(BOARD_SHAPES[nextSize], first),
  });
  persist(get());
}

function commitDrop(set: FourInARowSet, get: FourInARowGet, column: number): FourInARowDropResult {
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

function dropAction(set: FourInARowSet, get: FourInARowGet, column: number): FourInARowDropResult {
  const state = get();
  // Tijdens de beurt van de computer mag het kind niet blijven tikken.
  if (state.match?.mode === "computer" && state.game?.current === "two") {
    return "ignored";
  }
  return commitDrop(set, get, column);
}

function playComputerAction(set: FourInARowSet, get: FourInARowGet): void {
  const state = get();
  if (state.match?.mode !== "computer" || !state.game) {
    return;
  }
  if (state.game.current !== "two" || isFinished(state.game)) {
    return;
  }

  const column = chooseComputerColumn(state.game, state.match.level);
  if (column !== null) {
    commitDrop(set, get, column);
  }
}

function undoAction(set: FourInARowSet, get: FourInARowGet): void {
  const state = get();
  if (!state.game || state.game.drops.length === 0) {
    return;
  }

  let game = undoDrop(state.game);
  // Tegen de computer neem je je eigen zet én het antwoord terug.
  while (state.match?.mode === "computer" && game.current !== "one" && game.drops.length > 0) {
    game = undoDrop(game);
  }

  playSound("tap");
  playHaptic("tap");
  set({ game });
}

function resetScoreAction(set: FourInARowSet, get: FourInARowGet): void {
  set({ score: { one: 0, two: 0 } });
  persist(get());
}

export const useFourInARowStore = create<FourInARowStore>((set, get) => ({
  settings: initial.settings,
  score: initial.score,
  game: null,
  match: null,

  start: (size) => startAction(set, get, size),
  drop: (column) => dropAction(set, get, column),
  playComputer: () => playComputerAction(set, get),
  undo: () => undoAction(set, get),
  resetScore: () => resetScoreAction(set, get),
  chooseSize: (size) => {
    set({ settings: { ...get().settings, size } });
    persist(get());
  },
  chooseMode: (mode) => {
    set({ settings: { ...get().settings, mode } });
    persist(get());
  },
  chooseLevel: (level) => {
    set({ settings: { ...get().settings, level } });
    persist(get());
  },
}));
