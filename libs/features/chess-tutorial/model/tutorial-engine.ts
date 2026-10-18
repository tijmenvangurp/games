import { Chess, SQUARES, type Move, type Square } from "chess.js";
import type { TutorialLevel, TutorialMove, TutorialMoveResult } from "./types";

const SQUARE_NAMES: ReadonlySet<string> = new Set(SQUARES);

export function isSquare(value: string): value is Square {
  return SQUARE_NAMES.has(value);
}

/**
 * De tutorial-FEN's hebben geen koningen. chess.js keurt zo'n stelling bij
 * `load` af, maar kan er met `skipValidation` prima legale zetten op
 * genereren. De zetvalidatie zelf blijft volledig intact.
 */
function createTutorialChess(fen: string): Chess {
  return new Chess(fen, { skipValidation: true });
}

/**
 * De tutorial is een drill: na elke zet is wit weer aan zet. Alleen de
 * stukopstelling blijft over; castling en en passant zijn hier niet nodig.
 */
export function rearmWhite(fen: string): string {
  const [placement] = fen.split(" ");

  if (!placement) {
    throw new Error(`Ongeldige FEN: ${fen}`);
  }

  return `${placement} w - - 0 1`;
}

export function legalMovesFor(
  level: TutorialLevel,
  fen: string,
  square: string,
): readonly Square[] {
  if (!isSquare(square)) {
    return [];
  }

  const chess = createTutorialChess(fen);
  const piece = chess.get(square);

  if (!piece || piece.color !== "w" || piece.type !== level.playerPiece) {
    return [];
  }

  return chess.moves({ square, verbose: true }).map((move) => move.to);
}

export function playTutorialMove(
  level: TutorialLevel,
  fen: string,
  from: string,
  to: string,
  moveCountBefore: number,
): TutorialMoveResult {
  if (!isSquare(from) || !isSquare(to)) {
    return { ok: false, reason: "invalid-square" };
  }

  const chess = createTutorialChess(fen);
  const piece = chess.get(from);

  if (!piece) {
    return { ok: false, reason: "no-piece" };
  }

  if (piece.color !== "w") {
    return { ok: false, reason: "wrong-color" };
  }

  if (piece.type !== level.playerPiece) {
    return { ok: false, reason: "wrong-piece" };
  }

  const applied = tryMove(chess, from, to);

  if (!applied) {
    return { ok: false, reason: "illegal-move" };
  }

  const move: TutorialMove = {
    from: applied.from,
    to: applied.to,
    san: applied.san,
    ...(applied.captured ? { captured: applied.captured } : {}),
  };
  const nextMoveCount = moveCountBefore + 1;

  return {
    ok: true,
    move,
    nextFen: rearmWhite(chess.fen()),
    completed: isGoalReached(level, applied.to, nextMoveCount),
  };
}

export function isGoalReached(level: TutorialLevel, square: Square, moveCount: number): boolean {
  if (!level.targetSquare || square !== level.targetSquare) {
    return false;
  }

  return moveCount >= (level.minimumMoves ?? 1);
}

function tryMove(chess: Chess, from: Square, to: Square): Move | null {
  try {
    return chess.move({ from, to, promotion: "q" });
  } catch {
    return null;
  }
}
