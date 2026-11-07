import { PLAYER_IDS, type Controller, type PlayerId } from "@entities/ganzenbord";
import { readStoredJson, writeStoredJson } from "@shared/lib";
import { DEFAULT_SETTINGS, isController, isPlayerCount, type GanzenbordSettings } from "./settings";

const STORAGE_KEY = "games.ganzenbord.v1";

export type Wins = Readonly<Record<PlayerId, number>>;

interface GanzenbordState {
  readonly settings: GanzenbordSettings;
  readonly wins: Wins;
}

const EMPTY_WINS: Wins = { one: 0, two: 0, three: 0, four: 0 };

const FALLBACK: GanzenbordState = {
  settings: DEFAULT_SETTINGS,
  wins: EMPTY_WINS,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toControllers(value: unknown): Record<PlayerId, Controller> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const controllers = {} as Record<PlayerId, Controller>;
  for (const id of PLAYER_IDS) {
    const controller = value[id];
    if (!isController(controller)) {
      return undefined;
    }
    controllers[id] = controller;
  }
  return controllers;
}

function toSettings(value: unknown): GanzenbordSettings | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const controllers = toControllers(value.controllers);
  if (!controllers || !isPlayerCount(value.playerCount)) {
    return undefined;
  }
  return { playerCount: value.playerCount, controllers };
}

function toWins(value: unknown): Wins | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const wins = {} as Record<PlayerId, number>;
  for (const id of PLAYER_IDS) {
    const won = value[id];
    if (typeof won !== "number" || !Number.isInteger(won) || won < 0) {
      return undefined;
    }
    wins[id] = won;
  }
  return wins;
}

export function loadGanzenbordState(): GanzenbordState {
  const parsed = readStoredJson(STORAGE_KEY);
  if (!isRecord(parsed)) {
    return FALLBACK;
  }

  return {
    settings: toSettings(parsed.settings) ?? FALLBACK.settings,
    wins: toWins(parsed.wins) ?? FALLBACK.wins,
  };
}

export function saveGanzenbordState(state: GanzenbordState): void {
  writeStoredJson(STORAGE_KEY, state);
}
