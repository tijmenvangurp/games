import { beforeEach, describe, expect, it } from "vitest";
import { createMolenspelGame } from "@entities/molenspel";
import { loadMolenspelProgress, saveMolenspelProgress } from "@features/molenspel";

const STORAGE_KEY = "games.molenspel.v1";

beforeEach(() => {
  localStorage.clear();
});

describe("molenspel-opslag", () => {
  it("slaat het spel op en leest het terug", () => {
    const game = createMolenspelGame("zwart");
    saveMolenspelProgress({ game, started: true });

    const restored = loadMolenspelProgress();
    expect(restored?.started).toBe(true);
    expect(restored?.game.turn).toBe("zwart");
    expect(restored?.game.inHand).toEqual({ wit: 9, zwart: 9 });
  });

  it("geeft null terug als er nog niets is opgeslagen", () => {
    expect(loadMolenspelProgress()).toBeNull();
  });

  it("geeft null terug bij onbruikbare data", () => {
    localStorage.setItem(STORAGE_KEY, "geen json");
    expect(loadMolenspelProgress()).toBeNull();

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ game: { board: [1, 2] } }));
    expect(loadMolenspelProgress()).toBeNull();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ game: { board: new Array(24).fill("blauw") } }),
    );
    expect(loadMolenspelProgress()).toBeNull();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ game: { board: new Array(24).fill(null) } }),
    );
    expect(loadMolenspelProgress()).toBeNull();
  });

  it("blokkeert een mislukte opslag", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("geen ruimte");
    };
    try {
      expect(() =>
        saveMolenspelProgress({ game: createMolenspelGame("wit"), started: true }),
      ).not.toThrow();
    } finally {
      Storage.prototype.setItem = original;
    }
  });
});
