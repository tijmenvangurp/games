import { describe, expect, it } from "vitest";
import {
  CLUE_TARGETS,
  DIFFICULTIES,
  SUDOKU_SIZES,
  clueCount,
  countSolutions,
  generatePuzzle,
  geometryFor,
} from "@entities/sudoku";
import { isValidSolution } from "./sudoku-fixtures";

let seedCounter = 1000;

describe("sudoku generator", () => {
  for (const size of SUDOKU_SIZES) {
    for (const difficulty of DIFFICULTIES) {
      it(`creates a unique ${size}x${size} ${difficulty} puzzle`, () => {
        seedCounter += 1;
        const puzzle = generatePuzzle(size, difficulty, seedCounter);
        const geometry = geometryFor(size);

        expect(puzzle.size).toBe(size);
        expect(puzzle.difficulty).toBe(difficulty);
        expect(isValidSolution(puzzle.solution, size)).toBe(true);
        expect(countSolutions(puzzle.givens, geometry)).toBe(1);
        expect(clueCount(puzzle.givens)).toBe(CLUE_TARGETS[size][difficulty]);

        puzzle.givens.forEach((value, index) => {
          if (value !== 0) {
            expect(value).toBe(puzzle.solution[index]);
          }
        });
      });
    }
  }

  it("is deterministic for a given seed", () => {
    expect(generatePuzzle(9, "gemiddeld", 777)).toEqual(generatePuzzle(9, "gemiddeld", 777));
  });

  it("produces different puzzles for different seeds", () => {
    const first = generatePuzzle(6, "makkelijk", 11);
    const second = generatePuzzle(6, "makkelijk", 12);
    expect(first.givens).not.toEqual(second.givens);
  });

  it("generates a hard 9x9 puzzle quickly", () => {
    const started = performance.now();
    const puzzle = generatePuzzle(9, "moeilijk", 4242);
    const duration = performance.now() - started;

    expect(clueCount(puzzle.givens)).toBe(CLUE_TARGETS[9].moeilijk);
    expect(duration).toBeLessThan(5000);
  });
});
