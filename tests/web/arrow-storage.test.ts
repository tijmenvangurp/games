import { beforeEach, describe, expect, it } from "vitest";
import { LEVEL_COUNT } from "@entities/arrow";
import {
  ARROWS_STORAGE_KEY,
  ARROWS_STORAGE_VERSION,
  arrowsStorage,
  DEFAULT_ARROWS_PROGRESS,
  normalizeArrowsProgress,
  useArrowsStore,
} from "@features/arrow-game";

const STORAGE_KEY = ARROWS_STORAGE_KEY;

beforeEach(() => {
  useArrowsStore.setState({
    levelIndex: DEFAULT_ARROWS_PROGRESS.current,
    unlocked: DEFAULT_ARROWS_PROGRESS.unlocked,
  });
  // `setState` triggers a persist write, so clear afterwards.
  localStorage.clear();
});

describe("arrow progress storage", () => {
  it("falls back to the first level without stored progress", () => {
    expect(normalizeArrowsProgress(undefined)).toEqual(DEFAULT_ARROWS_PROGRESS);
    expect(arrowsStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("reads and clamps saved progress", () => {
    expect(normalizeArrowsProgress({ unlocked: 4, current: 2 })).toEqual({
      unlocked: 4,
      current: 2,
    });
    expect(normalizeArrowsProgress({ unlocked: 999, current: 999 })).toEqual({
      unlocked: LEVEL_COUNT,
      current: LEVEL_COUNT - 1,
    });
  });

  it("ignores malformed progress", () => {
    expect(normalizeArrowsProgress("not json")).toEqual(DEFAULT_ARROWS_PROGRESS);
    expect(normalizeArrowsProgress({ unlocked: "4", current: 2 })).toEqual(DEFAULT_ARROWS_PROGRESS);
  });

  it("upgrades the flat format written before Zustand persist", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ unlocked: 3, current: 2 }));

    const raw = arrowsStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(typeof raw === "string" ? raw : "null")).toEqual({
      state: { unlocked: 3, current: 2 },
      version: ARROWS_STORAGE_VERSION,
    });
  });

  it("keeps the persisted wrapper untouched", () => {
    const stored = JSON.stringify({
      state: { unlocked: 3, current: 2 },
      version: ARROWS_STORAGE_VERSION,
    });
    localStorage.setItem(STORAGE_KEY, stored);

    expect(arrowsStorage.getItem(STORAGE_KEY)).toBe(stored);
  });

  it("restores the saved level when the store rehydrates", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ unlocked: 4, current: 2 }));

    await useArrowsStore.persist.rehydrate();

    expect(useArrowsStore.getState().unlocked).toBe(4);
    expect(useArrowsStore.getState().levelIndex).toBe(2);
    expect(useArrowsStore.getState().level.name).toBe("Vis");
  });

  it("persists unlocked levels and the current level", () => {
    useArrowsStore.getState().startLevel(0);
    useArrowsStore.setState({ unlocked: 3, levelIndex: 2 });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toMatchObject({
      state: { unlocked: 3, current: 2 },
      version: ARROWS_STORAGE_VERSION,
    });
  });

  it("keeps playing when storage is unavailable", () => {
    const setItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error("quota exceeded");
    };
    try {
      expect(() => arrowsStorage.setItem(STORAGE_KEY, "value")).not.toThrow();
    } finally {
      localStorage.setItem = setItem;
    }
  });
});
