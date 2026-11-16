import type { Puzzle } from "@entities/murdoku";
import { MURDOKU_OBJECT_NAMES } from "./nl";

export interface MurdokuLegendItem {
  /** Objecttype zoals de engine het noemt ("bed", "chair"). */
  type: string;
  /** De Nederlandse naam zoals de legenda hem toont ("Bed"). */
  name: string;
  /** Of een persoon op dit object mag staan. */
  occupiable: boolean;
}

/** De Nederlandse naam van een objecttype, ook als het type onbekend is. */
export function murdokuObjectName(type: string): string {
  return (MURDOKU_OBJECT_NAMES as Record<string, string>)[type] ?? type;
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
    .map(([type, occupiable]) => ({ type, name: murdokuObjectName(type), occupiable }))
    .sort((a, b) => Number(b.occupiable) - Number(a.occupiable) || a.type.localeCompare(b.type));
}

/**
 * De legenda van de eerste versie, voor de uitleg: dezelfde acht objecten als
 * een zaak, ook als er nog geen bord is om ze uit te lezen.
 */
export const MURDOKU_V1_LEGEND: readonly MurdokuLegendItem[] = [
  { type: "bed", name: murdokuObjectName("bed"), occupiable: true },
  { type: "chair", name: murdokuObjectName("chair"), occupiable: true },
  { type: "carpet", name: murdokuObjectName("carpet"), occupiable: true },
  { type: "table", name: murdokuObjectName("table"), occupiable: false },
  { type: "plant", name: murdokuObjectName("plant"), occupiable: false },
  { type: "tv", name: murdokuObjectName("tv"), occupiable: false },
  { type: "shelf", name: murdokuObjectName("shelf"), occupiable: false },
  { type: "box", name: murdokuObjectName("box"), occupiable: false },
];
