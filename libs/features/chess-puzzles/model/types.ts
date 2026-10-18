import type { Color, PieceSymbol, Square } from "chess.js";

export type PuzzleKind = "mate" | "capture" | "tactic";
export type PuzzleDifficulty = "easy" | "medium" | "hard";

export interface PuzzleDifficultyOption {
  readonly id: PuzzleDifficulty;
  readonly label: string;
  readonly hint: string;
}

export const PUZZLE_DIFFICULTIES = [
  { id: "easy", label: "Makkelijk", hint: "Eén zet" },
  { id: "medium", label: "Lastig", hint: "Twee zetten" },
  { id: "hard", label: "Uitdagend", hint: "Tactiek" },
] as const satisfies readonly PuzzleDifficultyOption[];

export interface ChessPuzzle {
  readonly id: string;
  readonly kind: PuzzleKind;
  readonly difficulty: PuzzleDifficulty;
  /** Lichess-FEN: de stelling vóór de eerste tegenzet. */
  readonly fen: string;
  /** UCI: eerst de tegenzet, daarna de oplossing. */
  readonly moves: readonly string[];
  readonly rating: number;
  readonly themes: readonly string[];
  readonly gameUrl: string;
}

export type PuzzleStatus = "playing" | "solved";
export type PuzzleFeedback = "idle" | "correct" | "wrong" | "solved";

export interface PuzzleMove {
  readonly from: Square;
  readonly to: Square;
  readonly san: string;
  readonly captured?: PieceSymbol;
}

export interface PuzzleState {
  readonly puzzle: ChessPuzzle;
  readonly fen: string;
  readonly playerColor: Color;
  readonly remainingMoves: readonly string[];
  readonly lastMove: PuzzleMove | null;
  readonly selectedSquare: Square | null;
  readonly legalTargets: readonly Square[];
  readonly hintMove: { readonly from: Square; readonly to: Square } | null;
  readonly status: PuzzleStatus;
  readonly feedback: PuzzleFeedback;
}

export interface UseChessPuzzleResult {
  readonly puzzle: ChessPuzzle;
  readonly fen: string;
  readonly playerColor: Color;
  readonly lastMove: PuzzleMove | null;
  readonly selectedSquare: Square | null;
  readonly legalTargets: readonly Square[];
  readonly hintMove: { readonly from: Square; readonly to: Square } | null;
  readonly status: PuzzleStatus;
  readonly feedback: PuzzleFeedback;
  readonly onPieceDrop: (sourceSquare: string, targetSquare: string | null) => boolean;
  readonly onSquareClick: (square: string) => void;
  readonly getLegalMoves: (square: string) => readonly Square[];
  readonly showHint: () => void;
  readonly resetPuzzle: () => void;
}
