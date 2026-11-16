import { useMemo } from "react";
import {
  loadMurdokuLevel,
  murdokuCaseById,
  type Cell,
  type MurdokuCase,
  type PersonId,
  type Puzzle,
} from "@entities/murdoku";
import {
  MURDOKU_INTRO_LEVEL,
  MURDOKU_INTRO_SOLUTION,
  createMurdokuText,
  type MurdokuPlayState,
  type MurdokuText,
} from "@features/murdoku-game";

interface MurdokuSession {
  /** De gekozen eigen zaak, of `null` voor de handgemaakte instapzaak. */
  activeCase: MurdokuCase | null;
  puzzle: Puzzle;
  text: MurdokuText;
  solution: ReadonlyMap<PersonId, Cell>;
  title: string;
}

/**
 * De zaak die de speelpagina nu toont. De zaakkeuze start een eigen zaak in
 * dezelfde store; zonder keuze blijft de handgemaakte instapzaak staan.
 */
export function useMurdokuSession(storedPlay: MurdokuPlayState | null): MurdokuSession {
  const activeCase = storedPlay ? murdokuCaseById(storedPlay.levelId) : null;
  const puzzle = useMemo(
    () => loadMurdokuLevel(activeCase?.level ?? MURDOKU_INTRO_LEVEL),
    [activeCase],
  );
  const text = useMemo(() => createMurdokuText(puzzle), [puzzle]);
  const solution = useMemo(
    () =>
      activeCase
        ? new Map<PersonId, Cell>(Object.entries(activeCase.solution))
        : MURDOKU_INTRO_SOLUTION,
    [activeCase],
  );
  const title = activeCase?.title ?? MURDOKU_INTRO_LEVEL.title ?? "de zaak";

  return { activeCase, puzzle, text, solution, title };
}
