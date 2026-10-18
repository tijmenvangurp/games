import { beforeEach, describe, expect, it, vi } from "vitest";
import { POKEMON_CROSSWORD } from "@entities/crossword";
import { loadCrosswordLetters, saveCrosswordLetters } from "@features/crossword";

const STORAGE_KEY = "games.crossword.v1";

beforeEach(() => {
  localStorage.clear();
});

describe("crossword storage", () => {
  it("round-trips valid letters", () => {
    const letters = { "0:5": "B", "1:0": "A", "4:0": "M" };
    saveCrosswordLetters(letters);

    expect(loadCrosswordLetters(POKEMON_CROSSWORD)).toEqual(letters);
  });

  it("drops invalid keys and values", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        letters: {
          "0:5": "B",
          "99:99": "Z",
          "1:0": "1",
          "5:5": "S",
        },
      }),
    );

    expect(loadCrosswordLetters(POKEMON_CROSSWORD)).toEqual({ "0:5": "B", "5:5": "S" });
  });

  it("falls back to an empty board for corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadCrosswordLetters(POKEMON_CROSSWORD)).toEqual({});
  });

  it("does not crash when storage refuses a write", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(() => saveCrosswordLetters({ "0:5": "B" })).not.toThrow();
    spy.mockRestore();
  });
});
