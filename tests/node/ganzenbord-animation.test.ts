import { describe, expect, it } from "vitest";
import { createGame, playTurn, type GanzenbordGame, type PlayerId } from "@entities/ganzenbord";
import { buildTurnAnimation } from "../../libs/features/ganzenbord/model/animation";

const SETUPS = [
  { id: "one", controller: "human" },
  { id: "two", controller: "human" },
] as const;

function gameAt(positions: Partial<Record<PlayerId, number>>, current: PlayerId = "one") {
  const game = createGame(SETUPS, current);
  return {
    ...game,
    players: game.players.map((player) => {
      const position = positions[player.id];
      return position === undefined ? player : { ...player, position, firstRollDone: true };
    }),
  } satisfies GanzenbordGame;
}

function animationFor(game: GanzenbordGame, dice: readonly [number, number]) {
  const result = playTurn(game, dice);
  const player = game.players.find((candidate) => candidate.id === game.current);
  if (!player) {
    throw new Error("Speler ontbreekt");
  }
  return { result, steps: buildTurnAnimation(player.position, player.id, result) };
}

describe("ganzenbord: animatiestappen", () => {
  it("loopt bij een gewone worp vakje voor vakje", () => {
    const { steps } = animationFor(gameAt({ one: 0 }), [2, 3]);

    expect(steps.map((step) => step.position)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(steps[0]?.event?.kind).toBe("roll");
    expect(steps.at(-1)?.event?.kind).toBe("goose");
    expect(steps.every((step) => step.delayMs > 0)).toBe(true);
  });

  it("toont de brug als een sprong met een gebeurtenis", () => {
    const { steps } = animationFor(gameAt({ one: 0 }), [3, 3]);

    expect(steps.map((step) => step.position)).toEqual([0, 1, 2, 3, 4, 5, 6, 12]);
    expect(steps.at(-1)?.event?.kind).toBe("bridge");
  });

  it("laat een gans en een terugteller zien", () => {
    const { steps } = animationFor(gameAt({ one: 60 }), [3, 4]);

    expect(steps[0]?.position).toBe(60);
    expect(steps.some((step) => step.event?.kind === "bounce")).toBe(true);
    expect(steps.at(-1)?.position).toBe(52);
    expect(steps.at(-1)?.event?.kind).toBe("prison");
    expect(steps.map((step) => step.position)).toContain(59);
  });

  it("toont de eerste-worp-sprong en de finish", () => {
    const first = animationFor(createGame(SETUPS), [5, 4]);
    expect(first.steps.at(-1)?.position).toBe(53);
    expect(first.steps.some((step) => step.event?.kind === "first-throw")).toBe(true);

    const finish = animationFor(gameAt({ one: 61 }), [1, 1]);
    expect(finish.steps.at(-1)?.position).toBe(63);
    expect(finish.steps.at(-1)?.event?.kind).toBe("win");
  });

  it("houdt een stap over voor een worp die direct vastloopt", () => {
    const { steps } = animationFor(gameAt({ one: 25 }), [3, 3]);
    expect(steps.at(-1)?.position).toBe(31);
    expect(steps.at(-1)?.event?.kind).toBe("well");
  });
});
