import { describe, expect, it } from "vitest";
import { createGame, playTurn, type GanzenbordGame, type PlayerId } from "@entities/ganzenbord";
import { buildTurnAnimation, eventCard } from "../../libs/features/ganzenbord/model/animation";

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

function cardKinds(steps: ReturnType<typeof animationFor>["steps"]) {
  return steps.flatMap((step) => {
    const card = eventCard(step);
    return card ? [{ kind: card.kind, position: step.position }] : [];
  });
}

describe("ganzenbord: animatiestappen", () => {
  it("loopt bij een gewone worp vakje voor vakje en toont de gans op het vak", () => {
    const { steps } = animationFor(gameAt({ one: 0 }), [2, 3]);

    expect(steps.map((step) => step.position)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(steps[0]?.event?.kind).toBe("roll");
    expect(cardKinds(steps)).toEqual([{ kind: "goose", position: 5 }]);
    expect(steps.at(-1)?.event).toBeUndefined();
    expect(steps.every((step) => step.delayMs > 0)).toBe(true);
  });

  it("toont de brug op vak 6 en springt daarna naar 12", () => {
    const { steps } = animationFor(gameAt({ one: 0 }), [3, 3]);

    expect(steps.map((step) => step.position)).toEqual([0, 1, 2, 3, 4, 5, 6, 12]);
    expect(cardKinds(steps)).toEqual([{ kind: "bridge", position: 6 }]);
    expect(steps.at(-1)?.event).toBeUndefined();
  });

  it("laat een gans, de terugteller en de gevangenis apart zien", () => {
    const { steps } = animationFor(gameAt({ one: 60 }), [3, 4]);

    expect(steps[0]?.position).toBe(60);
    expect(cardKinds(steps)).toEqual([
      { kind: "bounce", position: 60 },
      { kind: "goose", position: 59 },
      { kind: "prison", position: 52 },
    ]);
    expect(steps.map((step) => step.position)).toContain(58);
    expect(steps.at(-1)?.position).toBe(52);
  });

  it("loopt eerst naar 9 en springt pas daarna bij de eerste worp", () => {
    const first = animationFor(createGame(SETUPS), [5, 4]);

    expect(first.steps.map((step) => step.position)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 53]);
    expect(cardKinds(first.steps)).toEqual([{ kind: "first-throw", position: 9 }]);
    expect(first.steps.at(-1)?.position).toBe(53);

    const finish = animationFor(gameAt({ one: 61 }), [1, 1]);
    expect(finish.steps.map((step) => step.position)).toEqual([61, 62, 63]);
    expect(cardKinds(finish.steps)).toEqual([{ kind: "win", position: 63 }]);
  });

  it("houdt een stap over voor een worp die direct vastloopt", () => {
    const { steps } = animationFor(gameAt({ one: 25 }), [3, 3]);

    expect(steps.at(-1)?.position).toBe(31);
    expect(cardKinds(steps)).toEqual([{ kind: "well", position: 31 }]);
  });

  it("animeert de keten op 50 met 4 + 5: eerst de gans, dan de dood", () => {
    const { steps } = animationFor(gameAt({ one: 50 }), [4, 5]);

    expect(steps[0]?.position).toBe(50);
    expect(steps.map((step) => step.position)).toContain(59);
    expect(steps.map((step) => step.position)).toContain(58);
    expect(cardKinds(steps)).toEqual([
      { kind: "goose", position: 59 },
      { kind: "death", position: 58 },
    ]);
    expect(steps.at(-1)?.position).toBe(0);
  });

  it("herkent alleen echte gebeurtenissen als kaart", () => {
    expect(eventCard(undefined)).toBeUndefined();
    expect(eventCard({ position: 1, delayMs: 1, event: { kind: "roll", player: "one" } })).toBe(
      undefined,
    );
    expect(
      eventCard({ position: 1, delayMs: 1, event: { kind: "move", player: "one", to: 2 } }),
    ).toBeUndefined();
    expect(
      eventCard({ position: 5, delayMs: 1, event: { kind: "goose", player: "one", to: 9 } }),
    ).toMatchObject({ kind: "goose" });
  });
});
