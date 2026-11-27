import type { BoardShape, BoardSize } from "./types";

export const BOARD_SHAPES: Record<BoardSize, BoardShape> = {
  groot: { columns: 7, rows: 6 },
  klein: { columns: 6, rows: 5 },
};

interface BoardSizeInfo {
  /** Het aantal vakjes, bijvoorbeeld "7 × 6". De naam staat in `texts.ts`. */
  size: string;
}

export const BOARD_SIZE_INFO: Record<BoardSize, BoardSizeInfo> = {
  groot: { size: "7 × 6" },
  klein: { size: "6 × 5" },
};
