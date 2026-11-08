import { create } from "zustand";
import {
  createGame,
  playTurn,
  type Controller,
  type Dice,
  type GanzenbordGame,
  type PlayerId,
  type TurnEvent,
} from "@entities/ganzenbord";
import { playHaptic, playSound } from "@shared/lib";
import { buildTurnAnimation, type TurnAnimation } from "./animation";
import { clampPlayerCount, playersFromSettings, type GanzenbordSettings } from "./settings";
import { loadGanzenbordState, saveGanzenbordState, type Wins } from "./storage";

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function rollDice(): Dice {
  return [rollDie(), rollDie()];
}

interface GanzenbordStore {
  settings: GanzenbordSettings;
  wins: Wins;
  game: GanzenbordGame | null;
  rolling: boolean;
  pendingDice: Dice | null;
  animation: TurnAnimation | null;
  events: readonly TurnEvent[];
  start: () => void;
  setPlayerCount: (count: number) => void;
  setController: (id: PlayerId, controller: Controller) => void;
  beginRoll: () => Dice | null;
  commitRoll: (dice?: Dice) => void;
  advanceAnimation: () => void;
  cancelRoll: () => void;
  resetWins: () => void;
}

const initial = loadGanzenbordState();

function persist(settings: GanzenbordSettings, wins: Wins): void {
  saveGanzenbordState({ settings, wins });
}

export const useGanzenbordStore = create<GanzenbordStore>((set, get) => ({
  settings: initial.settings,
  wins: initial.wins,
  game: null,
  rolling: false,
  pendingDice: null,
  animation: null,
  events: [],

  start: () => {
    const state = get();
    const game = createGame(playersFromSettings(state.settings));
    set({
      game,
      rolling: false,
      pendingDice: null,
      animation: null,
      events: [],
    });
  },

  setPlayerCount: (count) => {
    const state = get();
    const playerCount = clampPlayerCount(count);
    const settings = { ...state.settings, playerCount };
    set({ settings });
    persist(settings, state.wins);
  },

  setController: (id, controller) => {
    const state = get();
    const settings = {
      ...state.settings,
      controllers: { ...state.settings.controllers, [id]: controller },
    };
    set({ settings });
    persist(settings, state.wins);
  },

  beginRoll: () => {
    const state = get();
    if (!state.game || state.game.status !== "playing" || state.rolling || state.animation) {
      return null;
    }

    const current = state.game.players.find((player) => player.id === state.game?.current);
    if (!current || current.stuckOn !== null || current.skipTurns > 0) {
      return null;
    }

    const dice = rollDice();
    set({ rolling: true, pendingDice: dice, events: [] });
    return dice;
  },

  commitRoll: (dice) => {
    const state = get();
    const values = dice ?? state.pendingDice;
    if (!state.game || !values || state.game.status !== "playing" || state.animation) {
      set({ rolling: false, pendingDice: null });
      return;
    }

    let result;
    try {
      result = playTurn(state.game, values);
    } catch {
      set({ rolling: false, pendingDice: null });
      return;
    }

    const player = state.game.players.find((candidate) => candidate.id === state.game?.current);
    if (!player) {
      set({ rolling: false, pendingDice: null });
      return;
    }

    const steps = buildTurnAnimation(player.position, player.id, result);
    set({
      animation: { player: player.id, steps, index: 0, result },
      rolling: false,
      pendingDice: null,
      events: [],
    });
    playSound("tap");
    playHaptic("tap");
  },

  advanceAnimation: () => {
    const animation = get().animation;
    if (!animation) {
      return;
    }

    const next = animation.index + 1;
    if (next < animation.steps.length) {
      set({ animation: { ...animation, index: next } });
      return;
    }

    const winner = animation.result.game.winner;
    const wins = winner ? { ...get().wins, [winner]: get().wins[winner] + 1 } : get().wins;

    set({
      game: animation.result.game,
      animation: null,
      wins,
      events: animation.result.events,
    });

    if (winner) {
      playHaptic("win");
      persist(get().settings, wins);
      return;
    }

    const noteworthy = animation.result.events.some(
      (event) => event.kind === "goose" || event.kind === "bridge" || event.kind === "maze",
    );
    playSound(noteworthy ? "select" : "tap");
    playHaptic("tap");

    if (animation.result.game.status === "draw") {
      persist(get().settings, wins);
    }
  },

  cancelRoll: () => {
    if (get().rolling || get().animation) {
      set({ rolling: false, pendingDice: null, animation: null });
    }
  },

  resetWins: () => {
    const state = get();
    const wins: Wins = { one: 0, two: 0, three: 0, four: 0 };
    set({ wins });
    persist(state.settings, wins);
  },
}));
