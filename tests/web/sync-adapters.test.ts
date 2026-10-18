import { beforeEach, describe, expect, it } from "vitest";
import { levelAt } from "@entities/arrow";
import { useArrowsStore, loadArrowsProgress } from "@features/arrow-game";
import { loadMathState, useMathStore } from "@features/math-trainer";
import { loadMemorySettings, useMemoryStore } from "@features/memory-game";
import { loadPokemonQuizSettings, usePokemonQuizStore } from "@features/pokemon-quiz";
import { loadSeekSettings, useSeekStore } from "@features/seek-and-find";
import { getProgressAdapter } from "@shared/lib";

beforeEach(() => {
  localStorage.clear();
  useMemoryStore.setState({ settings: { difficulty: "gemiddeld" } });
  useMathStore.setState({ settings: { mode: "plus", level: "makkelijk" }, best: {} });
  usePokemonQuizStore.setState({ settings: { difficulty: "gemiddeld" } });
  useSeekStore.setState({ settings: { difficulty: "makkelijk", theme: "tuin" } });
  useArrowsStore.setState({ unlocked: 1, levelIndex: 0, level: levelAt(0) });
});

describe("game sync adapters", () => {
  it("reads and applies memory settings, including an inactive profile", () => {
    const adapter = getProgressAdapter("memory");
    expect(adapter).toBeDefined();

    adapter?.apply("p1", { settings: { difficulty: "moeilijk" } });
    expect(useMemoryStore.getState().settings).toEqual({ difficulty: "moeilijk" });
    expect(loadMemorySettings()).toEqual({ difficulty: "moeilijk" });
    expect(adapter?.read("p1")).toEqual({ settings: { difficulty: "moeilijk" } });

    adapter?.apply("p2", { settings: { difficulty: "makkelijk" } });
    expect(useMemoryStore.getState().settings).toEqual({ difficulty: "moeilijk" });
    expect(loadMemorySettings("p2")).toEqual({ difficulty: "makkelijk" });
  });

  it("applies math settings and best scores with a stable key filter", () => {
    const adapter = getProgressAdapter("math");
    adapter?.apply("p1", {
      settings: { mode: "keer", level: "moeilijk" },
      best: { "keer:moeilijk": 7, "onzin:key": 99, "plus:makkelijk": 42 },
    });

    expect(useMathStore.getState().settings).toEqual({ mode: "keer", level: "moeilijk" });
    expect(useMathStore.getState().best).toEqual({ "keer:moeilijk": 7 });
    expect(loadMathState().best).toEqual({ "keer:moeilijk": 7 });
  });

  it("applies Pokémon quiz settings", () => {
    const adapter = getProgressAdapter("pokemon-quiz");
    adapter?.apply("p1", { settings: { difficulty: "meester" } });

    expect(usePokemonQuizStore.getState().settings).toEqual({ difficulty: "meester" });
    expect(loadPokemonQuizSettings()).toEqual({ difficulty: "meester" });
  });

  it("applies seek settings", () => {
    const adapter = getProgressAdapter("seek");
    adapter?.apply("p1", { settings: { difficulty: "moeilijk", theme: "onderwater" } });

    expect(useSeekStore.getState().settings).toEqual({
      difficulty: "moeilijk",
      theme: "onderwater",
    });
    expect(loadSeekSettings()).toEqual({ difficulty: "moeilijk", theme: "onderwater" });
  });

  it("applies the arrows unlocked count and clamps the selected level", () => {
    const adapter = getProgressAdapter("arrows");
    expect(adapter?.read("p1")).toEqual({ unlocked: 1 });

    adapter?.apply("p1", { unlocked: 3 });

    expect(useArrowsStore.getState().unlocked).toBe(3);
    expect(useArrowsStore.getState().levelIndex).toBe(0);
    expect(loadArrowsProgress()).toMatchObject({ unlocked: 3 });
  });

  it("ignores malformed snapshots instead of breaking the store", () => {
    const adapter = getProgressAdapter("seek");
    adapter?.apply("p1", { settings: { difficulty: "onmogelijk", theme: "ruimte" } });

    expect(useSeekStore.getState().settings).toEqual({
      difficulty: "makkelijk",
      theme: "tuin",
    });
  });
});
