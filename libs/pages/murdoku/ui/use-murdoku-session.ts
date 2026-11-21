import { useMemo } from "react";
import {
  MURDOKU_CASE_TEXTS,
  loadMurdokuLevel,
  murdokuCaseById,
  type Cell,
  type LevelJson,
  type MurdokuCase,
  type MurdokuLoot,
  type PersonId,
  type Puzzle,
} from "@entities/murdoku";
import {
  MURDOKU_INTRO_LEVEL,
  MURDOKU_INTRO_LOOT,
  MURDOKU_INTRO_SOLUTION,
  MURDOKU_INTRO_TEXTS,
  createMurdokuText,
  type MurdokuPlayState,
  type MurdokuText,
} from "@features/murdoku-game";
import { useLanguage } from "@shared/i18n";

interface MurdokuSession {
  /** De gekozen eigen zaak, of `null` voor de handgemaakte instapzaak. */
  activeCase: MurdokuCase | null;
  puzzle: Puzzle;
  text: MurdokuText;
  solution: ReadonlyMap<PersonId, Cell>;
  title: string;
  intro: string;
  loot: MurdokuLoot;
}

/**
 * Het level met de buitnaam in de gekozen taal. De engine noemt de buit bij de
 * naam van de interne victim; zo zeggen het bord en de afloopzin "the cake".
 */
function withLootName(level: LevelJson, name: string): LevelJson {
  return { ...level, victim: { ...level.victim, name } };
}

/**
 * De zaak die de speelpagina nu toont. De zaakkeuze start een eigen zaak in
 * dezelfde store; zonder keuze blijft de handgemaakte instapzaak staan. Titel,
 * intro en buitnaam volgen de gekozen taal.
 */
export function useMurdokuSession(storedPlay: MurdokuPlayState | null): MurdokuSession {
  const language = useLanguage();
  const activeCase = storedPlay ? murdokuCaseById(storedPlay.levelId) : null;
  const words = activeCase
    ? MURDOKU_CASE_TEXTS[language][activeCase.id]
    : MURDOKU_INTRO_TEXTS[language];
  const puzzle = useMemo(
    () => loadMurdokuLevel(withLootName(activeCase?.level ?? MURDOKU_INTRO_LEVEL, words.loot)),
    [activeCase, words.loot],
  );
  const text = useMemo(() => createMurdokuText(puzzle, language), [puzzle, language]);
  const solution = useMemo(
    () =>
      activeCase
        ? new Map<PersonId, Cell>(Object.entries(activeCase.solution))
        : MURDOKU_INTRO_SOLUTION,
    [activeCase],
  );
  const loot = { name: words.loot, icon: activeCase?.loot.icon ?? MURDOKU_INTRO_LOOT.icon };

  return { activeCase, puzzle, text, solution, title: words.title, intro: words.intro, loot };
}
