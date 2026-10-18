import type { PieceSymbol, Square } from "chess.js";

export const TUTORIAL_LEVEL_IDS = ["rook-train", "knight-jump", "pawn-crossing"] as const;

export type TutorialLevelId = (typeof TUTORIAL_LEVEL_IDS)[number];

/** Eén geïsoleerde schaakles. De FEN bevat alleen de stukken van deze les. */
export interface TutorialLevel {
  readonly id: TutorialLevelId;
  readonly title: string;
  readonly description: string;
  readonly initialFen: string;
  /** Het veld met de ster. Ontbreekt bij een vrije oefening. */
  readonly targetSquare?: Square;
  /** Het witte stuk dat het kind in deze les bestuurt. */
  readonly playerPiece: PieceSymbol;
  readonly hint: string;
  /** Minimum aantal zetten voordat de ster telt. */
  readonly minimumMoves?: number;
}

export interface TutorialMove {
  readonly from: Square;
  readonly to: Square;
  readonly san: string;
  readonly captured?: PieceSymbol;
}

export type TutorialMoveError =
  | "invalid-square"
  | "no-piece"
  | "wrong-color"
  | "wrong-piece"
  | "illegal-move";

export type TutorialMoveResult =
  | {
      readonly ok: true;
      readonly move: TutorialMove;
      readonly nextFen: string;
      readonly completed: boolean;
    }
  | {
      readonly ok: false;
      readonly reason: TutorialMoveError;
    };

export type TutorialStatus = "playing" | "completed";
export type TutorialFeedback = "idle" | "illegal" | "moved";

export interface TutorialState {
  readonly level: TutorialLevel;
  readonly fen: string;
  readonly selectedSquare: Square | null;
  readonly legalTargets: readonly Square[];
  readonly lastMove: TutorialMove | null;
  readonly moveCount: number;
  readonly status: TutorialStatus;
  readonly feedback: TutorialFeedback;
}

export interface UseChessTutorialOptions {
  readonly initialLevelId?: TutorialLevelId;
  readonly onComplete?: (level: TutorialLevel) => void;
}

export interface UseChessTutorialResult {
  readonly level: TutorialLevel;
  readonly fen: string;
  readonly selectedSquare: Square | null;
  readonly legalTargets: readonly Square[];
  readonly lastMove: TutorialMove | null;
  readonly moveCount: number;
  readonly status: TutorialStatus;
  readonly feedback: TutorialFeedback;
  readonly loadLevel: (levelId: TutorialLevelId) => void;
  readonly resetLevel: () => void;
  readonly onPieceDrop: (sourceSquare: string, targetSquare: string | null) => boolean;
  readonly onSquareClick: (square: string) => void;
  readonly getLegalMoves: (square: string) => readonly Square[];
}
