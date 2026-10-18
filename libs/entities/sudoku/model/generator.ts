import { getSudoku } from "sudoku-gen";
import { createSeed, mulberry32, shuffledIndexes } from "@shared/lib";
import { CLUE_TARGETS, geometryFor } from "./geometry";
import { countSolutions, generateSolution } from "./solver";
import type { Difficulty, Geometry, SudokuPuzzle, SudokuSize } from "./types";

const MAX_ATTEMPTS = 5;
const PACKAGE_SIZE = 9;
const PACKAGE_CELLS = PACKAGE_SIZE * PACKAGE_SIZE;

type PackageDifficulty = NonNullable<Parameters<typeof getSudoku>[0]>;
type SmallSize = Exclude<SudokuSize, typeof PACKAGE_SIZE>;

const PACKAGE_DIFFICULTIES: Record<Difficulty, PackageDifficulty> = {
  makkelijk: "easy",
  gemiddeld: "medium",
  moeilijk: "hard",
};

export function clueCount(givens: readonly number[]): number {
  return givens.reduce((total, value) => (value === 0 ? total : total + 1), 0);
}

/** Maps a sudoku-gen sequence (`-` for an empty cell) to our number grid. */
function parseSequence(sequence: string, allowEmpty: boolean): number[] {
  if (sequence.length !== PACKAGE_CELLS) {
    throw new Error(`sudoku-gen returned ${sequence.length} cells instead of ${PACKAGE_CELLS}`);
  }

  return Array.from(sequence, (symbol) => {
    if (allowEmpty && symbol === "-") {
      return 0;
    }
    const value = Number(symbol);
    if (!Number.isInteger(value) || value < 1 || value > PACKAGE_SIZE) {
      throw new Error(`sudoku-gen returned an invalid cell: ${symbol}`);
    }
    return value;
  });
}

/**
 * Nine-by-nine puzzles come from sudoku-gen. That package picks a random seed
 * puzzle and random transformations, so the `seed` is only kept as metadata and
 * does not make the result deterministic.
 */
function generatePackagePuzzle(difficulty: Difficulty, seed: number): SudokuPuzzle {
  const generated = getSudoku(PACKAGE_DIFFICULTIES[difficulty]);

  return {
    size: PACKAGE_SIZE,
    difficulty,
    givens: parseSequence(generated.puzzle, true),
    solution: parseSequence(generated.solution, false),
    seed,
  };
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
 * the same puzzle and solution for the 4x4 and 6x6 boards.
 */
function generateSmallPuzzle(
  size: SmallSize,
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

/**
 * Generates a puzzle with exactly one solution. 9x9 puzzles come from
 * sudoku-gen; the smaller boards use the built-in generator because sudoku-gen
 * only supports 9x9.
 */
export function generatePuzzle(
  size: SudokuSize,
  difficulty: Difficulty,
  seed: number = createSeed(),
): SudokuPuzzle {
  return size === PACKAGE_SIZE
    ? generatePackagePuzzle(difficulty, seed)
    : generateSmallPuzzle(size, difficulty, seed);
}
