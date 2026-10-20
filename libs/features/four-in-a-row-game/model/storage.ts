import { BOARD_SIZES, PLAYERS, type BoardSize, type Player } from "@entities/four-in-a-row";
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

function toSettings(value: unknown): FourInARowSettings | undefined {
  return isRecord(value) && isSize(value.size) ? { size: value.size } : undefined;
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
