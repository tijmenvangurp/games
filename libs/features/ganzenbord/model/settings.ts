import {
  CONTROLLERS,
  DEFAULT_PLAYER_COLORS,
  MAX_PLAYERS,
  MAX_PLAYER_NAME_LENGTH,
  MIN_PLAYERS,
  PLAYER_IDS,
  type Controller,
  type PlayerColor,
  type PlayerId,
  type PlayerSetup,
} from "@entities/ganzenbord";

const PLAYER_COUNTS = [2, 3, 4] as const;

export type PlayerCount = (typeof PLAYER_COUNTS)[number];

export type PlayerName = Readonly<Record<Controller, string>>;
export type PlayerNames = Readonly<Record<PlayerId, PlayerName>>;
export type PlayerColors = Readonly<Record<PlayerId, PlayerColor>>;

export interface GanzenbordSettings {
  readonly playerCount: PlayerCount;
  readonly controllers: Readonly<Record<PlayerId, Controller>>;
  /**
   * Een lege naam betekent: gebruik de standaardnaam van de spelersplek.
   * Mens en computer hebben elk hun eigen naam, zodat wisselen van controller
   * ook echt een andere naam laat zien.
   */
  readonly names: PlayerNames;
  readonly colors: PlayerColors;
}

const ALL_HUMAN: Record<PlayerId, Controller> = {
  one: "human",
  two: "human",
  three: "human",
  four: "human",
};

const NO_NAMES: Record<PlayerId, PlayerName> = {
  one: { human: "", computer: "" },
  two: { human: "", computer: "" },
  three: { human: "", computer: "" },
  four: { human: "", computer: "" },
};

export const DEFAULT_SETTINGS: GanzenbordSettings = {
  playerCount: 2,
  controllers: ALL_HUMAN,
  names: NO_NAMES,
  colors: DEFAULT_PLAYER_COLORS,
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

export function withPlayerName(
  settings: GanzenbordSettings,
  id: PlayerId,
  controller: Controller,
  name: string,
): GanzenbordSettings {
  return {
    ...settings,
    names: {
      ...settings.names,
      [id]: { ...settings.names[id], [controller]: name.slice(0, MAX_PLAYER_NAME_LENGTH) },
    },
  };
}

/**
 * Kiest een kleur voor een speler. Heeft een andere speler die kleur al, dan
 * ruilen ze: zo houdt elke pion altijd een eigen kleur.
 */
export function withPlayerColor(
  settings: GanzenbordSettings,
  id: PlayerId,
  color: PlayerColor,
): GanzenbordSettings {
  const previous = settings.colors[id];
  if (previous === color) {
    return settings;
  }

  const colors = { ...settings.colors };
  for (const other of PLAYER_IDS) {
    if (other !== id && colors[other] === color) {
      colors[other] = previous;
    }
  }
  colors[id] = color;

  return { ...settings, colors };
}

export function playersFromSettings(settings: GanzenbordSettings): PlayerSetup[] {
  return PLAYER_IDS.slice(0, settings.playerCount).map((id) => {
    const controller = settings.controllers[id];
    return {
      id,
      controller,
      color: settings.colors[id],
      name: settings.names[id][controller],
    };
  });
}
