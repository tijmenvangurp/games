export const SUDOKU_SIZES = [4, 6, 9] as const;

export type SudokuSize = (typeof SUDOKU_SIZES)[number];

export const DIFFICULTIES = ["makkelijk", "gemiddeld", "moeilijk"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export interface Geometry {
  size: SudokuSize;
  boxRows: number;
  boxCols: number;
}

export interface SudokuPuzzle {
  size: SudokuSize;
  difficulty: Difficulty;
  /** Row-major grid. 0 means the cell is empty. */
  givens: number[];
  /** Row-major grid with the unique solution. */
  solution: number[];
  seed: number;
}
