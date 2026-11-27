import { currentLanguage, type Language } from "@shared/i18n";
import { COUNTRIES } from "./countries";
import { PROVINCES } from "./provinces";
import { geographyTexts } from "./texts";
import type { Continent, FlagDirection, FlagLevel, FlagScope, FlagSubject, Region } from "./types";

const FLAG_ASSET_ROOT = "/flags";

function countFor(continent: Continent): number {
  return COUNTRIES.filter((country) => country.region === continent).length;
}

/**
 * The areas to choose from. "wereld" is every country; a continent is its
 * countries; "nederland" is the twelve provinces.
 */
export function flagScopeLabel(scope: FlagScope, language: Language = currentLanguage()): string {
  return geographyTexts[language].scopes[scope];
}

/** How many subjects a scope offers: "Alle 197 landen", "46 landen" or "12 provincies". */
export function flagScopeHint(scope: FlagScope, language: Language = currentLanguage()): string {
  const texts = geographyTexts[language];
  if (scope === "wereld") {
    return texts.allCountries(COUNTRIES.length);
  }
  if (scope === "nederland") {
    return texts.provinces(PROVINCES.length);
  }
  return texts.countries(countFor(scope));
}

/** How many options the hardest level offers, per scope. */
export const HARD_LEVEL_CHOICES = 12;

export function flagLevelLabel(level: FlagLevel, language: Language = currentLanguage()): string {
  return geographyTexts[language].levels[level];
}

/**
 * The question for a direction, in the words that fit the scope: a country
 * scope asks for a country, the province scope asks for a province.
 */
export function directionPrompt(
  direction: FlagDirection,
  scope: FlagScope,
  language: Language = currentLanguage(),
): string {
  const prompts = geographyTexts[language].prompts[direction];

  return scope === "nederland" ? prompts.provinces : prompts.countries;
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

/** "Europa", "Afrika" or "Nederland", as it reads inside a sentence. */
export function regionLabel(region: Region, language: Language = currentLanguage()): string {
  return geographyTexts[language].regionsInSentence[region];
}

/** The level hint, which changes with the scope and its number of subjects. */
export function levelHint(
  level: FlagLevel,
  scope: FlagScope,
  language: Language = currentLanguage(),
): string {
  const texts = geographyTexts[language];
  if (level !== "moeilijk") {
    return level === "makkelijk" ? texts.easyHint : texts.mediumHint;
  }
  if (scope === "nederland") {
    return texts.allProvinces(PROVINCES.length);
  }

  return scope === "wereld"
    ? texts.worldChoices(HARD_LEVEL_CHOICES)
    : texts.continentChoices(HARD_LEVEL_CHOICES);
}
