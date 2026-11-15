import { useCallback, useState } from "react";
import { loadSolvedPuzzleIds, saveSolvedPuzzleIds } from "./storage";

export interface UsePuzzleProgressResult {
  readonly solved: ReadonlySet<string>;
  readonly markSolved: (puzzleId: string) => void;
}

/**
 * Bewaart alleen de ID's van opgeloste puzzels, lokaal op dit apparaat.
 * Er is geen account, sync of extern verkeer.
 */
export function usePuzzleProgress(): UsePuzzleProgressResult {
  const [solved, setSolved] = useState<ReadonlySet<string>>(() => loadSolvedPuzzleIds());

  const markSolved = useCallback((puzzleId: string) => {
    setSolved((current) => {
      if (current.has(puzzleId)) {
        return current;
      }

      const next = new Set(current);
      next.add(puzzleId);
      saveSolvedPuzzleIds(next);
      return next;
    });
  }, []);

  return { solved, markSolved };
}
