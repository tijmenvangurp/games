export interface Point {
  x: number;
  y: number;
}

export type MazeDirection = "up" | "right" | "down" | "left";

export type MazeDifficulty = "makkelijk" | "gemiddeld" | "moeilijk" | "super-hard";

export interface MazeArrow {
  id: number;
  /** Points from tail to head. The last segment points in the escape direction. */
  points: readonly Point[];
}

export interface MazeLevel {
  id: string;
  name: string;
  difficulty: MazeDifficulty;
  width: number;
  height: number;
  arrows: readonly MazeArrow[];
}

/** A player may bump into three blocked arrows before the level ends. */
export const MAX_HEARTS = 3;

/** Padding around the puzzle so arrowheads on the edge remain visible. */
export const MAZE_PADDING = 2;
