import { geometryFor, type SudokuSize } from "@entities/sudoku";

export function parseGrid(rows: string): number[] {
  return rows.trim().split("\n").join("").split("").map(Number);
}

function isCompleteUnit(values: readonly number[]): boolean {
  const unique = new Set(values);
  if (unique.size !== values.length) {
    return false;
  }
  for (let value = 1; value <= values.length; value += 1) {
    if (!unique.has(value)) {
      return false;
    }
  }
  return true;
}

function boxValues(
  solution: readonly number[],
  size: number,
  boxRows: number,
  boxCols: number,
  boxRow: number,
  boxCol: number,
): number[] {
  const values: number[] = [];
  for (let row = 0; row < boxRows; row += 1) {
    for (let col = 0; col < boxCols; col += 1) {
      values.push(solution[(boxRow * boxRows + row) * size + boxCol * boxCols + col]);
    }
  }
  return values;
}

function allUnits(solution: readonly number[], size: SudokuSize): number[][] {
  const { boxRows, boxCols } = geometryFor(size);
  const rows = Array.from({ length: size }, (_, row) =>
    solution.slice(row * size, row * size + size),
  );
  const cols = Array.from({ length: size }, (_, col) =>
    Array.from({ length: size }, (_, row) => solution[row * size + col]),
  );

  const boxes: number[][] = [];
  for (let boxRow = 0; boxRow < size / boxRows; boxRow += 1) {
    for (let boxCol = 0; boxCol < size / boxCols; boxCol += 1) {
      boxes.push(boxValues(solution, size, boxRows, boxCols, boxRow, boxCol));
    }
  }

  return [...rows, ...cols, ...boxes];
}

export function isValidSolution(solution: readonly number[], size: SudokuSize): boolean {
  return solution.length === size * size && allUnits(solution, size).every(isCompleteUnit);
}
