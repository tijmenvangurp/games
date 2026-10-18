import { useEffect, useRef, useState } from "react";
import { completedUnits, filledCount, type CompletedUnit, type PlayState } from "@entities/sudoku";
import { playSound, vibrate } from "@shared/lib";

const CELEBRATION_MS = 1800;

function unitKey(unit: CompletedUnit): string {
  return `${unit.kind}-${unit.index}`;
}

function unitLabel(unit: CompletedUnit): string {
  return unit.kind === "row" ? `Rij ${unit.index + 1}` : `Blok ${unit.index + 1}`;
}

function completedKeys(play: PlayState): Set<string> {
  return new Set(completedUnits(play.puzzle, play.entries).map(unitKey));
}

function shouldInitialize(
  before: { puzzle: PlayState["puzzle"]; entries: readonly number[] } | null,
  play: PlayState,
): boolean {
  return (
    !before ||
    before.puzzle !== play.puzzle ||
    before.entries === play.entries ||
    play.entries.every((value) => value === 0)
  );
}

function freshUnits(play: PlayState, celebrated: ReadonlySet<string>): CompletedUnit[] {
  return completedUnits(play.puzzle, play.entries).filter((unit) => !celebrated.has(unitKey(unit)));
}

function celebrationMessage(units: readonly CompletedUnit[]): string {
  const labels = units.map(unitLabel);
  return labels.length === 1 ? `${labels[0]} klaar!` : `${labels.join(" en ")} klaar!`;
}

function halfDone(play: PlayState): boolean {
  const playable = play.entries.length - play.puzzle.givens.filter((value) => value !== 0).length;
  return filledCount(play.entries) * 2 >= playable;
}

function announce(message: string, setMessage: (message: string) => void): void {
  setMessage(message);
  playSound("match");
  vibrate(15);
}

function celebrate(units: readonly CompletedUnit[], setMessage: (message: string) => void): void {
  announce(celebrationMessage(units), setMessage);
}

function halfwayMessage(play: PlayState, celebrated: boolean): string | null {
  if (play.solved || celebrated || !halfDone(play)) {
    return null;
  }
  return "Halverwege!";
}

/**
 * Shows a short message when a row or box is completed for the first time.
 * Units that were already complete when the puzzle loaded are not celebrated.
 */
export function useSudokuCelebration(play: PlayState | null): string | null {
  const [message, setMessage] = useState<string | null>(null);
  const previous = useRef<{ puzzle: PlayState["puzzle"]; entries: readonly number[] } | null>(null);
  const celebrated = useRef(new Set<string>());
  const celebratedHalfway = useRef(false);

  useEffect(() => {
    if (!play) {
      previous.current = null;
      celebrated.current = new Set();
      celebratedHalfway.current = false;
      return;
    }

    const before = previous.current;
    previous.current = { puzzle: play.puzzle, entries: play.entries };

    if (shouldInitialize(before, play)) {
      celebrated.current = completedKeys(play);
      celebratedHalfway.current = halfDone(play);
      return;
    }

    const fresh = freshUnits(play, celebrated.current);
    if (fresh.length === 0) {
      const halfway = halfwayMessage(play, celebratedHalfway.current);
      if (halfway) {
        celebratedHalfway.current = true;
        announce(halfway, setMessage);
      }
      return;
    }
    for (const unit of fresh) {
      celebrated.current.add(unitKey(unit));
    }
    if (!play.solved) {
      celebrate(fresh, setMessage);
    }
  }, [play]);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = window.setTimeout(() => setMessage(null), CELEBRATION_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  return message;
}
