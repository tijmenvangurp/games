import type { Difficulty, Geometry, SudokuSize } from "./types";

export function geometryFor(size: SudokuSize): Geometry {
  switch (size) {
    case 4:
      return { size, boxRows: 2, boxCols: 2 };
    case 6:
      return { size, boxRows: 2, boxCols: 3 };
    case 9:
      return { size, boxRows: 3, boxCols: 3 };
  }
}

export function boxIndexFor(index: number, geometry: Geometry): number {
  const { size, boxRows, boxCols } = geometry;
  const row = Math.floor(index / size);
  const col = index % size;
  const boxesPerBand = size / boxCols;
  return Math.floor(row / boxRows) * boxesPerBand + Math.floor(col / boxCols);
}

function rowOf(index: number, size: number): number {
  return Math.floor(index / size);
}

function colOf(index: number, size: number): number {
  return index % size;
}

export function isPeer(a: number, b: number, geometry: Geometry): boolean {
  if (a === b) return false;
  if (rowOf(a, geometry.size) === rowOf(b, geometry.size)) return true;
  if (colOf(a, geometry.size) === colOf(b, geometry.size)) return true;
  return boxIndexFor(a, geometry) === boxIndexFor(b, geometry);
}

/** How many clues a fresh puzzle aims for, per size and difficulty. */
export const CLUE_TARGETS: Record<SudokuSize, Record<Difficulty, number>> = {
  4: { makkelijk: 10, gemiddeld: 8, moeilijk: 6 },
  6: { makkelijk: 22, gemiddeld: 18, moeilijk: 15 },
  9: { makkelijk: 42, gemiddeld: 34, moeilijk: 28 },
};

export function isSudokuSize(value: number): value is SudokuSize {
  return value === 4 || value === 6 || value === 9;
}
