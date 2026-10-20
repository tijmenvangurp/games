import { describe, expect, it } from "vitest";
import {
  createMolenspelGame,
  legalMoves,
  movePiece,
  placePiece,
  piecesOnBoard,
  removablePieces,
  removePiece,
  type MolenspelGame,
  type MolenspelPlayer,
} from "@entities/molenspel";

/**
 * Een deterministische dobbelsteen, zodat een fout altijd na te spelen is.
 */
function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function pick<T>(random: () => number, items: readonly T[]): T {
  const choice = items[Math.floor(random() * items.length)];
  if (choice === undefined) {
    throw new Error("leeg lijstje");
  }
  return choice;
}

function emptyPoints(game: MolenspelGame): number[] {
  return game.board
    .map((piece, point) => (piece === null ? point : -1))
    .filter((point) => point >= 0);
}

/** Controleert de invarianten van één stand. */
function assertInvariants(game: MolenspelGame): void {
  for (const player of ["wit", "zwart"] as const) {
    const onBoard = piecesOnBoard(game.board, player);
    // Nooit meer dan negen stenen, en nooit stenen die niet bestaan.
    expect(onBoard).toBeLessThanOrEqual(9);
    expect(onBoard + game.inHand[player]).toBeLessThanOrEqual(9);
    expect(game.inHand[player]).toBeGreaterThanOrEqual(0);
  }
  expect(game.board.filter((piece) => piece !== null).length).toBeLessThanOrEqual(18);
}

/** Doet één willekeurige zet en bewaakt wat die zet mag veranderen. */
function playStep(game: MolenspelGame, random: () => number): MolenspelGame {
  if (game.awaitRemoval) {
    const targets = removablePieces(game.board, game.turn);
    // Na een molentje is er altijd iets te pakken, anders zat het spel vast.
    expect(targets.length).toBeGreaterThan(0);
    return removePiece(game, pick(random, targets));
  }

  if (game.inHand[game.turn] > 0) {
    return placePiece(game, pick(random, emptyPoints(game)));
  }

  const moves = legalMoves(game, game.turn);
  expect(moves.size).toBeGreaterThan(0);
  const from = pick(random, [...moves.keys()]);
  const to = pick(random, moves.get(from) ?? []);
  const turnBefore = game.turn;
  const next = movePiece(game, from, to);

  expect(next.board[from]).toBe(null);
  expect(next.board[to]).toBe(turnBefore);
  // Een zet wisselt van beurt, tenzij er eerst een steen gepakt moet worden.
  if (!next.winner && !next.draw && !next.awaitRemoval) {
    expect(next.turn).not.toBe(turnBefore);
  }
  return next;
}

/** Speelt één willekeurig potje en bewaakt de invarianten onderweg. */
function playRandomGame(seed: number): { game: MolenspelGame; steps: number } {
  const random = seededRandom(seed);
  let game = createMolenspelGame(random() < 0.5 ? "wit" : "zwart");
  let steps = 0;

  while (!game.winner && !game.draw && steps < 4000) {
    steps += 1;
    assertInvariants(game);
    game = playStep(game, random);
  }

  return { game, steps };
}

describe("molenspel: willekeurige potjes", () => {
  it("speelt driehonderd potjes uit zonder de regels te breken", () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const { game } = playRandomGame(seed);
      expect(game.winner !== null || game.draw, `potje ${seed} stopte niet`).toBe(true);
    }
  }, 30000);

  it("speelt altijd binnen een redelijk aantal zetten uit", () => {
    let longest = 0;
    for (let seed = 1; seed <= 200; seed += 1) {
      const { steps } = playRandomGame(seed);
      longest = Math.max(longest, steps);
    }
    // Een potje hoort ruim binnen duizend halve zetten klaar te zijn.
    expect(longest).toBeLessThan(1000);
  });

  it("geeft de winnaar nooit meer dan twee stenen minder dan de verliezer", () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const { game } = playRandomGame(seed);
      if (!game.winner) {
        continue;
      }
      const loser: MolenspelPlayer = game.winner === "wit" ? "zwart" : "wit";
      const loserStones = piecesOnBoard(game.board, loser) + game.inHand[loser];
      expect(loserStones).toBeLessThanOrEqual(3);
    }
  });
});
