import { useCallback, useState } from "react";
import { resolveSquareClick, selectionForAction } from "@shared/lib";
import {
  attemptPuzzleMove,
  createPuzzleState,
  hintFor,
  legalPuzzleMoves,
  type PuzzleAttempt,
} from "./puzzle-engine";
import type { ChessPuzzle, PuzzleState, UseChessPuzzleResult } from "./types";

function stateAfterAttempt(
  state: PuzzleState,
  attempt: Extract<PuzzleAttempt, { ok: true }>,
): PuzzleState {
  return {
    ...state,
    fen: attempt.nextFen,
    remainingMoves: attempt.remainingMoves,
    lastMove: attempt.opponentReply ?? attempt.playerMove,
    selectedSquare: null,
    legalTargets: [],
    hintMove: null,
    status: attempt.solved ? "solved" : "playing",
    feedback: attempt.solved ? "solved" : "correct",
  };
}

function wrongState(state: PuzzleState): PuzzleState {
  return {
    ...state,
    selectedSquare: null,
    legalTargets: [],
    hintMove: null,
    feedback: "wrong",
  };
}

export function useChessPuzzle(puzzle: ChessPuzzle): UseChessPuzzleResult {
  const [state, setState] = useState<PuzzleState>(() => createPuzzleState(puzzle));

  const resetPuzzle = useCallback(() => {
    setState(createPuzzleState(puzzle));
  }, [puzzle]);

  const onPieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string | null): boolean => {
      if (!targetSquare || state.status === "solved") {
        return false;
      }

      const attempt = attemptPuzzleMove(state, sourceSquare, targetSquare);

      if (!attempt.ok) {
        setState(wrongState(state));
        return false;
      }

      setState(stateAfterAttempt(state, attempt));
      return true;
    },
    [state],
  );

  const onSquareClick = useCallback(
    (square: string) => {
      if (state.status === "solved") {
        return;
      }

      const action = resolveSquareClick(
        {
          selectedSquare: state.selectedSquare,
          legalTargets: state.legalTargets,
        },
        square,
        (candidate) => legalPuzzleMoves(state, candidate),
      );

      if (action.kind !== "attempt") {
        setState({
          ...state,
          ...selectionForAction(action),
          feedback: "idle",
        });
        return;
      }

      const attempt = attemptPuzzleMove(state, action.from, action.to);

      if (!attempt.ok) {
        setState(wrongState(state));
        return;
      }

      setState(stateAfterAttempt(state, attempt));
    },
    [state],
  );

  const getLegalMoves = useCallback((square: string) => legalPuzzleMoves(state, square), [state]);

  const showHint = useCallback(() => {
    if (state.status === "solved") {
      return;
    }

    setState({
      ...state,
      hintMove: hintFor(state),
      feedback: "idle",
    });
  }, [state]);

  return {
    puzzle: state.puzzle,
    fen: state.fen,
    playerColor: state.playerColor,
    lastMove: state.lastMove,
    selectedSquare: state.selectedSquare,
    legalTargets: state.legalTargets,
    hintMove: state.hintMove,
    status: state.status,
    feedback: state.feedback,
    onPieceDrop,
    onSquareClick,
    getLegalMoves,
    showHint,
    resetPuzzle,
  };
}
