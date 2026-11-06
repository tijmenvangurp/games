import { describe, expect, it } from "vitest";
import {
  createGame,
  type GanzenbordGame,
  type PlayerId,
  type TurnEvent,
} from "@entities/ganzenbord";
import {
  playerColorClass,
  playerName,
  playerNumber,
  positionText,
  statusHint,
  turnText,
  winnerDescription,
  winnerTitle,
} from "../../libs/features/ganzenbord/model/presentation";

function game(): GanzenbordGame {
  return createGame([
    { id: "one", controller: "human" },
    { id: "two", controller: "computer" },
  ]);
}

function withPositions(
  positions: Partial<Record<PlayerId, Partial<GanzenbordGame["players"][number]>>>,
) {
  const base = game();
  return {
    ...base,
    players: base.players.map((player) => ({ ...player, ...positions[player.id] })),
  };
}

describe("ganzenbord: presentatie", () => {
  it("gebruikt herkenbare namen en kleuren", () => {
    expect(playerNumber("one")).toBe(1);
    expect(playerNumber("four")).toBe(4);
    expect(playerName({ id: "one", controller: "human" })).toBe("Speler 1");
    expect(playerName({ id: "two", controller: "computer" })).toBe("Computer 2");
    expect(playerColorClass("three")).toBe("bg-player-three");
  });

  it("beschrijft de positie en status van een speler", () => {
    expect(positionText({ ...game().players[0], position: 0 })).toBe("Bij start");
    expect(positionText({ ...game().players[0], position: 12 })).toBe("Vak 12");
    expect(positionText({ ...game().players[0], position: 63 })).toBe("Bij de finish");
    expect(positionText({ ...game().players[0], stuckOn: 31 })).toBe("Zit in de put");
    expect(positionText({ ...game().players[0], stuckOn: 52 })).toBe("Zit in de gevangenis");
    expect(positionText({ ...game().players[0], skipTurns: 1 })).toBe("Slaat een beurt over");
  });

  it("vat de belangrijkste gebeurtenissen samen", () => {
    const base = game();
    const events: TurnEvent[] = [
      { kind: "roll", player: "one", value: 8, dice: [3, 5] },
      { kind: "first-throw", player: "one", from: 0, to: 53 },
      { kind: "bounce", player: "one", from: 60, to: 59 },
      { kind: "goose", player: "one", from: 59, to: 52 },
      { kind: "bridge", player: "one", from: 6, to: 12 },
      { kind: "inn", player: "one", from: 19, to: 19 },
      { kind: "well", player: "one", from: 31, to: 31 },
      { kind: "prison", player: "one", from: 52, to: 52 },
      { kind: "maze", player: "one", from: 42, to: 37 },
      { kind: "death", player: "one", from: 58, to: 0 },
      { kind: "free", player: "two", other: "one", value: 31 },
      { kind: "skip", player: "two", value: 1 },
    ];

    const text = turnText(base, events);
    expect(text).toContain("Speler 1 gooit 3 + 5 = 8.");
    expect(text).toContain("Eerste worp 9");
    expect(text).toContain("Voorbij 63");
  });

  it("meldt de winnaar, het gelijkspel en de beurt", () => {
    const base = game();
    expect(turnText(base, [])).toBe("Speler 1 is aan de beurt.");
    expect(statusHint(base)).toBe("Speler 1 is aan de beurt.");

    const draw = { ...base, status: "draw" as const };
    expect(turnText(draw, [])).toBe("Gelijkspel: iedereen zit vast.");
    expect(winnerTitle(draw)).toBe("Gelijkspel!");
    expect(winnerDescription(draw)).toContain("geen winnaar");

    const finished = {
      ...base,
      status: "finished" as const,
      winner: "one" as const,
    };
    expect(turnText(finished, [])).toBe("Speler 1 wint!");
    expect(winnerTitle(finished)).toBe("Speler 1 wint!");
    expect(winnerDescription(finished)).toContain("vakje 63");
    expect(statusHint(finished)).toBe("De partij is klaar.");
  });

  it("herkent de computerbeurt", () => {
    const base = withPositions({});
    const withComputer = {
      ...base,
      current: "two" as const,
      players: base.players.map((player) =>
        player.id === "two" ? { ...player, controller: "computer" as const } : player,
      ),
    };
    expect(statusHint(withComputer)).toBe("Computer 2 gooit zo…");
  });

  it("toont de put en de skip in de status", () => {
    const base = withPositions({
      one: { position: 31, stuckOn: 31 },
      two: { skipTurns: 1 },
    });
    expect(statusHint(base)).toBe("Speler 1 is aan de beurt.");
    expect(positionText(base.players[1])).toBe("Slaat een beurt over");
  });
});
