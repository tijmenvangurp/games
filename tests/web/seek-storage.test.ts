import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SEEK_SETTINGS } from "@features/seek-and-find";
import { loadSeekSettings, saveSeekSettings } from "@features/seek-and-find/model/storage";

const STORAGE_KEY = "games.seek.v1";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("seek settings storage", () => {
  it("returns defaults when nothing is stored", () => {
    expect(loadSeekSettings()).toEqual(DEFAULT_SEEK_SETTINGS);
  });

  it("round-trips valid settings", () => {
    saveSeekSettings({ difficulty: "moeilijk", theme: "onderwater" });
    expect(loadSeekSettings()).toEqual({ difficulty: "moeilijk", theme: "onderwater" });
  });

  it("ignores corrupt or invalid settings", () => {
    localStorage.setItem(STORAGE_KEY, "{nope");
    expect(loadSeekSettings()).toEqual(DEFAULT_SEEK_SETTINGS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ difficulty: "onmogelijk", theme: "tuin" }));
    expect(loadSeekSettings()).toEqual(DEFAULT_SEEK_SETTINGS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ difficulty: "makkelijk", theme: "ruimte" }));
    expect(loadSeekSettings()).toEqual(DEFAULT_SEEK_SETTINGS);
  });

  it("does not crash when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => saveSeekSettings({ difficulty: "makkelijk", theme: "tuin" })).not.toThrow();

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadSeekSettings()).toEqual(DEFAULT_SEEK_SETTINGS);
  });
});
