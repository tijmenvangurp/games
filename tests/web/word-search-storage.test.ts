import { beforeEach, describe, expect, it, vi } from "vitest";
import { createWordSearch } from "@entities/word-search";
import {
  DEFAULT_WORD_SEARCH_SETTINGS,
  loadWordSearchState,
  saveWordSearchState,
} from "@features/word-search";

const STORAGE_KEY = "games.word-search.v1";

beforeEach(() => {
  localStorage.clear();
});

describe("word search storage", () => {
  it("round-trips settings, puzzle and found words", () => {
    const puzzle = createWordSearch("tuin", "makkelijk", 42);
    const found = [puzzle.placements[0]?.word ?? ""];
    const settings = { theme: "onderwater" as const, difficulty: "gemiddeld" as const };

    saveWordSearchState({ settings, puzzle, found });

    expect(loadWordSearchState()).toEqual({ settings, puzzle, found });
  });

  it("round-trips a capitalized Pokémon puzzle", () => {
    const puzzle = createWordSearch("pokemon", "makkelijk", 11);
    const settings = { theme: "pokemon" as const, difficulty: "makkelijk" as const };

    saveWordSearchState({ settings, puzzle, found: [] });

    expect(loadWordSearchState()).toEqual({ settings, puzzle, found: [] });
  });

  it("falls back to defaults for corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");

    expect(loadWordSearchState()).toEqual({
      settings: DEFAULT_WORD_SEARCH_SETTINGS,
      puzzle: null,
      found: [],
    });
  });

  it("keeps valid settings but drops an invalid puzzle", () => {
    const puzzle = createWordSearch("tuin", "makkelijk", 7);
    const broken = {
      ...puzzle,
      grid: puzzle.grid.slice(0, puzzle.size - 1),
    };

    saveWordSearchState({
      settings: { theme: "onderwater", difficulty: "moeilijk" },
      puzzle: broken,
      found: [puzzle.placements[0]?.word ?? ""],
    });

    expect(loadWordSearchState()).toEqual({
      settings: { theme: "onderwater", difficulty: "moeilijk" },
      puzzle: null,
      found: [],
    });
  });

  it("filters found words that are not part of the puzzle", () => {
    const puzzle = createWordSearch("onderwater", "gemiddeld", 11);
    const foundWord = puzzle.placements[0]?.word ?? "";

    saveWordSearchState({
      settings: DEFAULT_WORD_SEARCH_SETTINGS,
      puzzle,
      found: [foundWord, foundWord, "onbekend"],
    });

    expect(loadWordSearchState().found).toEqual([foundWord]);
  });

  it("uses defaults for unknown theme or difficulty values", () => {
    const puzzle = createWordSearch("tuin", "makkelijk", 3);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: { theme: "ruimte", difficulty: "extreem" },
        puzzle,
        found: [],
      }),
    );

    expect(loadWordSearchState()).toEqual({
      settings: DEFAULT_WORD_SEARCH_SETTINGS,
      puzzle,
      found: [],
    });
  });

  it("does not crash when storage refuses a write", () => {
    const puzzle = createWordSearch("tuin", "makkelijk", 5);
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(() =>
      saveWordSearchState({ settings: DEFAULT_WORD_SEARCH_SETTINGS, puzzle, found: [] }),
    ).not.toThrow();

    spy.mockRestore();
  });
});
