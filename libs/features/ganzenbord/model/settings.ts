import {
  CONTROLLERS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  PLAYER_IDS,
  type Controller,
  type PlayerId,
  type PlayerSetup,
} from "@entities/ganzenbord";

const PLAYER_COUNTS = [2, 3, 4] as const;

export type PlayerCount = (typeof PLAYER_COUNTS)[number];

export interface GanzenbordSettings {
  readonly playerCount: PlayerCount;
  readonly controllers: Readonly<Record<PlayerId, Controller>>;
}

const ALL_HUMAN: Record<PlayerId, Controller> = {
  one: "human",
  two: "human",
  three: "human",
  four: "human",
};

export const DEFAULT_SETTINGS: GanzenbordSettings = {
  playerCount: 2,
  controllers: ALL_HUMAN,
};

export const PLAYER_COUNT_OPTIONS = PLAYER_COUNTS.map((value) => ({
  value,
  label: `${value} spelers`,
}));

export const CONTROLLER_OPTIONS: readonly { value: Controller; label: string }[] = [
  { value: "human", label: "Mens" },
  { value: "computer", label: "Computer" },
];

export function isController(value: unknown): value is Controller {
  return typeof value === "string" && (CONTROLLERS as readonly string[]).includes(value);
}

export function isPlayerCount(value: unknown): value is PlayerCount {
  return typeof value === "number" && (PLAYER_COUNTS as readonly number[]).includes(value);
}

export function clampPlayerCount(value: number): PlayerCount {
  if (!Number.isInteger(value) || value <= MIN_PLAYERS) {
    return MIN_PLAYERS;
  }
  if (value >= MAX_PLAYERS) {
    return MAX_PLAYERS;
  }
  return value as PlayerCount;
}

export function playersFromSettings(settings: GanzenbordSettings): PlayerSetup[] {
  return PLAYER_IDS.slice(0, settings.playerCount).map((id) => ({
    id,
    controller: settings.controllers[id],
  }));
}
