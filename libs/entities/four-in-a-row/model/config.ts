import { BOARD_SIZES, type BoardShape, type BoardSize, type Player } from "./types";

export const BOARD_SHAPES: Record<BoardSize, BoardShape> = {
  groot: { columns: 7, rows: 6 },
  klein: { columns: 6, rows: 5 },
};

interface PlayerInfo {
  label: string;
}

/** Spelers heten naar hun kleur; de kleuren zelf staan in het design systeem. */
export const PLAYER_INFO: Record<Player, PlayerInfo> = {
  one: { label: "Blauw" },
  two: { label: "Bruin" },
};

interface BoardSizeInfo {
  label: string;
  /** Het aantal vakjes, bijvoorbeeld "7 × 6". */
  size: string;
}

export const BOARD_SIZE_INFO: Record<BoardSize, BoardSizeInfo> = {
  groot: { label: "Groot bord", size: "7 × 6" },
  klein: { label: "Klein bord", size: "6 × 5" },
};

export const BOARD_SIZE_OPTIONS = BOARD_SIZES.map((value) => ({
  value,
  label: BOARD_SIZE_INFO[value].label,
}));
