import type { Cell, WordSearchPlacement } from "./types";

function sameCell(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}

/**
 * Returns every cell on the straight line between two cells, including both
 * ends. Returns an empty array when the two cells are not on one horizontal,
 * vertical or diagonal line.
 */
export function cellsBetween(start: Cell, end: Cell): Cell[] {
  const rowDelta = end.row - start.row;
  const colDelta = end.col - start.col;

  if (rowDelta !== 0 && colDelta !== 0 && Math.abs(rowDelta) !== Math.abs(colDelta)) {
    return [];
  }

  const steps = Math.max(Math.abs(rowDelta), Math.abs(colDelta));
  const rowStep = Math.sign(rowDelta);
  const colStep = Math.sign(colDelta);

  return Array.from({ length: steps + 1 }, (_, index) => ({
    row: start.row + rowStep * index,
    col: start.col + colStep * index,
  }));
}

/**
 * Checks a selection in both directions. That makes a word count as found
 * whether the child taps it from left to right or the other way around.
 */
export function selectionMatches(placement: WordSearchPlacement, cells: readonly Cell[]): boolean {
  if (cells.length !== placement.cells.length) {
    return false;
  }

  const forward = cells.every((cell, index) => {
    const target = placement.cells[index];
    return target !== undefined && sameCell(cell, target);
  });
  const backward = cells.every((cell, index) => {
    const target = placement.cells[cells.length - 1 - index];
    return target !== undefined && sameCell(cell, target);
  });

  return forward || backward;
}
