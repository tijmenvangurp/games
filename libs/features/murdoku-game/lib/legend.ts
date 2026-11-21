import type { Puzzle } from "@entities/murdoku";
import type { Language } from "@shared/i18n";
import { MURDOKU_OBJECT_NAMES_EN } from "./en";
import { MURDOKU_OBJECT_NAMES } from "./nl";

/** De objectnamen per taal; dezelfde namen als in de aanwijzingen. */
const OBJECT_NAMES: Readonly<Record<Language, Readonly<Record<string, string>>>> = {
  nl: MURDOKU_OBJECT_NAMES,
  en: MURDOKU_OBJECT_NAMES_EN,
};

export interface MurdokuLegendItem {
  /** Objecttype zoals de engine het noemt ("bed", "chair"). */
  type: string;
  /** De naam zoals de legenda hem toont ("Bed"), in de gekozen taal. */
  name: string;
  /** Of een persoon op dit object mag staan. */
  occupiable: boolean;
}

/** De naam van een objecttype in de gekozen taal, ook als het type onbekend is. */
export function murdokuObjectName(type: string, language: Language): string {
  return OBJECT_NAMES[language][type] ?? type;
}

/**
 * De objecten die op deze plattegrond staan, met hun bezetbaarheid.
 *
 * De legenda komt uit het bord zelf, zodat hij nooit iets belooft wat niet op de
 * plattegrond staat. De volgorde is stabiel: eerst de bezetbare objecten, daarna
 * de blokkerende, beide op type.
 */
export function murdokuLegend(puzzle: Puzzle, language: Language): MurdokuLegendItem[] {
  const types = new Map<string, boolean>();

  for (const tile of puzzle.board.tiles) {
    for (const object of tile.objects()) {
      types.set(object.type, (types.get(object.type) ?? false) || object.occupiable);
    }
  }

  return [...types]
    .map(([type, occupiable]) => ({ type, name: murdokuObjectName(type, language), occupiable }))
    .sort((a, b) => Number(b.occupiable) - Number(a.occupiable) || a.type.localeCompare(b.type));
}

/** De acht objecten van de eerste versie, met hun bezetbaarheid. */
const V1_OBJECTS: readonly (readonly [string, boolean])[] = [
  ["bed", true],
  ["chair", true],
  ["carpet", true],
  ["table", false],
  ["plant", false],
  ["tv", false],
  ["shelf", false],
  ["box", false],
];

/**
 * De legenda van de eerste versie, voor de uitleg: dezelfde acht objecten als
 * een zaak, ook als er nog geen bord is om ze uit te lezen.
 */
export function murdokuV1Legend(language: Language): MurdokuLegendItem[] {
  return V1_OBJECTS.map(([type, occupiable]) => ({
    type,
    name: murdokuObjectName(type, language),
    occupiable,
  }));
}
