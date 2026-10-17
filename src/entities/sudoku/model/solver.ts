import { boxIndexFor } from "./geometry";
import type { Geometry } from "./types";

const POPCOUNT = new Uint8Array(512);
for (let mask = 1; mask < 512; mask += 1) {
  POPCOUNT[mask] = POPCOUNT[mask >> 1] + (mask & 1);
}

const VALUE_OF_BIT = new Int8Array(512);
for (let value = 1; value <= 9; value += 1) {
  VALUE_OF_BIT[1 << (value - 1)] = value;
}

interface Masks {
  rows: Int32Array;
  cols: Int32Array;
  boxes: Int32Array;
}

interface TargetCell {
  index: number;
  candidates: number;
}

function isOutOfRange(value: number, size: number): boolean {
  return !Number.isInteger(value) || value < 0 || value > size;
}

function hasBit(mask: number, bit: number): boolean {
  return (mask & bit) !== 0;
}

function createMasks(values: readonly number[], geometry: Geometry): Masks | null {
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
    if (isOutOfRange(value, size)) {
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

function candidateMask(index: number, masks: Masks, geometry: Geometry): number {
  const row = Math.floor(index / geometry.size);
  const col = index % geometry.size;
  const box = boxIndexFor(index, geometry);
  const used = masks.rows[row] | masks.cols[col] | masks.boxes[box];
  return ((1 << geometry.size) - 1) & ~used;
}

function shuffled(values: number[], random: () => number): number[] {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    const current = values[index];
    values[index] = values[swapWith];
    values[swapWith] = current;
  }
  return values;
}

function bitsOf(mask: number, random?: () => number): number[] {
  const bits: number[] = [];
  let remaining = mask;
  while (remaining !== 0) {
    const bit = remaining & -remaining;
    remaining ^= bit;
    bits.push(bit);
  }
  return random ? shuffled(bits, random) : bits;
}

/**
 * Picks the empty cell with the fewest candidates. Returns false for a dead
 * end (an empty cell without candidates) and null for a completed grid.
 */
function findTarget(
  grid: readonly number[],
  masks: Masks,
  geometry: Geometry,
): TargetCell | null | false {
  const size = geometry.size;
  let target: TargetCell | null = null;
  let bestCount = size + 1;

  for (let index = 0; index < grid.length; index += 1) {
    if (grid[index] !== 0) {
      continue;
    }
    const candidates = candidateMask(index, masks, geometry);
    if (candidates === 0) {
      return false;
    }
    const count = POPCOUNT[candidates];
    if (count < bestCount) {
      target = { index, candidates };
      bestCount = count;
      if (count === 1) {
        break;
      }
    }
  }

  return target;
}

/**
 * Depth-first search with a most-constrained-cell heuristic.
 * Returns up to `limit` complete solutions.
 */
function search(
  input: readonly number[],
  geometry: Geometry,
  limit: number,
  random?: () => number,
): number[][] {
  const { size } = geometry;
  const grid = input.slice();
  const masks = createMasks(grid, geometry);
  if (!masks) {
    return [];
  }

  const solutions: number[][] = [];

  const visit = (): void => {
    if (solutions.length >= limit) {
      return;
    }

    const target = findTarget(grid, masks, geometry);
    if (target === false) {
      return;
    }
    if (target === null) {
      solutions.push(grid.slice());
      return;
    }

    const row = Math.floor(target.index / size);
    const col = target.index % size;
    const box = boxIndexFor(target.index, geometry);

    for (const bit of bitsOf(target.candidates, random)) {
      grid[target.index] = VALUE_OF_BIT[bit];
      masks.rows[row] |= bit;
      masks.cols[col] |= bit;
      masks.boxes[box] |= bit;

      visit();

      masks.rows[row] ^= bit;
      masks.cols[col] ^= bit;
      masks.boxes[box] ^= bit;
      grid[target.index] = 0;

      if (solutions.length >= limit) {
        return;
      }
    }
  };

  visit();
  return solutions;
}

/** Counts solutions, stopping early at `limit` (default 2). */
export function countSolutions(grid: readonly number[], geometry: Geometry, limit = 2): number {
  return search(grid, geometry, limit).length;
}

/** Returns the unique/first solution, or null when the grid has no solution. */
export function solveSudoku(grid: readonly number[], geometry: Geometry): number[] | null {
  const [solution] = search(grid, geometry, 1);
  return solution ?? null;
}

/** Fills an empty grid with a random valid solution. */
export function generateSolution(geometry: Geometry, random: () => number): number[] | null {
  const empty = Array.from({ length: geometry.size * geometry.size }, () => 0);
  const [solution] = search(empty, geometry, 1, random);
  return solution ?? null;
}
