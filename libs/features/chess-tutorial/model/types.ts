import type { PieceSymbol, Square } from "chess.js";

export const TUTORIAL_LEVEL_IDS = [
  "rook-train",
  "bishop-line",
  "queen-dance",
  "knight-jump",
  "king-step",
  "pawn-crossing",
  "castling",
  "check",
  "checkmate",
] as const;

export type TutorialLevelId = (typeof TUTORIAL_LEVEL_IDS)[number];

/** Speciale opdrachten naast het bereiken van een doelveld. */
export type TutorialGoal = "check" | "checkmate" | "castle-kingside" | "castle-queenside";

/** Eén geïsoleerde schaakles. De FEN bevat alleen de stukken van deze les. */
export interface TutorialLevel {
  readonly id: TutorialLevelId;
  readonly title: string;
  /** Eén korte opdracht die het kind meteen kan uitvoeren. */
  readonly instruction: string;
  /** Korte zin bij de visuele uitleg voordat het kind gaat zetten. */
  readonly preview: string;
  /** Korte uitleg, alleen zichtbaar achter "Waarom?". */
  readonly explanation: string;
  readonly initialFen: string;
  /** Het veld met de ster. Ontbreekt bij een vrije oefening of schaakopdracht. */
  readonly targetSquare?: Square;
  /** Het witte stuk dat het kind in deze les bestuurt. */
  readonly playerPiece: PieceSymbol;
  /** Tip achter "Waarom?" voor wie meer wil weten. */
  readonly hint: string;
  /** Korte aanmoediging na een geldige tussenstap. */
  readonly nextStep?: string;
  /** Korte viering als de les klaar is. */
  readonly success?: string;
  /** Minimum aantal zetten voordat de ster telt. */
  readonly minimumMoves?: number;
  /** Speciale opdracht. Zonder goal telt het doelveld. */
  readonly goal?: TutorialGoal;
}

/** De eerstvolgende zet die de tutorial visueel aanwijst. */
export interface TutorialHint {
  readonly from: Square;
  readonly to: Square;
}

/** Alle velden die het lesstuk vanaf zijn huidige plek kan bereiken. */
export interface TutorialPreview {
  readonly square: Square;
  readonly targets: readonly Square[];
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
      /** De opdracht kan met deze stelling niet meer worden gehaald. */
      readonly stuck: boolean;
    }
  | {
      readonly ok: false;
      readonly reason: TutorialMoveError;
    };

export type TutorialStatus = "playing" | "completed" | "stuck";
export type TutorialFeedback = "idle" | "illegal" | "moved" | "hint" | "blocked";

export interface TutorialState {
  readonly level: TutorialLevel;
  readonly fen: string;
  readonly selectedSquare: Square | null;
  readonly legalTargets: readonly Square[];
  readonly lastMove: TutorialMove | null;
  readonly hintMove: TutorialHint | null;
  readonly preview: TutorialPreview | null;
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
  readonly hintMove: TutorialHint | null;
  readonly preview: TutorialPreview | null;
  readonly moveCount: number;
  readonly status: TutorialStatus;
  readonly feedback: TutorialFeedback;
  readonly loadLevel: (levelId: TutorialLevelId) => void;
  readonly resetLevel: () => void;
  readonly showHint: () => void;
  readonly togglePreview: () => void;
  readonly onPieceDrop: (sourceSquare: string, targetSquare: string | null) => boolean;
  readonly onSquareClick: (square: string) => void;
  readonly getLegalMoves: (square: string) => readonly Square[];
}
