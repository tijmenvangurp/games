import { describe, expect, it } from "vitest";
import {
  CLUE_TARGETS,
  DIFFICULTIES,
  SUDOKU_SIZES,
  clueCount,
  countSolutions,
  createPlayState,
  generatePuzzle,
  geometryFor,
  revealHint,
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
        if (size === 9) {
          expect(clueCount(puzzle.givens)).toBeGreaterThan(0);
          expect(clueCount(puzzle.givens)).toBeLessThan(81);
        } else {
          expect(clueCount(puzzle.givens)).toBe(CLUE_TARGETS[size][difficulty]);
        }

        puzzle.givens.forEach((value, index) => {
          if (value !== 0) {
            expect(value).toBe(puzzle.solution[index]);
          }
        });
      });
    }
  }

  it("is deterministic for a given seed on the built-in sizes", () => {
    expect(generatePuzzle(6, "gemiddeld", 777)).toEqual(generatePuzzle(6, "gemiddeld", 777));
  });

  it("produces different puzzles for different seeds", () => {
    const first = generatePuzzle(6, "makkelijk", 11);
    const second = generatePuzzle(6, "makkelijk", 12);
    expect(first.givens).not.toEqual(second.givens);
  });

  it("generates puzzles that can be solved with logical hints", () => {
    for (const size of SUDOKU_SIZES) {
      for (const difficulty of DIFFICULTIES) {
        const puzzle = generatePuzzle(size, difficulty);
        let state = createPlayState(puzzle);

        for (let step = 0; step < puzzle.givens.length; step += 1) {
          const next = revealHint(state);
          if (next === state) {
            break;
          }
          state = next;
        }

        expect(state.solved).toBe(true);
      }
    }
  });

  it("generates a hard 9x9 puzzle quickly", () => {
    const started = performance.now();
    const puzzle = generatePuzzle(9, "moeilijk", 4242);
    const duration = performance.now() - started;

    expect(clueCount(puzzle.givens)).toBeGreaterThan(0);
    expect(clueCount(puzzle.givens)).toBeLessThan(81);
    expect(countSolutions(puzzle.givens, geometryFor(9))).toBe(1);
    expect(duration).toBeLessThan(5000);
  });
});
