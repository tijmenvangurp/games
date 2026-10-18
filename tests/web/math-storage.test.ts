import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MATH_SETTINGS, loadMathState, saveMathState } from "@features/math-trainer";

const STORAGE_KEY = "games.math.v1";

beforeEach(() => {
  localStorage.clear();
});

describe("math settings storage", () => {
  it("round-trips settings and best scores", () => {
    const state = {
      settings: { mode: "keer" as const, level: "moeilijk" as const },
      best: { "keer:moeilijk": 8, "plus:makkelijk": 10 },
    };

    saveMathState(state);

    expect(loadMathState()).toEqual(state);
  });

  it("falls back to defaults for corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");

    expect(loadMathState()).toEqual({
      settings: DEFAULT_MATH_SETTINGS,
      best: {},
    });
  });

  it("keeps valid best scores but drops invalid settings", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: { mode: "ruimte", level: "extreem" },
        best: { "keer:gemiddeld": 6 },
      }),
    );

    expect(loadMathState()).toEqual({
      settings: DEFAULT_MATH_SETTINGS,
      best: { "keer:gemiddeld": 6 },
    });
  });
});

describe("math best storage", () => {
  it("drops invalid best scores", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: { mode: "plus", level: "makkelijk" },
        best: { "keer:gemiddeld": 42, onzin: 3 },
      }),
    );

    expect(loadMathState()).toEqual({
      settings: { mode: "plus", level: "makkelijk" },
      best: {},
    });
  });

  it("does not crash when storage refuses a write", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(() => saveMathState({ settings: DEFAULT_MATH_SETTINGS, best: {} })).not.toThrow();

    spy.mockRestore();
  });
});
