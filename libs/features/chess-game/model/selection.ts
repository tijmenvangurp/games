import type { Square } from "chess.js";
import { isChessSquare } from "@shared/lib";

interface BoardSelection {
  readonly selectedSquare: Square | null;
  readonly legalTargets: readonly Square[];
}

type SquareClickAction =
  | { readonly kind: "clear" }
  | { readonly kind: "attempt"; readonly from: Square; readonly to: Square }
  | {
      readonly kind: "select";
      readonly square: Square;
      readonly legalTargets: readonly Square[];
    };

/**
 * De partij ondersteunt tikken om te zetten: eerst het stuk, daarna een
 * gemarkeerd doelveld. De tutorial en puzzels gebruiken alleen tikken om te
 * kijken via `selectionAfterClick` in `@shared/lib`.
 */
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
