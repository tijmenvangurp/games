import { CLUE_TARGETS, geometryFor } from "./geometry";
import { countSolutions, generateSolution } from "./solver";
import type { Difficulty, Geometry, SudokuPuzzle, SudokuSize } from "./types";

const MAX_ATTEMPTS = 5;

/** Small, fast, deterministic PRNG so a seed always produces the same puzzle. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d_2b_79_f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function createSeed(): number {
  return Math.floor(Math.random() * 0xffff_ffff);
}

export function clueCount(givens: readonly number[]): number {
  return givens.reduce((total, value) => (value === 0 ? total : total + 1), 0);
}

function shuffledIndexes(total: number, random: () => number): number[] {
  const indexes = Array.from({ length: total }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    const current = indexes[index];
    indexes[index] = indexes[swapWith];
    indexes[swapWith] = current;
  }
  return indexes;
}

interface CarveState {
  givens: number[];
  geometry: Geometry;
  target: number;
  clues: number;
}

/** Removes clues only when the solution remains unique. */
function tryRemoveClues(state: CarveState, indexes: readonly number[]): void {
  if (state.clues - indexes.length < state.target) {
    return;
  }

  const backup = indexes.map((index) => state.givens[index]);
  for (const index of indexes) {
    state.givens[index] = 0;
  }

  if (countSolutions(state.givens, state.geometry, 2) === 1) {
    state.clues -= indexes.length;
    return;
  }

  indexes.forEach((index, position) => {
    state.givens[index] = backup[position];
  });
}

function carveSymmetricPairs(state: CarveState, random: () => number): void {
  const total = state.givens.length;
  for (const index of shuffledIndexes(total, random)) {
    if (state.givens[index] === 0) {
      continue;
    }
    const mirror = total - 1 - index;
    const pair = mirror !== index && state.givens[mirror] !== 0 ? [index, mirror] : [index];
    tryRemoveClues(state, pair);
    if (state.clues <= state.target) {
      return;
    }
  }
}

function carveSingles(state: CarveState, random: () => number): void {
  for (const index of shuffledIndexes(state.givens.length, random)) {
    if (state.givens[index] !== 0) {
      tryRemoveClues(state, [index]);
    }
    if (state.clues <= state.target) {
      return;
    }
  }
}

/**
 * Removes clues while the solution stays unique. Cells are tried in
 * rotationally symmetric pairs first, then one by one, until the target
 * number of clues is reached.
 */
function carveGivens(
  solution: readonly number[],
  geometry: Geometry,
  target: number,
  random: () => number,
): number[] {
  const state: CarveState = {
    givens: solution.slice(),
    geometry,
    target,
    clues: solution.length,
  };

  carveSymmetricPairs(state, random);
  if (state.clues > target) {
    carveSingles(state, random);
  }

  return state.givens;
}

/**
 * Generates a puzzle with exactly one solution. The same seed always yields
 * the same puzzle and solution.
 */
export function generatePuzzle(
  size: SudokuSize,
  difficulty: Difficulty,
  seed: number = createSeed(),
): SudokuPuzzle {
  const geometry = geometryFor(size);
  const target = CLUE_TARGETS[size][difficulty];
  const random = mulberry32(seed);

  let best: SudokuPuzzle | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const solution = generateSolution(geometry, random);
    if (!solution) {
      continue;
    }

    const givens = carveGivens(solution, geometry, target, random);
    const puzzle: SudokuPuzzle = { size, difficulty, givens, solution, seed };

    if (!best || clueCount(givens) < clueCount(best.givens)) {
      best = puzzle;
    }
    if (clueCount(givens) <= target) {
      return puzzle;
    }
  }

  if (!best) {
    throw new Error(`Could not generate a ${size}x${size} sudoku`);
  }
  return best;
}
