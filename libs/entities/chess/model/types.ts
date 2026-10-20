import type { Color, PieceSymbol, Square } from "chess.js";

export type ChessMode = "computer" | "friend";

export const COMPUTER_LEVELS = ["makkelijk", "middel", "moeilijk"] as const;

export type ComputerLevel = (typeof COMPUTER_LEVELS)[number];

export interface ComputerLevelInfo {
  readonly label: string;
  readonly emoji: string;
  readonly hint: string;
  /** Stockfish `Skill Level`, 0–20. */
  readonly skill: number;
  /** Bedenktijd per zet in milliseconden. */
  readonly movetime: number;
}

export interface ChessPlayer {
  readonly name: string;
  readonly avatar: string;
}

/** Eén gespeelde zet. De kleur maakt de zettenlijst en slaglijst kleurvast. */
export interface ChessMoveRecord {
  readonly from: Square;
  readonly to: Square;
  readonly san: string;
  readonly color: Color;
  readonly captured?: PieceSymbol;
  readonly promotion?: PieceSymbol;
}

export type ChessResult =
  | { readonly kind: "playing"; readonly check: boolean }
  | { readonly kind: "checkmate"; readonly winner: Color }
  | { readonly kind: "stalemate" }
  | {
      readonly kind: "draw";
      readonly reason: "fifty-moves" | "repetition" | "insufficient-material" | "draw";
    }
  | { readonly kind: "resigned"; readonly winner: Color };

export type ChessMoveError =
  | "invalid-square"
  | "no-piece"
  | "wrong-color"
  | "illegal-move"
  | "promotion-required";

export type ChessMoveResult =
  | {
      readonly ok: true;
      readonly fen: string;
      readonly move: ChessMoveRecord;
      readonly result: ChessResult;
    }
  | { readonly ok: false; readonly reason: ChessMoveError };
