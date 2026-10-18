import type { CrosswordEntry, CrosswordPoint } from "./types";

/** The cells of an entry in reading order, from the first letter to the last. */
export function entryCells(entry: CrosswordEntry): CrosswordPoint[] {
  return Array.from({ length: entry.answer.length }, (_, index) => ({
    row: entry.row + (entry.direction === "down" ? index : 0),
    col: entry.col + (entry.direction === "across" ? index : 0),
  }));
}
