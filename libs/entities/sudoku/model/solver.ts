import { boxIndexFor } from "./geometry";
import { candidateMask, createMasks, type Masks } from "./masks";
import type { Geometry } from "./types";

const POPCOUNT = new Uint8Array(512);
for (let mask = 1; mask < 512; mask += 1) {
  POPCOUNT[mask] = POPCOUNT[mask >> 1] + (mask & 1);
}

const VALUE_OF_BIT = new Int8Array(512);
for (let value = 1; value <= 9; value += 1) {
  VALUE_OF_BIT[1 << (value - 1)] = value;
}

interface TargetCell {
  index: number;
  candidates: number;
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
