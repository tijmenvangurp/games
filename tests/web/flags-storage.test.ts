import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_FLAG_SETTINGS, loadFlagState, saveFlagState } from "@features/flag-quiz";

const STORAGE_KEY = "games.vlaggen.v1";

beforeEach(() => {
  localStorage.clear();
});

describe("flag settings storage", () => {
  it("round-trips settings and best scores", () => {
    const state = {
      settings: { scope: "azie" as const, level: "moeilijk" as const },
      best: { "azie:moeilijk": 9, "europa:makkelijk": 10 },
    };

    saveFlagState(state);

    expect(loadFlagState()).toEqual(state);
  });

  it("falls back to defaults for corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");

    expect(loadFlagState()).toEqual({
      settings: DEFAULT_FLAG_SETTINGS,
      best: {},
    });
  });

  it("keeps valid best scores but drops invalid settings", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: { scope: "atlantis", level: "extreem" },
        best: { "afrika:gemiddeld": 6 },
      }),
    );

    expect(loadFlagState()).toEqual({
      settings: DEFAULT_FLAG_SETTINGS,
      best: { "afrika:gemiddeld": 6 },
    });
  });
});

describe("flag best storage", () => {
  it("drops invalid best scores", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: { scope: "wereld", level: "makkelijk" },
        best: { "wereld:makkelijk": 42, onzin: 3, oceanie: 4 },
      }),
    );

    expect(loadFlagState()).toEqual({
      settings: { scope: "wereld", level: "makkelijk" },
      best: {},
    });
  });

  it("does not crash when storage refuses a write", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(() => saveFlagState({ settings: DEFAULT_FLAG_SETTINGS, best: {} })).not.toThrow();

    spy.mockRestore();
  });
});
