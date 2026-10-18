import { useCallback, useEffect, useRef, useState } from "react";
import { levelFor } from "./levels";
import { isSquare, legalMovesFor, playTutorialMove } from "./tutorial-engine";
import {
  TUTORIAL_LEVEL_IDS,
  type TutorialLevel,
  type TutorialLevelId,
  type TutorialMoveResult,
  type TutorialState,
  type UseChessTutorialOptions,
  type UseChessTutorialResult,
} from "./types";

function initialStateFor(level: TutorialLevel): TutorialState {
  return {
    level,
    fen: level.initialFen,
    selectedSquare: null,
    legalTargets: [],
    lastMove: null,
    moveCount: 0,
    status: "playing",
    feedback: "idle",
  };
}

function movedState(
  state: TutorialState,
  result: Extract<TutorialMoveResult, { ok: true }>,
): TutorialState {
  return {
    ...state,
    fen: result.nextFen,
    selectedSquare: null,
    legalTargets: [],
    lastMove: result.move,
    moveCount: state.moveCount + 1,
    status: result.completed ? "completed" : "playing",
    feedback: "moved",
  };
}

/**
 * De FEN is de enige bron van waarheid. De pure engine maakt per validatie een
 * tijdelijke Chess-instantie; de hook houdt geen verborgen mutable engine bij.
 */
export function useChessTutorial({
  initialLevelId = TUTORIAL_LEVEL_IDS[0],
  onComplete,
}: UseChessTutorialOptions = {}): UseChessTutorialResult {
  const [state, setState] = useState<TutorialState>(() =>
    initialStateFor(levelFor(initialLevelId)),
  );
  const completedLevelRef = useRef<TutorialLevelId | null>(null);

  const loadLevel = useCallback((levelId: TutorialLevelId) => {
    setState(initialStateFor(levelFor(levelId)));
  }, []);

  const resetLevel = useCallback(() => {
    setState((current) => initialStateFor(current.level));
  }, []);

  useEffect(() => {
    if (state.status !== "completed") {
      completedLevelRef.current = null;
      return;
    }

    if (completedLevelRef.current === state.level.id) {
      return;
    }

    completedLevelRef.current = state.level.id;
    onComplete?.(state.level);
  }, [onComplete, state.level, state.status]);

  const onPieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string | null): boolean => {
      if (!targetSquare || state.status !== "playing") {
        return false;
      }

      const result = playTutorialMove(
        state.level,
        state.fen,
        sourceSquare,
        targetSquare,
        state.moveCount,
      );

      if (!result.ok) {
        setState({
          ...state,
          selectedSquare: null,
          legalTargets: [],
          feedback: "illegal",
        });
        return false;
      }

      setState(movedState(state, result));
      return true;
    },
    [state],
  );

  const onSquareClick = useCallback(
    (square: string) => {
      if (state.status !== "playing" || !isSquare(square)) {
        return;
      }

      if (state.selectedSquare === square) {
        setState({
          ...state,
          selectedSquare: null,
          legalTargets: [],
          feedback: "idle",
        });
        return;
      }

      if (state.selectedSquare && state.legalTargets.includes(square)) {
        const result = playTutorialMove(
          state.level,
          state.fen,
          state.selectedSquare,
          square,
          state.moveCount,
        );

        if (!result.ok) {
          setState({
            ...state,
            selectedSquare: null,
            legalTargets: [],
            feedback: "illegal",
          });
          return;
        }

        setState(movedState(state, result));
        return;
      }

      const legalTargets = legalMovesFor(state.level, state.fen, square);

      setState({
        ...state,
        selectedSquare: legalTargets.length > 0 ? square : null,
        legalTargets,
        feedback: "idle",
      });
    },
    [state],
  );

  const getLegalMoves = useCallback(
    (square: string) => legalMovesFor(state.level, state.fen, square),
    [state.level, state.fen],
  );

  return {
    level: state.level,
    fen: state.fen,
    selectedSquare: state.selectedSquare,
    legalTargets: state.legalTargets,
    lastMove: state.lastMove,
    moveCount: state.moveCount,
    status: state.status,
    feedback: state.feedback,
    loadLevel,
    resetLevel,
    onPieceDrop,
    onSquareClick,
    getLegalMoves,
  };
}
