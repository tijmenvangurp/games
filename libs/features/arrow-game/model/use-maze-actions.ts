import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  arrowDirection,
  type MazeArrow,
  type MazeDirection,
  type MazeLevel,
} from "@entities/arrow";
import { playHaptic, playSound } from "@shared/lib";
import { useArrowsStore, type ArrowsTapResult } from "./use-arrow-store";

export interface FlyingArrow {
  arrow: MazeArrow;
  direction: MazeDirection;
  key: number;
}

function feedbackForTap(
  result: ArrowsTapResult,
  arrow: MazeArrow | undefined,
  setFlying: Dispatch<SetStateAction<FlyingArrow | null>>,
  setBlockedId: Dispatch<SetStateAction<number | null>>,
): void {
  if (result === "blocked") {
    setBlockedId(arrow?.id ?? null);
    playHaptic("tap");
    return;
  }
  if ((result === "removed" || result === "won") && arrow) {
    setFlying({ arrow, direction: arrowDirection(arrow), key: Date.now() });
    if (result === "won") {
      playHaptic("win");
    } else {
      playSound("select");
      playHaptic("select");
    }
  }
}

export function useMazeTimers(
  levelId: string,
  hintId: number | null,
  blockedId: number | null,
  setBlockedId: Dispatch<SetStateAction<number | null>>,
  setFlying: Dispatch<SetStateAction<FlyingArrow | null>>,
): void {
  useEffect(() => {
    if (!hintId) {
      return;
    }
    const timer = window.setTimeout(() => useArrowsStore.getState().clearHint(), 2400);
    return () => window.clearTimeout(timer);
  }, [hintId]);

  useEffect(() => {
    if (blockedId === null) {
      return;
    }
    const timer = window.setTimeout(() => setBlockedId(null), 320);
    return () => window.clearTimeout(timer);
  }, [blockedId, setBlockedId]);

  useEffect(() => {
    setFlying(null);
    setBlockedId(null);
  }, [levelId, setBlockedId, setFlying]);
}

export function useMazeActions(
  level: MazeLevel,
  setFlying: Dispatch<SetStateAction<FlyingArrow | null>>,
  setBlockedId: Dispatch<SetStateAction<number | null>>,
) {
  const handleTap = (id: number) => {
    const arrow = level.arrows.find((candidate) => candidate.id === id);
    const result = useArrowsStore.getState().tap(id);
    feedbackForTap(result, arrow, setFlying, setBlockedId);
  };

  const handleHint = () => {
    if (useArrowsStore.getState().hint() !== null) {
      playSound("hint");
      playHaptic("hint");
    }
  };

  const handleUndo = () => {
    playSound("tap");
    playHaptic("tap");
    useArrowsStore.getState().undo();
    setFlying(null);
    setBlockedId(null);
  };

  const handleRestart = () => {
    playSound("tap");
    playHaptic("tap");
    useArrowsStore.getState().restart();
    setFlying(null);
    setBlockedId(null);
  };

  return { handleTap, handleHint, handleUndo, handleRestart };
}

export function statusTextFor(
  status: "playing" | "won",
  blockedId: number | null,
  hintId: number | null,
): string {
  if (status === "won") {
    return "Alle pijlen zijn weg!";
  }
  if (blockedId !== null) {
    return "Die pijl kan nog niet weg. Kijk welke pijl vrij is.";
  }
  if (hintId !== null) {
    return "De gemarkeerde pijl kan weg.";
  }
  return "Tik op een pijl die vrij kan wegvliegen.";
}
