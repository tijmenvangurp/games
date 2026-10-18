import { geometryFor } from "./geometry";
import { candidateMask, createMasks } from "./masks";
import type { SudokuPuzzle } from "./types";
import { unitsFor, type Unit, type UnitKind } from "./units";

type HintTechnique = "naked-single" | "hidden-single";

type HintUnit = UnitKind;

export interface SudokuHint {
  index: number;
  value: number;
  technique: HintTechnique;
  unit: HintUnit | null;
  /** Cells of the unit the hint is based on, for highlighting. */
  related: number[];
}

interface CandidateBoard {
  values: number[];
  candidates: Int32Array;
  geometry: ReturnType<typeof geometryFor>;
}

function popcount(mask: number): number {
  let count = 0;
  for (let remaining = mask; remaining !== 0; remaining &= remaining - 1) {
    count += 1;
  }
  return count;
}

function valueOfBit(bit: number): number {
  return 32 - Math.clz32(bit);
}

function readBoard(puzzle: SudokuPuzzle, entries: readonly number[]): CandidateBoard | null {
  const { size } = puzzle;
  if (entries.length !== puzzle.givens.length) {
    return null;
  }

  const geometry = geometryFor(size);
  const values = puzzle.givens.map((given, index) => given || entries[index] || 0);
  const masks = createMasks(values, geometry);
  if (!masks) {
    return null;
  }

  const candidates = new Int32Array(values.length);
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] !== 0) {
      continue;
    }
    const mask = candidateMask(index, masks, geometry);
    if (mask === 0) {
      return null;
    }
    candidates[index] = mask;
  }

  return { values, candidates, geometry };
}

function findNakedSingles(board: CandidateBoard): SudokuHint[] {
  const singles: SudokuHint[] = [];
  for (let index = 0; index < board.values.length; index += 1) {
    if (board.values[index] !== 0) {
      continue;
    }
    const mask = board.candidates[index];
    if (popcount(mask) === 1) {
      singles.push({
        index,
        value: valueOfBit(mask),
        technique: "naked-single",
        unit: null,
        related: [],
      });
    }
  }
  return singles;
}

function hiddenSingleInUnit(unit: Unit, value: number, board: CandidateBoard): SudokuHint | null {
  const bit = 1 << (value - 1);
  let spot = -1;
  let count = 0;

  for (const index of unit.indexes) {
    const current = board.values[index];
    if (current !== 0) {
      if (current === value) {
        return null;
      }
      continue;
    }
    if ((board.candidates[index] & bit) === 0) {
      continue;
    }
    spot = index;
    count += 1;
  }

  return count === 1
    ? {
        index: spot,
        value,
        technique: "hidden-single",
        unit: unit.kind,
        related: unit.indexes,
      }
    : null;
}

function findHiddenSingles(board: CandidateBoard, size: number): SudokuHint[] {
  const singles: SudokuHint[] = [];
  const seen = new Set<number>();

  for (const unit of unitsFor(board.geometry)) {
    for (let value = 1; value <= size; value += 1) {
      const single = hiddenSingleInUnit(unit, value, board);
      if (!single) {
        continue;
      }
      const key = single.index * 10 + single.value;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      singles.push(single);
    }
  }

  return singles;
}

/**
 * Returns a digit that follows from the current board with a technique a
 * player can apply themselves: a cell with a single candidate, or a digit
 * that fits in only one cell of its row, column or box.
 *
 * A board that contains a mistake or a conflict has no logical hint: there is
 * nothing a player could have deduced from it.
 */
export function findHint(
  puzzle: SudokuPuzzle,
  entries: readonly number[],
  preferredIndex: number | null = null,
): SudokuHint | null {
  if (entries.some((value, index) => value !== 0 && value !== puzzle.solution[index])) {
    return null;
  }

  const board = readBoard(puzzle, entries);
  if (!board) {
    return null;
  }

  const naked = findNakedSingles(board);
  const hidden = findHiddenSingles(board, puzzle.size);
  const forced = naked.length > 0 ? naked : hidden;

  if (preferredIndex !== null) {
    const selected = [...naked, ...hidden].find((hint) => hint.index === preferredIndex);
    if (selected) {
      return selected;
    }
  }

  return forced[0] ?? null;
}

/**
 * Returns true when repeatedly applying naked and hidden singles fills the
 * whole grid. Generated puzzles use this check so a hint never has to guess.
 */
export function isSolvableWithSingles(puzzle: SudokuPuzzle): boolean {
  const entries = Array.from({ length: puzzle.givens.length }, () => 0);

  for (let step = 0; step < entries.length; step += 1) {
    const hint = findHint(puzzle, entries, null);
    if (!hint) {
      return entries.every((value, index) => (puzzle.givens[index] || value) !== 0);
    }
    entries[hint.index] = hint.value;
  }

  return true;
}
