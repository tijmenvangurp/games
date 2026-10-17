import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPlayState, generatePuzzle } from "@entities/sudoku";
import { DEFAULT_SETTINGS, loadSudokuState, saveSudokuState } from "@features/sudoku-game";

const STORAGE_KEY = "games.sudoku.v1";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sudoku storage", () => {
  it("returns null when nothing is stored", () => {
    expect(loadSudokuState()).toBeNull();
  });

  it("round-trips a saved game", () => {
    const state = createPlayState(generatePuzzle(4, "makkelijk", 5));
    state.entries[0] = state.puzzle.solution[0];
    const payload = {
      play: state,
      settings: { size: 4 as const, difficulty: "makkelijk" as const, theme: "animals" as const },
    };

    saveSudokuState(payload);

    const restored = loadSudokuState();
    expect(restored?.play?.entries[0]).toBe(state.entries[0]);
    expect(restored?.settings).toEqual(payload.settings);
  });

  it("ignores corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadSudokuState()).toBeNull();
  });

  it("drops an invalid game but keeps valid settings", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        play: { puzzle: { size: 5 } },
        settings: { size: 6, difficulty: "gemiddeld", theme: "numbers" },
      }),
    );

    const restored = loadSudokuState();
    expect(restored?.play).toBeNull();
    expect(restored?.settings).toEqual({
      size: 6,
      difficulty: "gemiddeld",
      theme: "numbers",
    });
  });

  it("falls back to default settings when they are invalid", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ play: null, settings: { size: 7 } }));
    expect(loadSudokuState()?.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("does not crash when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => saveSudokuState({ play: null, settings: DEFAULT_SETTINGS })).not.toThrow();

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadSudokuState()).toBeNull();
  });
});
