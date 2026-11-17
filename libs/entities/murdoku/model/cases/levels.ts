import type { MurdokuCase } from "./types";
import { MURDOKU_CASES } from "./cases";

/** Het aantal aanwijzingen van een zaak, inclusief de bordbrede aanwijzingen. */
export function murdokuClueCount(entry: MurdokuCase): number {
  const perPerson = entry.level.suspects.reduce(
    (count, suspect) => count + (suspect.clues?.length ?? 0),
    0,
  );
  return perPerson + (entry.level.globalClues?.length ?? 0) + (entry.level.boardClues?.length ?? 0);
}

/** De aanwijzingsdichtheid: het aantal aanwijzingen per vakje van het bord. */
function murdokuClueDensity(entry: MurdokuCase): number {
  const cells = entry.level.size.width * entry.level.size.height;
  return cells === 0 ? 0 : murdokuClueCount(entry) / cells;
}

/**
 * De geordende niveauladder van Wie was het?.
 *
 * Eén zaak is één ronde. De volgorde is de moeilijkheidsas: eerst de
 * bordgrootte, daarna de aanwijzingsdichtheid. Bij een gelijke dichtheid houdt
 * de zaak zijn plaats in de vaste lijst, zodat de volgorde deterministisch is.
 */
export const MURDOKU_LADDER: readonly MurdokuCase[] = [...MURDOKU_CASES]
  .map((entry, index) => ({ entry, index }))
  .sort((left, right) => {
    const leftCells = left.entry.level.size.width * left.entry.level.size.height;
    const rightCells = right.entry.level.size.width * right.entry.level.size.height;
    if (leftCells !== rightCells) {
      return leftCells - rightCells;
    }
    const density = murdokuClueDensity(left.entry) - murdokuClueDensity(right.entry);
    return density !== 0 ? density : left.index - right.index;
  })
  .map(({ entry }) => entry);
