import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js";
import { isChessSquare } from "@shared/lib";
import type { ChessMoveError, ChessMoveRecord, ChessMoveResult, ChessResult } from "./types";

export const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function otherColor(color: Color): Color {
  return color === "w" ? "b" : "w";
}

export function turnOf(fen: string): Color {
  return fen.split(" ")[1] === "b" ? "b" : "w";
}

/**
 * De FEN blijft de enige bron van waarheid. Elke functie maakt een tijdelijke
 * `Chess`-instantie, zodat React StrictMode en dubbele renders nooit een zet
 * kunnen dubbel uitvoeren.
 */
export function legalMoves(fen: string, square: string): readonly Square[] {
  if (!isChessSquare(square)) {
    return [];
  }

  const chess = new Chess(fen);
  const piece = chess.get(square);

  if (!piece || piece.color !== chess.turn()) {
    return [];
  }

  return chess.moves({ square, verbose: true }).map((move) => move.to);
}

export function playMove(
  fen: string,
  from: string,
  to: string,
  promotion?: PieceSymbol,
): ChessMoveResult {
  if (!isChessSquare(from) || !isChessSquare(to)) {
    return fail("invalid-square");
  }

  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch {
    return fail("illegal-move");
  }

  const piece = chess.get(from);

  if (!piece) {
    return fail("no-piece");
  }

  if (piece.color !== chess.turn()) {
    return fail("wrong-color");
  }

  const promotionRank = chess.turn() === "w" ? "8" : "1";
  if (piece.type === "p" && to[1] === promotionRank && !promotion) {
    return fail("promotion-required");
  }

  let applied: Move;
  try {
    applied = chess.move({
      from,
      to,
      ...(promotion ? { promotion } : {}),
    });
  } catch {
    return fail("illegal-move");
  }

  return {
    ok: true,
    fen: chess.fen(),
    move: toRecord(applied),
    result: resultOf(chess),
  };
}

export function describeResult(fen: string): ChessResult {
  return resultOf(new Chess(fen));
}

export function checkedKingSquare(fen: string): Square | null {
  const chess = new Chess(fen);

  if (!chess.isCheck()) {
    return null;
  }

  const color = chess.turn();

  for (const row of chess.board()) {
    for (const piece of row) {
      if (piece?.type === "k" && piece.color === color) {
        return piece.square;
      }
    }
  }

  return null;
}

/** Replayt SAN-zetten vanaf de standaard beginstelling. Gebruikt voor undo. */
export function fenAfterMoves(sans: readonly string[]): string {
  const chess = new Chess();

  for (const san of sans) {
    chess.move(san);
  }

  return chess.fen();
}

function resultOf(chess: Chess): ChessResult {
  if (chess.isCheckmate()) {
    return { kind: "checkmate", winner: otherColor(chess.turn()) };
  }

  if (chess.isStalemate()) {
    return { kind: "stalemate" };
  }

  if (chess.isInsufficientMaterial()) {
    return { kind: "draw", reason: "insufficient-material" };
  }

  if (chess.isThreefoldRepetition()) {
    return { kind: "draw", reason: "repetition" };
  }

  if (chess.isDrawByFiftyMoves()) {
    return { kind: "draw", reason: "fifty-moves" };
  }

  if (chess.isDraw()) {
    return { kind: "draw", reason: "draw" };
  }

  return { kind: "playing", check: chess.isCheck() };
}

function toRecord(move: Move): ChessMoveRecord {
  return {
    from: move.from,
    to: move.to,
    san: move.san,
    color: move.color,
    ...(move.captured ? { captured: move.captured } : {}),
    ...(move.promotion ? { promotion: move.promotion } : {}),
  };
}

function fail(reason: ChessMoveError): ChessMoveResult {
  return { ok: false, reason };
}
