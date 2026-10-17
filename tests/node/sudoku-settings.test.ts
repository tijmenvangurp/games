import { describe, expect, it } from "vitest";
import { DIFFICULTY_OPTIONS, SIZE_OPTIONS, symbolsFor } from "@features/sudoku-game/model/settings";
import { SUDOKU_SIZES } from "@entities/sudoku";

describe("sudoku settings", () => {
  it("offers every size and difficulty", () => {
    expect(SIZE_OPTIONS.map((option) => option.value)).toEqual([...SUDOKU_SIZES]);
    expect(DIFFICULTY_OPTIONS.map((option) => option.value)).toEqual([
      "makkelijk",
      "gemiddeld",
      "moeilijk",
    ]);
  });

  it("uses numbers for 9x9", () => {
    expect(symbolsFor(9, "animals")).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });

  it("switches between numbers and animals for smaller grids", () => {
    expect(symbolsFor(4, "numbers")).toEqual(["1", "2", "3", "4"]);
    expect(symbolsFor(4, "animals")).toEqual(["🐶", "🐱", "🐰", "🦊"]);
    expect(symbolsFor(6, "animals")).toHaveLength(6);
  });
});
