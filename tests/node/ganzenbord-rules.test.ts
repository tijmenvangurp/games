import { describe, expect, it } from "vitest";
import {
  GOOSE_SQUARES,
  createGame,
  firstThrowTarget,
  isFinished,
  movePlayer,
  playTurn,
  squareKind,
  type GanzenbordGame,
  type PlayerId,
  type PlayerSetup,
} from "@entities/ganzenbord";
import { mulberry32 } from "@shared/lib";

const TWO_PLAYERS: readonly PlayerSetup[] = [
  { id: "one", controller: "human" },
  { id: "two", controller: "computer" },
];

function gameAt(positions: Partial<Record<PlayerId, number>>, first: PlayerId = "one") {
  const game = createGame(TWO_PLAYERS, first);
  return {
    ...game,
    players: game.players.map((player) => {
      const position = positions[player.id];
      return position === undefined ? player : { ...player, position, firstRollDone: true };
    }),
  } satisfies GanzenbordGame;
}

function player(game: GanzenbordGame, id: PlayerId) {
  return game.players.find((candidate) => candidate.id === id);
}

describe("ganzenbord: bord en beweging", () => {
  it("kent de dertien ganzen en de zes gevaren", () => {
    expect(GOOSE_SQUARES).toHaveLength(13);
    expect(squareKind(5)).toBe("goose");
    expect(squareKind(63)).toBe("finish");
    expect([6, 19, 31, 42, 52, 58].map(squareKind)).toEqual([
      "bridge",
      "inn",
      "well",
      "maze",
      "prison",
      "death",
    ]);
  });

  it("herkent de eerste-worp-regel", () => {
    expect(firstThrowTarget([5, 4])).toBe(53);
    expect(firstThrowTarget([4, 5])).toBe(53);
    expect(firstThrowTarget([6, 3])).toBe(26);
    expect(firstThrowTarget([3, 6])).toBe(26);
    expect(firstThrowTarget([2, 2])).toBeNull();
  });

  it("gaat op een gans hetzelfde aantal ogen verder", () => {
    const move = movePlayer(0, [2, 3]);
    expect(move.position).toBe(10);
    expect(move.steps).toEqual([
      { kind: "roll", from: 0, to: 5 },
      { kind: "goose", from: 5, to: 10 },
    ]);
  });

  it("ketent ganzen tot de finish", () => {
    const move = movePlayer(9, [3, 6]);
    expect(move.position).toBe(63);
    expect(move.steps.filter((step) => step.kind === "goose").length).toBe(5);
  });

  it("telt bij een te hoge worp terug vanaf 63", () => {
    const move = movePlayer(60, [3, 4]);
    expect(move.position).toBe(52);
    expect(move.steps).toContainEqual({ kind: "bounce", from: 60, to: 59 });
    expect(move.steps).toContainEqual({ kind: "goose", from: 59, to: 52 });
  });
});

describe("ganzenbord: speciale vakjes", () => {
  it("stuurt de brug naar 12", () => {
    const result = playTurn(gameAt({ one: 0 }), [3, 3]);
    expect(player(result.game, "one")?.position).toBe(12);
    expect(result.events).toContainEqual({ kind: "bridge", player: "one", from: 6, to: 12 });
  });

  it("laat de herberg een beurt overslaan", () => {
    const result = playTurn(gameAt({ one: 12 }), [3, 4]);
    expect(player(result.game, "one")?.position).toBe(19);
    expect(player(result.game, "one")?.skipTurns).toBe(1);
    expect(result.game.current).toBe("two");

    const next = playTurn(result.game, [1, 1]);
    expect(next.game.current).toBe("two");
    expect(player(next.game, "one")?.skipTurns).toBe(0);
    expect(next.events).toContainEqual({ kind: "skip", player: "one", value: 1 });

    const afterSkip = playTurn(next.game, [1, 1]);
    expect(afterSkip.game.current).toBe("one");
  });

  it("laat de put een andere speler aflossen", () => {
    const first = playTurn(gameAt({ one: 20 }), [5, 6]);
    expect(player(first.game, "one")?.stuckOn).toBe(31);

    const withTwoAt20 = {
      ...first.game,
      current: "two" as const,
      players: first.game.players.map((candidate) =>
        candidate.id === "two" ? { ...candidate, position: 20 } : candidate,
      ),
    };
    const second = playTurn(withTwoAt20, [5, 6]);
    expect(player(second.game, "one")?.stuckOn).toBeNull();
    expect(player(second.game, "two")?.stuckOn).toBe(31);
    expect(second.events).toContainEqual({
      kind: "free",
      player: "one",
      other: "two",
      value: 31,
    });
  });

  it("stuurt het doolhof terug naar 37", () => {
    const result = playTurn(gameAt({ one: 36 }), [3, 3]);
    expect(player(result.game, "one")?.position).toBe(37);
    expect(result.events).toContainEqual({ kind: "maze", player: "one", from: 42, to: 37 });
  });

  it("zet de gevangenis vast", () => {
    const result = playTurn(gameAt({ one: 46 }), [3, 3]);
    expect(player(result.game, "one")?.stuckOn).toBe(52);
    expect(result.events).toContainEqual({ kind: "prison", player: "one", from: 52, to: 52 });
  });

  it("stuurt de dood naar start", () => {
    const result = playTurn(gameAt({ one: 56 }), [1, 1]);
    expect(player(result.game, "one")?.position).toBe(0);
    expect(result.events).toContainEqual({ kind: "death", player: "one", from: 58, to: 0 });
  });

  it("eindigt in gelijkspel als iedereen vastzit", () => {
    const start = gameAt({ one: 29, two: 52 });
    const withTwoStuck = {
      ...start,
      players: start.players.map((candidate) =>
        candidate.id === "two" ? { ...candidate, stuckOn: 52 } : candidate,
      ),
    };
    const result = playTurn(withTwoStuck, [1, 1]);
    expect(result.game.status).toBe("draw");
    expect(result.events.some((event) => event.kind === "draw")).toBe(true);
  });
});

