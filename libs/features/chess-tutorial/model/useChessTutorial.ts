import { useCallback, useEffect, useRef, useState } from "react";
import { isChessSquare, pieceColorAt, playHaptic, selectionAfterClick } from "@shared/lib";
import { levelFor } from "./levels";
import { hintFor, legalMovesFor, playTutorialMove, previewFor } from "./tutorial-engine";
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
    hintMove: null,
    preview: previewFor(level, level.initialFen),
    moveCount: 0,
    status: "playing",
    feedback: "idle",
  };
}

function movedState(
  state: TutorialState,
  result: Extract<TutorialMoveResult, { ok: true }>,
): TutorialState {
  const preview = result.completed || result.stuck ? null : previewFor(state.level, result.nextFen);

  return {
    ...state,
    fen: result.nextFen,
    selectedSquare: null,
    legalTargets: [],
    lastMove: result.move,
    hintMove: null,
    preview,
    moveCount: state.moveCount + 1,
    status: result.completed ? "completed" : result.stuck ? "stuck" : "playing",
    feedback: "moved",
  };
}

/**
 * Na een mislukte poging blijft het lesstuk geselecteerd, zodat de groene
 * stippen meteen zichtbaar zijn. De coach verwijst dan niet naar iets wat het
 * kind niet kan zien.
 */
function illegalState(state: TutorialState, from: string): TutorialState {
  const legalTargets = legalMovesFor(state.fen, from);
  const selectedSquare = isChessSquare(from) ? from : null;

  if (legalTargets.length > 0) {
    return {
      ...state,
      selectedSquare,
      legalTargets,
      hintMove: null,
      preview: null,
      feedback: "illegal",
    };
  }

  // Een verkeerd stuk of een leeg veld: wijs alsnog het lesstuk en één
  // haalbare zet aan, zodat de coachboodschap klopt met het bord.
  const hintMove = hintFor(state.level, state.fen);

  return {
    ...state,
    selectedSquare: hintMove?.from ?? null,
    legalTargets: hintMove ? [hintMove.to] : [],
    hintMove,
    preview: null,
    feedback: "illegal",
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
    playHaptic("tap");
    setState(initialStateFor(levelFor(levelId)));
  }, []);

  const resetLevel = useCallback(() => {
    playHaptic("tap");
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

  const attemptMove = useCallback(
    (from: string, to: string): boolean => {
      const result = playTutorialMove(state.level, state.fen, from, to, state.moveCount);

      if (!result.ok) {
        playHaptic("tap");
        setState(illegalState(state, from));
        return false;
      }

      playHaptic(result.completed ? "win" : "select");
      setState(movedState(state, result));
      return true;
    },
    [state],
  );

  const onPieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string | null): boolean => {
      if (!targetSquare || state.status !== "playing") {
        return false;
      }

      return attemptMove(sourceSquare, targetSquare);
    },
    [attemptMove, state.status],
  );

  const onSquareClick = useCallback(
    (square: string) => {
      if (state.status !== "playing") {
        return;
      }

      playHaptic("tap");

      const selection = selectionAfterClick(
        {
          selectedSquare: state.selectedSquare,
          legalTargets: state.legalTargets,
        },
        square,
        (candidate) => legalMovesFor(state.fen, candidate),
      );

      // Elke tik selecteert alleen, ook bij een zwart stuk. Een zet volgt pas
      // na slepen en neerzetten, nooit na één tik. Een actieve kijk-preview
      // blijft staan als de tik niets selecteert.
      setState({
        ...state,
        ...selection,
        hintMove: null,
        preview: selection.selectedSquare ? null : state.preview,
        feedback: "idle",
      });
    },
    [state],
  );

  const getLegalMoves = useCallback(
    (square: string) => legalMovesFor(state.fen, square),
    [state.fen],
  );

  const showHint = useCallback(() => {
    if (state.status !== "playing") {
      return;
    }

    const hintMove = hintFor(state.level, state.fen);
    if (!hintMove) {
      return;
    }

    playHaptic("hint");
    setState({
      ...state,
      selectedSquare: hintMove.from,
      legalTargets: [hintMove.to],
      hintMove,
      preview: null,
      feedback: "hint",
    });
  }, [state]);

  const togglePreview = useCallback(() => {
    if (state.status !== "playing") {
      return;
    }

    playHaptic("tap");

    if (state.preview) {
      setState({
        ...state,
        preview: null,
        selectedSquare: null,
        legalTargets: [],
        hintMove: null,
        feedback: state.feedback,
      });
      return;
    }

    const preview = previewFor(state.level, state.fen);
    if (!preview) {
      return;
    }

    setState({
      ...state,
      preview,
      selectedSquare: null,
      legalTargets: [],
      hintMove: null,
      feedback: "idle",
    });
  }, [state]);

  return {
    level: state.level,
    fen: state.fen,
    selectedSquare: state.selectedSquare,
    selectedColor: state.selectedSquare
      ? pieceColorAt(state.fen, state.selectedSquare, { skipValidation: true })
      : null,
    legalTargets: state.legalTargets,
    lastMove: state.lastMove,
    hintMove: state.hintMove,
    preview: state.preview,
    moveCount: state.moveCount,
    status: state.status,
    feedback: state.feedback,
    loadLevel,
    resetLevel,
    showHint,
    togglePreview,
    onPieceDrop,
    onSquareClick,
    getLegalMoves,
  };
}
