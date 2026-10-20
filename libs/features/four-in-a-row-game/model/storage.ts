import {
  BOARD_SIZES,
  COMPUTER_LEVELS,
  MODES,
  PLAYERS,
  type BoardSize,
  type ComputerLevel,
  type FourInARowMode,
  type Player,
} from "@entities/four-in-a-row";
import { readStoredJson, writeStoredJson } from "@shared/lib";
import { DEFAULT_SETTINGS, type FourInARowSettings } from "./settings";

const STORAGE_KEY = "games.vier-op-een-rij.v1";

export interface FourInARowState {
  settings: FourInARowSettings;
  /** Aantal gewonnen partijen per speler; de stand tussen twee kinderen. */
  score: Record<Player, number>;
}

const FALLBACK: FourInARowState = {
  settings: DEFAULT_SETTINGS,
  score: { one: 0, two: 0 },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSize(value: unknown): value is BoardSize {
  return typeof value === "string" && (BOARD_SIZES as readonly string[]).includes(value);
}

function isMode(value: unknown): value is FourInARowMode {
  return typeof value === "string" && (MODES as readonly string[]).includes(value);
}

function isLevel(value: unknown): value is ComputerLevel {
  return typeof value === "string" && (COMPUTER_LEVELS as readonly string[]).includes(value);
}

/** Oude opslag kent alleen de grootte; de rest krijgt de standaardwaarde. */
function toSettings(value: unknown): FourInARowSettings | undefined {
  if (!isRecord(value) || !isSize(value.size)) {
    return undefined;
  }

  return {
    size: value.size,
    mode: isMode(value.mode) ? value.mode : DEFAULT_SETTINGS.mode,
    level: isLevel(value.level) ? value.level : DEFAULT_SETTINGS.level,
  };
}

function isScore(value: unknown): value is Record<Player, number> {
  if (!isRecord(value)) {
    return false;
  }

  return PLAYERS.every((player) => {
    const won = value[player];
    return typeof won === "number" && Number.isInteger(won) && won >= 0;
  });
}

export function loadFourInARowState(): FourInARowState {
  const parsed = readStoredJson(STORAGE_KEY);
  if (!isRecord(parsed)) {
    return FALLBACK;
  }

  return {
    settings: toSettings(parsed.settings) ?? FALLBACK.settings,
    score: isScore(parsed.score) ? parsed.score : FALLBACK.score,
  };
}

export function saveFourInARowState(state: FourInARowState): void {
  writeStoredJson(STORAGE_KEY, state);
}
