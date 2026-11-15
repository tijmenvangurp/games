import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLAYER_COLORS,
  MAX_PLAYER_NAME_LENGTH,
  createGame,
  normalizePlayerName,
} from "@entities/ganzenbord";
import {
  DEFAULT_SETTINGS,
  playersFromSettings,
  withPlayerColor,
  withPlayerName,
} from "../../libs/features/ganzenbord/model/settings";

describe("ganzenbord: spelersnaam en kleur", () => {
  it("geeft elke speler standaard een vaste kleur en geen eigen naam", () => {
    const game = createGame([
      { id: "one", controller: "human" },
      { id: "two", controller: "computer" },
    ]);

    expect(game.players[0]).toMatchObject({ color: "blue", name: undefined });
    expect(game.players[1]).toMatchObject({ color: "red", name: undefined });
    expect(DEFAULT_PLAYER_COLORS.four).toBe("violet");
  });

  it("neemt een eigen naam en kleur mee de partij in", () => {
    const game = createGame([
      { id: "one", controller: "human", name: "  Saar  ", color: "pink" },
      { id: "two", controller: "human", name: "   ", color: "orange" },
    ]);

    expect(game.players[0]).toMatchObject({ name: "Saar", color: "pink" });
    expect(game.players[1]).toMatchObject({ name: undefined, color: "orange" });
  });

  it("kort een te lange naam in en leegt een naam met alleen spaties", () => {
    const long = "a".repeat(MAX_PLAYER_NAME_LENGTH + 5);
    expect(normalizePlayerName(long)).toHaveLength(MAX_PLAYER_NAME_LENGTH);
    expect(normalizePlayerName("  ")).toBeUndefined();
  });

  it("bewaart naam en kleur in de instellingen", () => {
    const settings = withPlayerName(
      withPlayerColor(DEFAULT_SETTINGS, "one", "pink"),
      "one",
      "human",
      "Saar",
    );

    expect(playersFromSettings(settings)).toEqual([
      { id: "one", controller: "human", color: "pink", name: "Saar" },
      { id: "two", controller: "human", color: "red", name: "" },
    ]);
  });

  it("houdt per controller een eigen naam bij", () => {
    const human = withPlayerName(DEFAULT_SETTINGS, "two", "human", "Saar");
    const computer = withPlayerName(human, "two", "computer", "Rekenhulp");

    expect(playersFromSettings(computer)[1]).toMatchObject({ controller: "human", name: "Saar" });

    const switched = {
      ...computer,
      controllers: { ...computer.controllers, two: "computer" as const },
    };
    expect(playersFromSettings(switched)[1]).toMatchObject({
      controller: "computer",
      name: "Rekenhulp",
    });
  });

  it("laat spelers van kleur ruilen zodat elke pion uniek blijft", () => {
    const swapped = withPlayerColor(DEFAULT_SETTINGS, "one", "violet");

    expect(swapped.colors.one).toBe("violet");
    expect(swapped.colors.four).toBe("blue");
    expect(DEFAULT_SETTINGS.colors.one).toBe("blue");

    // Dezelfde kleur nog eens kiezen verandert niets.
    expect(withPlayerColor(swapped, "one", "violet")).toBe(swapped);
  });
});
