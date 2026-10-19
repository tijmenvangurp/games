import { useCallback, useState } from "react";
import { pieceColorAt, playHaptic, selectionAfterClick } from "@shared/lib";
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
    playHaptic("tap");
    setState(createPuzzleState(puzzle));
  }, [puzzle]);

  const onPieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string | null): boolean => {
      if (!targetSquare || state.status === "solved") {
        return false;
      }

      const attempt = attemptPuzzleMove(state, sourceSquare, targetSquare);

      if (!attempt.ok) {
        playHaptic("wrong");
        setState(wrongState(state));
        return false;
      }

      playHaptic(attempt.solved ? "win" : "select");
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

      playHaptic("tap");

      const selection = selectionAfterClick(
        {
          selectedSquare: state.selectedSquare,
          legalTargets: state.legalTargets,
        },
        square,
        (candidate) => legalPuzzleMoves(state, candidate),
      );

      // Een tik selecteert alleen, ook een stuk van de tegenstander. De zet
      // zelf volgt pas bij slepen en neerzetten.
      setState({
        ...state,
        ...selection,
        hintMove: null,
        feedback: "idle",
      });
    },
    [state],
  );

  const getLegalMoves = useCallback((square: string) => legalPuzzleMoves(state, square), [state]);

  const showHint = useCallback(() => {
    if (state.status === "solved") {
      return;
    }

    playHaptic("hint");
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
    selectedColor: state.selectedSquare ? pieceColorAt(state.fen, state.selectedSquare) : null,
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
