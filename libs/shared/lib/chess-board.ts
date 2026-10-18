import type { CSSProperties } from "react";
import { SQUARES, type Color, type Square } from "chess.js";
import type { ChessboardOptions } from "react-chessboard";

const SQUARE_NAMES: ReadonlySet<string> = new Set(SQUARES);

export function isChessSquare(value: string): value is Square {
  return SQUARE_NAMES.has(value);
}

export interface BoardMoveLike {
  readonly from: Square;
  readonly to: Square;
}

export interface BoardSelection {
  readonly selectedSquare: Square | null;
  readonly legalTargets: readonly Square[];
}

export type SquareClickAction =
  | { readonly kind: "clear" }
  | { readonly kind: "attempt"; readonly from: Square; readonly to: Square }
  | {
      readonly kind: "select";
      readonly square: Square;
      readonly legalTargets: readonly Square[];
    };

export function resolveSquareClick(
  selection: BoardSelection,
  square: string,
  legalMovesFor: (square: Square) => readonly Square[],
): SquareClickAction {
  if (!isChessSquare(square)) {
    return { kind: "clear" };
  }

  if (selection.selectedSquare === square) {
    return { kind: "clear" };
  }

  if (selection.selectedSquare && selection.legalTargets.includes(square)) {
    return { kind: "attempt", from: selection.selectedSquare, to: square };
  }

  const legalTargets = legalMovesFor(square);

  return legalTargets.length > 0 ? { kind: "select", square, legalTargets } : { kind: "clear" };
}

export function selectionForAction(
  action: Exclude<SquareClickAction, { readonly kind: "attempt" }>,
): BoardSelection {
  return action.kind === "select"
    ? { selectedSquare: action.square, legalTargets: action.legalTargets }
    : { selectedSquare: null, legalTargets: [] };
}

export interface SquareStylesInput {
  readonly lastMove: BoardMoveLike | null;
  readonly selectedSquare: Square | null;
  readonly legalTargets: readonly Square[];
  readonly previewSquare?: Square | null;
  readonly previewTargets?: readonly Square[];
  readonly targetSquare?: Square | null;
  readonly hintMove?: BoardMoveLike | null;
}

export function chessSquareStyles({
  lastMove,
  selectedSquare,
  legalTargets,
  previewSquare,
  previewTargets,
  targetSquare,
  hintMove,
}: SquareStylesInput): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = {};

  const merge = (square: Square, style: CSSProperties) => {
    styles[square] = { ...styles[square], ...style };
  };

  if (lastMove) {
    const lastMoveStyle: CSSProperties = {
      backgroundColor: "rgba(251, 191, 36, 0.22)",
    };
    merge(lastMove.from, lastMoveStyle);
    merge(lastMove.to, lastMoveStyle);
  }

  for (const square of legalTargets) {
    merge(square, {
      backgroundImage: "radial-gradient(circle, rgba(15, 118, 110, 0.7) 0 15%, transparent 16%)",
      boxShadow: "inset 0 0 0 4px rgba(13, 148, 136, 0.4)",
    });
  }

  for (const square of previewTargets ?? []) {
    merge(square, {
      backgroundImage: "radial-gradient(circle, rgba(2, 132, 199, 0.52) 0 15%, transparent 16%)",
      boxShadow: "inset 0 0 0 4px rgba(2, 132, 199, 0.3)",
    });
  }

  if (previewSquare) {
    merge(previewSquare, {
      boxShadow: "inset 0 0 0 4px rgba(2, 132, 199, 0.55)",
    });
  }

  if (targetSquare) {
    merge(targetSquare, {
      backgroundColor: "rgba(253, 230, 138, 0.42)",
      boxShadow: "inset 0 0 0 5px #f59e0b",
    });
  }

  if (selectedSquare) {
    merge(selectedSquare, {
      boxShadow: "inset 0 0 0 6px #0284c7",
    });
  }

  if (hintMove) {
    const hintStyle: CSSProperties = {
      backgroundColor: "rgba(253, 230, 138, 0.45)",
      boxShadow: "inset 0 0 0 6px #f59e0b",
    };
    merge(hintMove.from, hintStyle);
    merge(hintMove.to, hintStyle);
  }

  return styles;
}

export interface ChessBoardOptionsInput {
  readonly position: string;
  readonly playerColor: Color;
  readonly allowDragging: boolean;
  readonly squareStyles: Record<string, CSSProperties>;
  readonly onPieceDrop: (sourceSquare: string, targetSquare: string | null) => boolean;
  readonly onSquareClick: (square: string) => void;
}

export function chessBoardOptions({
  position,
  playerColor,
  allowDragging,
  squareStyles,
  onPieceDrop,
  onSquareClick,
}: ChessBoardOptionsInput): ChessboardOptions {
  return {
    position,
    boardOrientation: playerColor === "w" ? "white" : "black",
    showNotation: true,
    allowDragging,
    allowDragOffBoard: false,
    allowDrawingArrows: false,
    animationDurationInMs: 160,
    boardStyle: {
      borderRadius: "1.25rem",
      overflow: "hidden",
      boxShadow: "0 24px 60px -32px rgba(15, 23, 42, 0.55)",
    },
    lightSquareStyle: { backgroundColor: "#fef3c7" },
    darkSquareStyle: { backgroundColor: "#7dd3fc" },
    lightSquareNotationStyle: { color: "#92400e", opacity: 1 },
    darkSquareNotationStyle: { color: "#075985", opacity: 1 },
    alphaNotationStyle: {
      fontSize: "clamp(12px, 3.2vw, 18px)",
      fontWeight: 800,
      right: 5,
      bottom: 3,
    },
    numericNotationStyle: {
      fontSize: "clamp(12px, 3.2vw, 18px)",
      fontWeight: 800,
      left: 5,
      top: 3,
    },
    squareStyles,
    canDragPiece: ({ isSparePiece, piece }) =>
      !isSparePiece && piece.pieceType.startsWith(playerColor),
    onPieceDrop: ({ sourceSquare, targetSquare }) => onPieceDrop(sourceSquare, targetSquare),
    onSquareClick: ({ square }) => onSquareClick(square),
  };
}