describe("ganzenbord: beurten en einde", () => {
  it("past de eerste-worp-regel alleen op de eerste worp toe", () => {
    const first = playTurn(createGame(TWO_PLAYERS), [5, 4]);
    expect(player(first.game, "one")?.position).toBe(53);
    expect(first.game.current).toBe("two");

    const second = playTurn({ ...first.game, current: "one" }, [5, 4]);
    expect(player(second.game, "one")?.position).toBe(62);
  });

  it("wint alleen met een precieze worp op 63", () => {
    const result = playTurn(gameAt({ one: 61 }), [1, 1]);
    expect(result.game.status).toBe("finished");
    expect(result.game.winner).toBe("one");
    expect(player(result.game, "one")?.position).toBe(63);
    expect(isFinished(result.game)).toBe(true);
  });

  it("laat een te hoge worp niet winnen", () => {
    const result = playTurn(gameAt({ one: 62 }), [1, 1]);
    expect(result.game.status).toBe("playing");
    expect(player(result.game, "one")?.position).toBe(62);
  });

  it("weigert ongeldige worpen en een speler die niet mag gooien", () => {
    expect(() => playTurn(gameAt({ one: 0 }), [0, 1])).toThrow();
    expect(() => playTurn(gameAt({ one: 0 }), [7, 1])).toThrow();

    const stuck = gameAt({ one: 31 });
    const withStuck = {
      ...stuck,
      players: stuck.players.map((candidate) =>
        candidate.id === "one" ? { ...candidate, stuckOn: 31 } : candidate,
      ),
    };
    expect(() => playTurn(withStuck, [1, 1])).toThrow();
  });

  it("bewaart de controller per speler en de vaste volgorde", () => {
    const game = createGame(
      [
        { id: "three", controller: "computer" },
        { id: "one", controller: "human" },
        { id: "two", controller: "computer" },
      ],
      "two",
    );
    expect(game.players.map((candidate) => candidate.id)).toEqual(["one", "two", "three"]);
    expect(player(game, "three")?.controller).toBe("computer");
    expect(game.current).toBe("two");
  });

  it("speelt duizenden willekeurige partijen zonder vast te lopen", () => {
    const random = mulberry32(2026_11_05);

    for (let gameNumber = 0; gameNumber < 500; gameNumber += 1) {
      const count = 2 + Math.floor(random() * 3);
      const setups = (["one", "two", "three", "four"] as const)
        .slice(0, count)
        .map((id) => ({ id, controller: random() < 0.5 ? "human" : "computer" }) as const);
      let game = createGame(setups);
      let turns = 0;

      while (!isFinished(game) && turns < 1000) {
        const current = game.players.find((candidate) => candidate.id === game.current);
        expect(current).toBeDefined();
        expect(
          current?.stuckOn === null || current?.stuckOn === 31 || current?.stuckOn === 52,
        ).toBe(true);

        const dice = [1 + Math.floor(random() * 6), 1 + Math.floor(random() * 6)] as const;
        game = playTurn(game, dice).game;
        turns += 1;

        for (const candidate of game.players) {
          expect(candidate.position).toBeGreaterThanOrEqual(0);
          expect(candidate.position).toBeLessThanOrEqual(63);
          expect(candidate.skipTurns).toBeGreaterThanOrEqual(0);
        }
      }

      expect(turns).toBeLessThan(1000);
      if (game.status === "finished") {
        expect(player(game, game.winner ?? "one")?.position).toBe(63);
      }
    }
  });
});
