import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_POKEMON_QUIZ_SETTINGS,
  QUIZ_DIFFICULTIES,
  loadPokemonQuizSettings,
  savePokemonQuizSettings,
} from "@features/pokemon-quiz";

const STORAGE_KEY = "games.pokemon-quiz.v1";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("pokémon quiz settings storage", () => {
  it("returns defaults when nothing is stored", () => {
    expect(loadPokemonQuizSettings()).toEqual(DEFAULT_POKEMON_QUIZ_SETTINGS);
  });

  it("round-trips valid settings", () => {
    for (const difficulty of QUIZ_DIFFICULTIES) {
      savePokemonQuizSettings({ difficulty });
      expect(loadPokemonQuizSettings()).toEqual({ difficulty });
    }
  });

  it("ignores corrupt or invalid settings", () => {
    localStorage.setItem(STORAGE_KEY, "{nope");
    expect(loadPokemonQuizSettings()).toEqual(DEFAULT_POKEMON_QUIZ_SETTINGS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ difficulty: "onmogelijk" }));
    expect(loadPokemonQuizSettings()).toEqual(DEFAULT_POKEMON_QUIZ_SETTINGS);
  });

  it("does not crash when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => savePokemonQuizSettings({ difficulty: "makkelijk" })).not.toThrow();

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadPokemonQuizSettings()).toEqual(DEFAULT_POKEMON_QUIZ_SETTINGS);
  });
});
