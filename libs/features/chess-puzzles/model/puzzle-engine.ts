import { Chess, type Color, type Move, type Piece, type Square } from "chess.js";
import { isChessSquare } from "@shared/lib";
import type { ChessPuzzle, PuzzleMove, PuzzleState } from "./types";

export type PuzzleAttemptError =
  | "invalid-square"
  | "no-piece"
  | "wrong-color"
  | "illegal-move"
  | "wrong-solution"
  | "invalid-puzzle";

export type PuzzleAttempt =
  | {
      readonly ok: true;
      readonly playerMove: PuzzleMove;
      readonly opponentReply: PuzzleMove | null;
      readonly nextFen: string;
      readonly remainingMoves: readonly string[];
      readonly solved: boolean;
    }
  | {
      readonly ok: false;
      readonly reason: PuzzleAttemptError;
    };

function parseUci(value: string): {
  readonly from: Square;
  readonly to: Square;
  readonly promotion?: string;
} {
  const from = value.slice(0, 2);
  const to = value.slice(2, 4);
  const promotion = value.slice(4);

  if (!isChessSquare(from) || !isChessSquare(to)) {
    throw new Error(`Ongeldige UCI-zet: ${value}`);
  }

  return {
    from,
    to,
    ...(promotion ? { promotion } : {}),
  };
}

export function createPuzzleState(puzzle: ChessPuzzle): PuzzleState {
  if (puzzle.moves.length < 2) {
    throw new Error(`Puzzel ${puzzle.id} heeft geen spelerszet.`);
  }

  const chess = new Chess(puzzle.fen);
  const setupMove = chess.move(parseUci(puzzle.moves[0]));
  const remainingMoves = puzzle.moves.slice(1);

  return {
    puzzle,
    fen: chess.fen(),
    playerColor: chess.turn(),
    remainingMoves,
    lastMove: toPuzzleMove(setupMove),
    selectedSquare: null,
    legalTargets: [],
    hintMove: null,
    status: "playing",
    feedback: "idle",
  };
}

export function legalPuzzleMoves(state: PuzzleState, square: string): readonly Square[] {
  if (!isChessSquare(square)) {
    return [];
  }

  const chess = new Chess(state.fen);
  const piece = chess.get(square);

  if (!piece || piece.color !== state.playerColor) {
    return [];
  }

  return chess.moves({ square, verbose: true }).map((move) => move.to);
}

type PlayerMoveResult =
  | {
      readonly ok: true;
      readonly move: Move;
      readonly solved: boolean;
    }
  | {
      readonly ok: false;
      readonly reason: PuzzleAttemptError;
    };

type PlayerPieceResult =
  | { readonly ok: true; readonly piece: Piece }
  | { readonly ok: false; readonly reason: PuzzleAttemptError };

function resolvePlayerPiece(chess: Chess, from: Square, playerColor: Color): PlayerPieceResult {
  const piece = chess.get(from);

  if (!piece) {
    return { ok: false, reason: "no-piece" };
  }

  if (piece.color !== playerColor) {
    return { ok: false, reason: "wrong-color" };
  }

  return { ok: true, piece };
}

function promotionFor(
  piece: Piece,
  to: Square,
  playerColor: Color,
  expected: string,
): string | undefined {
  if (piece.type !== "p") {
    return undefined;
  }

  if (to[1] !== (playerColor === "w" ? "8" : "1")) {
    return undefined;
  }

  return parseUci(expected).promotion ?? "q";
}

function tryPlayerMove(
  chess: Chess,
  from: Square,
  to: Square,
  promotion: string | undefined,
): Move | null {
  try {
    return chess.move({
      from,
      to,
      ...(promotion ? { promotion } : {}),
    });
  } catch {
    return null;
  }
}

function resolvePlayerMove(
  chess: Chess,
  state: PuzzleState,
  from: Square,
  to: Square,
): PlayerMoveResult {
  const expected = state.remainingMoves[0];

  if (!expected) {
    return { ok: false, reason: "invalid-puzzle" };
  }

  const source = resolvePlayerPiece(chess, from, state.playerColor);

  if (!source.ok) {
    return source;
  }

  const move = tryPlayerMove(
    chess,
    from,
    to,
    promotionFor(source.piece, to, state.playerColor, expected),
  );

  if (!move) {
    return { ok: false, reason: "illegal-move" };
  }

  if (!chess.isCheckmate() && uciOf(move) !== expected) {
    return { ok: false, reason: "wrong-solution" };
  }

  return {
    ok: true,
    move,
    solved: chess.isCheckmate() || state.remainingMoves.length === 1,
  };
}

type OpponentReplyResult =
  | {
      readonly ok: true;
      readonly move: Move;
      readonly remainingMoves: readonly string[];
    }
  | {
      readonly ok: false;
      readonly reason: PuzzleAttemptError;
    };

function applyOpponentReply(chess: Chess, state: PuzzleState): OpponentReplyResult {
  const opponentUci = state.remainingMoves[1];

  if (!opponentUci) {
    return { ok: false, reason: "invalid-puzzle" };
  }

  try {
    return {
      ok: true,
      move: chess.move(parseUci(opponentUci)),
      remainingMoves: state.remainingMoves.slice(2),
    };
  } catch {
    return { ok: false, reason: "invalid-puzzle" };
  }
}

export function attemptPuzzleMove(state: PuzzleState, from: string, to: string): PuzzleAttempt {
  if (!isChessSquare(from) || !isChessSquare(to)) {
    return { ok: false, reason: "invalid-square" };
  }

  const chess = new Chess(state.fen);
  const player = resolvePlayerMove(chess, state, from, to);

  if (!player.ok) {
    return player;
  }

  if (player.solved) {
    return {
      ok: true,
      playerMove: toPuzzleMove(player.move),
      opponentReply: null,
      nextFen: chess.fen(),
      remainingMoves: [],
      solved: true,
    };
  }

  const reply = applyOpponentReply(chess, state);

  if (!reply.ok) {
    return reply;
  }

  return {
    ok: true,
    playerMove: toPuzzleMove(player.move),
    opponentReply: toPuzzleMove(reply.move),
    nextFen: chess.fen(),
    remainingMoves: reply.remainingMoves,
    solved: false,
  };
}

export function hintFor(state: PuzzleState): { readonly from: Square; readonly to: Square } | null {
  const next = state.remainingMoves[0];

  if (!next) {
    return null;
  }

  const { from, to } = parseUci(next);

  return { from, to };
}

function toPuzzleMove(move: Move): PuzzleMove {
  return {
    from: move.from,
    to: move.to,
    san: move.san,
    ...(move.captured ? { captured: move.captured } : {}),
  };
}

function uciOf(move: Move): string {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}
