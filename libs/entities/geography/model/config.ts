import { COUNTRIES } from "./countries";
import { PROVINCES } from "./provinces";
import {
  CONTINENTS,
  type Continent,
  type FlagDirection,
  type FlagLevel,
  type FlagScope,
  type FlagSubject,
  type Region,
} from "./types";

const FLAG_ASSET_ROOT = "/flags";

interface RegionInfo {
  label: string;
}

const REGION_INFO: Record<Region, RegionInfo> = {
  europa: { label: "Europa" },
  azie: { label: "Azië" },
  afrika: { label: "Afrika" },
  "noord-amerika": { label: "Noord-Amerika" },
  "zuid-amerika": { label: "Zuid-Amerika" },
  oceanie: { label: "Oceanië" },
  nederland: { label: "Nederland" },
};

function countFor(continent: Continent): number {
  return COUNTRIES.filter((country) => country.region === continent).length;
}

interface ScopeInfo {
  label: string;
  hint: string;
}

/**
 * The areas to choose from. "wereld" is every country; a continent is its
 * countries; "nederland" is the twelve provinces.
 */
export const FLAG_SCOPE_INFO: Record<FlagScope, ScopeInfo> = {
  wereld: {
    label: "Hele wereld",
    hint: `Alle ${COUNTRIES.length} landen`,
  },
  ...Object.fromEntries(
    CONTINENTS.map((continent) => [
      continent,
      {
        label: REGION_INFO[continent].label,
        hint: `${countFor(continent)} landen`,
      },
    ]),
  ),
  nederland: {
    label: "Nederland",
    hint: `${PROVINCES.length} provincies`,
  },
} as Record<FlagScope, ScopeInfo>;

interface LevelInfo {
  label: string;
  hint: string;
}

export const FLAG_LEVEL_INFO: Record<FlagLevel, LevelInfo> = {
  makkelijk: { label: "Makkelijk", hint: "3 keuzes" },
  gemiddeld: { label: "Gemiddeld", hint: "4 keuzes" },
  moeilijk: { label: "Moeilijk", hint: "4 keuzes die op elkaar lijken" },
};

/**
 * The question for a direction, in the words that fit the scope: a country
 * scope asks for a country, the province scope asks for a province.
 */
export function directionPrompt(direction: FlagDirection, scope: FlagScope): string {
  const provinces = scope === "nederland";

  if (direction === "vlag-naar-land") {
    return provinces ? "Welke provincie hoort bij deze vlag?" : "Welk land hoort bij deze vlag?";
  }

  return provinces ? "Welke vlag hoort bij deze provincie?" : "Welke vlag hoort bij dit land?";
}

/**
 * Flags that look alike, such as the tricolours of the Netherlands and
 * Luxembourg, or the banded flags of Noord-Holland, Gelderland and Overijssel.
 * On the hardest level these countries and provinces come up as distractors
 * first.
 *
 * Built by hand and guarded by `tests/node/flags-generator.test.ts`: every code
 * must exist in `COUNTRIES` or `PROVINCES` and must not point at itself.
 */
export const FLAG_LOOKALIKES: Readonly<Record<string, readonly string[]>> = {
  id: ["mc", "sg", "pl"],
  mc: ["id", "pl"],
  nl: ["lu"],
  lu: ["nl"],
  no: ["is", "dk", "se", "fi"],
  is: ["no"],
  dk: ["se", "no"],
  se: ["dk", "no", "fi"],
  fi: ["se", "no", "is"],
  td: ["ro", "ml", "ie"],
  ro: ["td", "ml"],
  ie: ["ci", "it", "in"],
  ci: ["ie", "ml"],
  it: ["ie", "mx"],
  mx: ["it", "sv"],
  gt: ["sv", "hn", "ni"],
  sv: ["ni", "hn", "gt"],
  hn: ["sv", "ni", "gt"],
  ni: ["sv", "hn", "gt"],
  ae: ["jo", "ps", "kw"],
  jo: ["ae", "ps"],
  ps: ["jo", "ae"],
  qa: ["bh"],
  bh: ["qa"],
  in: ["ne", "ie", "ci"],
  ne: ["in", "ie"],
  tr: ["tn"],
  tn: ["tr", "ly"],
  ly: ["tn", "sd"],
  sd: ["ly", "ps"],
  nz: ["au"],
  au: ["nz"],
  de: ["be", "nl"],
  be: ["de", "nl"],
  at: ["lv", "pl"],
  lv: ["at", "pl"],
  pl: ["id", "mc", "lv"],
  ru: ["si", "sk"],
  si: ["sk", "ru"],
  sk: ["si", "ru"],
  hr: ["si", "sk"],
  eg: ["ye", "sy", "iq"],
  ye: ["eg", "sy"],
  sy: ["eg", "ye", "iq"],
  iq: ["eg", "sy", "ye"],
  co: ["ec", "ve"],
  ec: ["co", "ve"],
  ve: ["co", "ec"],
  // Dutch provinces with horizontal bands: yellow/red/blue (Noord-Holland),
  // blue/yellow/blue (Gelderland) and red/yellow with a blue wave (Overijssel).
  "nl-nh": ["nl-ge", "nl-ov"],
  "nl-ge": ["nl-nh", "nl-ov"],
  "nl-ov": ["nl-nh", "nl-ge"],
  // Red lions on a light field: Limburg, Zuid-Holland and Zeeland.
  "nl-li": ["nl-zh", "nl-ze"],
  "nl-zh": ["nl-li", "nl-ze"],
  "nl-ze": ["nl-li", "nl-zh", "nl-fr"],
  // Blue with white and red: Friesland's diagonal stripes against Zeeland.
  "nl-fr": ["nl-ze"],
  // White with red: Drenthe's bands against Utrecht's cross.
  "nl-dr": ["nl-ut"],
  "nl-ut": ["nl-dr"],
  // The two busiest white flags: Groningen's cross against Noord-Brabant.
  "nl-gr": ["nl-nb"],
  "nl-nb": ["nl-gr"],
};

export function lookalikeCodes(code: string): readonly string[] {
  return FLAG_LOOKALIKES[code] ?? [];
}

/** Every subject of a scope, in the generated data order. */
export function subjectsFor(scope: FlagScope): readonly FlagSubject[] {
  if (scope === "wereld") {
    return COUNTRIES;
  }
  if (scope === "nederland") {
    return PROVINCES;
  }
  return COUNTRIES.filter((country) => country.region === scope);
}

/** Local flag path. The app never loads a flag from a third-party host. */
export function flagSrc(subject: Pick<FlagSubject, "code">): string {
  return `${FLAG_ASSET_ROOT}/${subject.code}.svg`;
}

/** "Europa", "Afrika" or "Nederland". */
export function regionLabel(region: Region): string {
  return REGION_INFO[region].label;
}

/** The level hint, which changes when a scope has few enough subjects. */
export function levelHint(level: FlagLevel, scope: FlagScope): string {
  if (level === "moeilijk" && scope === "nederland") {
    return `Alle ${PROVINCES.length} provincies`;
  }

  return FLAG_LEVEL_INFO[level].hint;
}
