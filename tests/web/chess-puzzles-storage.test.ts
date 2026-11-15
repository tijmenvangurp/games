import { beforeEach, describe, expect, it } from "vitest";
import {
  PUZZLES,
  PUZZLE_PROGRESS_STORAGE_KEY,
  loadSolvedPuzzleIds,
  saveSolvedPuzzleIds,
} from "@features/chess-puzzles";

beforeEach(() => {
  localStorage.clear();
});

describe("chess puzzle progress storage", () => {
  it("round-trips known solved puzzle IDs", () => {
    const puzzleId = PUZZLES[0].id;

    saveSolvedPuzzleIds(new Set([puzzleId, "onbekend"]));

    expect(loadSolvedPuzzleIds()).toEqual(new Set([puzzleId]));
    expect(JSON.parse(localStorage.getItem(PUZZLE_PROGRESS_STORAGE_KEY) ?? "{}")).toEqual({
      solved: [puzzleId],
    });
  });

  it("ignores malformed and stale data", () => {
    localStorage.setItem(PUZZLE_PROGRESS_STORAGE_KEY, "{nope");
    expect(loadSolvedPuzzleIds().size).toBe(0);

    localStorage.setItem(PUZZLE_PROGRESS_STORAGE_KEY, JSON.stringify({ solved: ["onbekend", 42] }));
    expect(loadSolvedPuzzleIds().size).toBe(0);
  });
});
