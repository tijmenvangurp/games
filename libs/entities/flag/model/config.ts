import { FLAG_COUNTRIES } from "./countries";
import {
  FLAG_CONTINENTS,
  type FlagContinent,
  type FlagCountry,
  type FlagDirection,
  type FlagLevel,
  type FlagScope,
} from "./types";

const FLAG_ASSET_ROOT = "/flags";

interface ContinentInfo {
  label: string;
  emoji: string;
}

const CONTINENT_INFO: Record<FlagContinent, ContinentInfo> = {
  europa: { label: "Europa", emoji: "🏰" },
  azie: { label: "Azië", emoji: "🐉" },
  afrika: { label: "Afrika", emoji: "🦁" },
  "noord-amerika": { label: "Noord-Amerika", emoji: "🗽" },
  "zuid-amerika": { label: "Zuid-Amerika", emoji: "🌴" },
  oceanie: { label: "Oceanië", emoji: "🏝️" },
};

function countFor(continent: FlagContinent): number {
  return FLAG_COUNTRIES.filter((country) => country.continent === continent).length;
}

interface ScopeInfo {
  label: string;
  hint: string;
  emoji: string;
}

export const FLAG_SCOPE_INFO: Record<FlagScope, ScopeInfo> = {
  wereld: {
    label: "Hele wereld",
    hint: `Alle ${FLAG_COUNTRIES.length} landen`,
    emoji: "🌍",
  },
  ...Object.fromEntries(
    FLAG_CONTINENTS.map((continent) => [
      continent,
      {
        label: CONTINENT_INFO[continent].label,
        hint: `${countFor(continent)} landen`,
        emoji: CONTINENT_INFO[continent].emoji,
      },
    ]),
  ),
} as Record<FlagScope, ScopeInfo>;

interface LevelInfo {
  label: string;
  hint: string;
  emoji: string;
}

export const FLAG_LEVEL_INFO: Record<FlagLevel, LevelInfo> = {
  makkelijk: { label: "Makkelijk", hint: "3 keuzes uit de hele wereld", emoji: "🌱" },
  gemiddeld: { label: "Gemiddeld", hint: "4 keuzes uit hetzelfde continent", emoji: "🌤️" },
  moeilijk: { label: "Moeilijk", hint: "4 keuzes die op elkaar lijken", emoji: "🔥" },
};

export const FLAG_DIRECTION_PROMPT: Record<FlagDirection, string> = {
  "vlag-naar-land": "Welk land hoort bij deze vlag?",
  "land-naar-vlag": "Welke vlag hoort bij dit land?",
};

/**
 * Vlaggen die op elkaar lijken, zoals de driekleuren van Nederland en
 * Luxemburg of de rood-witte banen van Monaco en Indonesië. Op het hoogste
 * niveau komen deze landen bij voorkeur als afleider langs.
 *
 * Handmatig samengesteld en bewaakt door `tests/node/flags-generator.test.ts`:
 * elke code moet in `FLAG_COUNTRIES` bestaan en niet naar zichzelf verwijzen.
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
};

export function lookalikeCodes(code: string): readonly string[] {
  return FLAG_LOOKALIKES[code] ?? [];
}

/** Every country of a scope, in the generated data order. */
export function countriesFor(scope: FlagScope): readonly FlagCountry[] {
  if (scope === "wereld") {
    return FLAG_COUNTRIES;
  }
  return FLAG_COUNTRIES.filter((country) => country.continent === scope);
}

/** Local flag path. The app never loads a flag from a third-party host. */
export function flagSrc(country: Pick<FlagCountry, "code">): string {
  return `${FLAG_ASSET_ROOT}/${country.code}.svg`;
}

export function continentLabel(continent: FlagContinent): string {
  return CONTINENT_INFO[continent].label;
}
