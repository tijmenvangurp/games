import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_MEMORY_SETTINGS,
  loadMemorySettings,
  saveMemorySettings,
} from "@features/memory-game";

const STORAGE_KEY = "games.memory.v1";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("memory settings storage", () => {
  it("returns defaults when nothing is stored", () => {
    expect(loadMemorySettings()).toEqual(DEFAULT_MEMORY_SETTINGS);
  });

  it("round-trips valid settings", () => {
    saveMemorySettings({ difficulty: "moeilijk" });
    expect(loadMemorySettings()).toEqual({ difficulty: "moeilijk" });
  });

  it("ignores corrupt or invalid settings", () => {
    localStorage.setItem(STORAGE_KEY, "{nope");
    expect(loadMemorySettings()).toEqual(DEFAULT_MEMORY_SETTINGS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ difficulty: "onmogelijk" }));
    expect(loadMemorySettings()).toEqual(DEFAULT_MEMORY_SETTINGS);
  });

  it("does not crash when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => saveMemorySettings({ difficulty: "makkelijk" })).not.toThrow();

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadMemorySettings()).toEqual(DEFAULT_MEMORY_SETTINGS);
  });
});
