import { boxIndexFor } from "./geometry";
import type { Geometry } from "./types";

export interface Masks {
  rows: Int32Array;
  cols: Int32Array;
  boxes: Int32Array;
}

function hasBit(mask: number, bit: number): boolean {
  return (mask & bit) !== 0;
}

/**
 * Builds the digit masks per row, column and box. Returns null when a value is
 * out of range or the grid already contains a duplicate.
 */
export function createMasks(values: readonly number[], geometry: Geometry): Masks | null {
  const { size } = geometry;
  if (values.length !== size * size) {
    return null;
  }

  const boxCount = (size / geometry.boxRows) * (size / geometry.boxCols);
  const rows = new Int32Array(size);
  const cols = new Int32Array(size);
  const boxes = new Int32Array(boxCount);

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === 0) {
      continue;
    }
    if (!Number.isInteger(value) || value < 1 || value > size) {
      return null;
    }
    const row = Math.floor(index / size);
    const col = index % size;
    const box = boxIndexFor(index, geometry);
    const bit = 1 << (value - 1);
    if (hasBit(rows[row], bit) || hasBit(cols[col], bit) || hasBit(boxes[box], bit)) {
      return null;
    }
    rows[row] |= bit;
    cols[col] |= bit;
    boxes[box] |= bit;
  }

  return { rows, cols, boxes };
}

export function candidateMask(index: number, masks: Masks, geometry: Geometry): number {
  const row = Math.floor(index / geometry.size);
  const col = index % geometry.size;
  const box = boxIndexFor(index, geometry);
  const used = masks.rows[row] | masks.cols[col] | masks.boxes[box];
  return ((1 << geometry.size) - 1) & ~used;
}
