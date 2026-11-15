import { useMemo } from "react";
import type { Puzzle } from "@entities/murdoku";
import { createMurdokuText, type MurdokuText } from "../lib/text";

/**
 * De Nederlandse tekstlaag van één zaak, één keer opgebouwd. Bord, kaarten en
 * hints delen dezelfde renderer, zodat elke zin uit dezelfde tabel komt.
 */
export function useMurdokuText(puzzle: Puzzle): MurdokuText {
  return useMemo(() => createMurdokuText(puzzle), [puzzle]);
}
