import type { Puzzle } from "@entities/murdoku";

export interface MurdokuLegendItem {
  /** Objecttype zoals de engine het noemt ("bed", "chair"). */
  type: string;
  /** Of een persoon op dit object mag staan. */
  occupiable: boolean;
}

/**
 * De objecten die op deze plattegrond staan, met hun bezetbaarheid.
 *
 * De legenda komt uit het bord zelf, zodat hij nooit iets belooft wat niet op de
 * plattegrond staat. De volgorde is stabiel: eerst de bezetbare objecten, daarna
 * de blokkerende, beide op type.
 */
export function murdokuLegend(puzzle: Puzzle): MurdokuLegendItem[] {
  const types = new Map<string, boolean>();

  for (const tile of puzzle.board.tiles) {
    for (const object of tile.objects()) {
      types.set(object.type, (types.get(object.type) ?? false) || object.occupiable);
    }
  }

  return [...types]
    .map(([type, occupiable]) => ({ type, occupiable }))
    .sort((a, b) => Number(b.occupiable) - Number(a.occupiable) || a.type.localeCompare(b.type));
}
