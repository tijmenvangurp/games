import {
  DEFAULT_PLAYER_COLORS,
  MAX_PLAYER_NAME_LENGTH,
  PLAYER_IDS,
  isPlayerColor,
  type Controller,
  type PlayerColor,
  type PlayerId,
} from "@entities/ganzenbord";
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

function toNames(value: unknown): Record<PlayerId, string> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const names = {} as Record<PlayerId, string>;
  for (const id of PLAYER_IDS) {
    const name = value[id];
    if (typeof name !== "string") {
      return undefined;
    }
    names[id] = name.slice(0, MAX_PLAYER_NAME_LENGTH);
  }
  return names;
}

function toColors(value: unknown): Record<PlayerId, PlayerColor> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const colors = {} as Record<PlayerId, PlayerColor>;
  for (const id of PLAYER_IDS) {
    const color = value[id];
    if (!isPlayerColor(color)) {
      return undefined;
    }
    colors[id] = color;
  }

  // Een dubbele kleur maakt de pionnen ononderscheidbaar; dan liever de vaste set.
  return new Set(Object.values(colors)).size === PLAYER_IDS.length
    ? colors
    : { ...DEFAULT_PLAYER_COLORS };
}

function toSettings(value: unknown): GanzenbordSettings | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const controllers = toControllers(value.controllers);
  if (!controllers || !isPlayerCount(value.playerCount)) {
    return undefined;
  }
  return {
    playerCount: value.playerCount,
    controllers,
    names: toNames(value.names) ?? FALLBACK.settings.names,
    colors: toColors(value.colors) ?? FALLBACK.settings.colors,
  };
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
