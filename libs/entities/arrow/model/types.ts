export interface Point {
  x: number;
  y: number;
}

export type MazeDirection = "up" | "right" | "down" | "left";

export interface MazeArrow {
  id: number;
  /** Points from tail to head. The last segment points in the escape direction. */
  points: readonly Point[];
}

export interface MazeLevel {
  id: string;
  name: string;
  width: number;
  height: number;
  arrows: readonly MazeArrow[];
}

/** Padding around the puzzle so arrowheads on the edge remain visible. */
export const MAZE_PADDING = 2;
