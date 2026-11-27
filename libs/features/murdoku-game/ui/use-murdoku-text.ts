import { useMemo } from "react";
import type { Puzzle } from "@entities/murdoku";
import { useLanguage } from "@shared/i18n";
import { createMurdokuText, type MurdokuText } from "../lib/text";

/**
 * De tekstlaag van één zaak in de gekozen taal, één keer opgebouwd. Bord,
 * kaarten en hints delen dezelfde renderer, zodat elke zin uit dezelfde tabel
 * komt. Een andere taal bouwt hem opnieuw op.
 */
export function useMurdokuText(puzzle: Puzzle): MurdokuText {
  const language = useLanguage();
  return useMemo(() => createMurdokuText(puzzle, language), [puzzle, language]);
}
