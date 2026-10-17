import { describe, expect, it } from "vitest";
import {
  boxIndexFor,
  countSolutions,
  generateSolution,
  geometryFor,
  isPeer,
  isSudokuSize,
  solveSudoku,
} from "@entities/sudoku";
import { mulberry32 } from "@shared/lib";
import { isValidSolution, parseGrid } from "./sudoku-fixtures";

const PUZZLE = parseGrid(`
530070000
600195000
098000060
800060003
400803001
700020006
060000280
000419005
000080079
`);

const SOLUTION = parseGrid(`
534678912
672195348
198342567
859761423
426853791
713924856
961537284
287419635
345286179
`);

const geometry9 = geometryFor(9);

describe("sudoku solver", () => {
  it("solves a known 9x9 puzzle", () => {
    expect(solveSudoku(PUZZLE, geometry9)).toEqual(SOLUTION);
    expect(isValidSolution(SOLUTION, 9)).toBe(true);
  });

  it("counts a unique puzzle as one solution", () => {
    expect(countSolutions(PUZZLE, geometry9)).toBe(1);
  });

  it("stops counting at the requested limit", () => {
    const empty = Array.from({ length: 81 }, () => 0);
    expect(countSolutions(empty, geometry9, 2)).toBe(2);
    expect(countSolutions(empty, geometry9, 3)).toBe(3);
  });

  it("rejects grids with duplicate digits", () => {
    const invalid = [...PUZZLE];
    invalid[0] = 5;
    invalid[1] = 5;
    expect(countSolutions(invalid, geometry9)).toBe(0);
    expect(solveSudoku(invalid, geometry9)).toBeNull();
  });

  it("rejects digits outside the grid size", () => {
    const invalid = [...PUZZLE];
    invalid[0] = 10;
    expect(countSolutions(invalid, geometry9)).toBe(0);
  });

  it("rejects grids of the wrong length", () => {
    expect(countSolutions([1, 2, 3], geometry9)).toBe(0);
    expect(solveSudoku([], geometry9)).toBeNull();
  });

  it("generates a valid empty-board solution", () => {
    const solution = generateSolution(geometry9, mulberry32(42));
    expect(solution).not.toBeNull();
    expect(isValidSolution(solution ?? [], 9)).toBe(true);
  });
});

describe("sudoku geometry", () => {
  it("uses the right box shapes", () => {
    expect(geometryFor(4)).toEqual({ size: 4, boxRows: 2, boxCols: 2 });
    expect(geometryFor(6)).toEqual({ size: 6, boxRows: 2, boxCols: 3 });
    expect(geometryFor(9)).toEqual({ size: 9, boxRows: 3, boxCols: 3 });
  });

  it("maps cells to boxes", () => {
    expect(boxIndexFor(0, geometry9)).toBe(0);
    expect(boxIndexFor(10, geometry9)).toBe(0);
    expect(boxIndexFor(8, geometry9)).toBe(2);
    expect(boxIndexFor(80, geometry9)).toBe(8);
    expect(boxIndexFor(3, geometryFor(6))).toBe(1);
  });

  it("detects peers", () => {
    expect(isPeer(0, 1, geometry9)).toBe(true);
    expect(isPeer(0, 9, geometry9)).toBe(true);
    expect(isPeer(0, 10, geometry9)).toBe(true);
    expect(isPeer(0, 40, geometry9)).toBe(false);
    expect(isPeer(4, 4, geometry9)).toBe(false);
  });

  it("recognises the supported sizes", () => {
    expect(isSudokuSize(4)).toBe(true);
    expect(isSudokuSize(6)).toBe(true);
    expect(isSudokuSize(9)).toBe(true);
    expect(isSudokuSize(5)).toBe(false);
  });
});
