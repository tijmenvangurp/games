import { beforeEach, describe, expect, it } from "vitest";
import { LEVEL_COUNT } from "@entities/arrow";
import {
  DEFAULT_ARROWS_PROGRESS,
  loadArrowsProgress,
  saveArrowsProgress,
} from "@features/arrow-game";

const STORAGE_KEY = "games.arrows.v2";

beforeEach(() => {
  localStorage.clear();
});

describe("arrow progress storage", () => {
  it("falls back to the first level without stored progress", () => {
    expect(loadArrowsProgress()).toEqual(DEFAULT_ARROWS_PROGRESS);
  });

  it("reads and clamps saved progress", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ unlocked: 4, current: 2 }));
    expect(loadArrowsProgress()).toEqual({ unlocked: 4, current: 2 });

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ unlocked: 999, current: 999 }));
    expect(loadArrowsProgress()).toEqual({ unlocked: LEVEL_COUNT, current: LEVEL_COUNT - 1 });
  });

  it("ignores malformed progress", () => {
    localStorage.setItem(STORAGE_KEY, "not json");
    expect(loadArrowsProgress()).toEqual(DEFAULT_ARROWS_PROGRESS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ unlocked: "4", current: 2 }));
    expect(loadArrowsProgress()).toEqual(DEFAULT_ARROWS_PROGRESS);
  });

  it("saves progress", () => {
    saveArrowsProgress({ unlocked: 3, current: 2 });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
      unlocked: 3,
      current: 2,
    });
  });
});
