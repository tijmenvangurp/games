import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { levelIndexForPairs, MEMORY_LEVELS } from "@entities/memory";
import {
  DEFAULT_MEMORY_STATE,
  loadMemoryState,
  saveMemoryState,
  type MemoryState,
} from "@features/memory-game";

const STORAGE_KEY = "games.memory.v2";
const LEGACY_STORAGE_KEY = "games.memory.v1";

const sample: MemoryState = {
  settings: {
    mode: "manual",
    manualIndex: 6,
    adaptive: { levelIndex: 3, streak: 1 },
  },
  review: {
    "25": { box: 0, dueAt: 1234, correct: 0, seen: 1 },
  },
  attempts: [{ itemId: "25", ok: false, at: 1234, durationMs: 900, hints: 1 }],
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("memory state storage", () => {
  it("returns defaults when nothing is stored", () => {
    expect(loadMemoryState()).toEqual(DEFAULT_MEMORY_STATE);
  });

  it("round-trips settings, review and attempts", () => {
    saveMemoryState(sample);
    expect(loadMemoryState()).toEqual(sample);
  });

  it("migrates the v1 difficulty as the starting level", () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ difficulty: "moeilijk" }));
    const state = loadMemoryState();
    const expected = levelIndexForPairs(10);
    expect(state.settings.mode).toBe("auto");
    expect(state.settings.adaptive.levelIndex).toBe(expected);
    expect(state.settings.manualIndex).toBe(expected);
    expect(state.review).toEqual({});
    expect(state.attempts).toEqual([]);
  });

  it("prefers v2 over the legacy key", () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ difficulty: "makkelijk" }));
    saveMemoryState(sample);
    expect(loadMemoryState()).toEqual(sample);
  });

  it("ignores corrupt or invalid state", () => {
    localStorage.setItem(STORAGE_KEY, "{nope");
    expect(loadMemoryState()).toEqual(DEFAULT_MEMORY_STATE);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        settings: { mode: "manual", manualIndex: 99, adaptive: { levelIndex: 0, streak: 0 } },
      }),
    );
    expect(loadMemoryState()).toEqual(DEFAULT_MEMORY_STATE);
  });

  it("filters invalid review entries and attempts", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        settings: sample.settings,
        review: {
          good: { box: 1, dueAt: 10, correct: 1, seen: 1 },
          bad: { box: 99, dueAt: 10, correct: 1, seen: 1 },
        },
        attempts: [
          { itemId: "1", ok: true, at: 1, durationMs: 10, hints: 0 },
          { itemId: "2", ok: "yes", at: 1, durationMs: 10, hints: 0 },
        ],
      }),
    );

    const state = loadMemoryState();
    expect(Object.keys(state.review)).toEqual(["good"]);
    expect(state.attempts).toHaveLength(1);
  });

  it("keeps only the last 200 attempts", () => {
    const attempts = Array.from({ length: 250 }, (_, index) => ({
      itemId: String(index),
      ok: true,
      at: index,
      durationMs: 10,
      hints: 0,
    }));
    saveMemoryState({ ...sample, attempts });
    expect(loadMemoryState().attempts).toHaveLength(200);
    expect(loadMemoryState().attempts[0]?.itemId).toBe("50");
  });

  it("does not crash when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => saveMemoryState(sample)).not.toThrow();

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadMemoryState()).toEqual(DEFAULT_MEMORY_STATE);
  });

  it("keeps the level list stable for the migration", () => {
    expect(MEMORY_LEVELS[0]).toBe(4);
    expect(MEMORY_LEVELS.at(-1)).toBe(12);
  });
});
