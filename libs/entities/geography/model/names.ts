import { currentLanguage, type Language } from "@shared/i18n";
import { COUNTRIES } from "./countries";
import {
  ENGLISH_CAPITALS,
  ENGLISH_COUNTRY_NAME_OVERRIDES,
  ENGLISH_NAMES_WITH_ARTICLE,
} from "./names-en";
import { PROVINCES } from "./provinces";
import type { FlagSubject } from "./types";

type NameTable = ReadonlyMap<string, string>;

/** Genoeg van een land of provincie om de naam op te zoeken; de Nederlandse naam is de terugval. */
type SubjectRef = Pick<FlagSubject, "code" | "name">;

const REGION_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

function englishCountryName(code: string): string {
  return ENGLISH_COUNTRY_NAME_OVERRIDES[code] ?? String(REGION_NAMES.of(code.toUpperCase()));
}

// Provincienamen zijn eigennamen: in het Engels blijven ze Nederlands.
const ENGLISH_NAMES: NameTable = new Map([
  ...COUNTRIES.map((country) => [country.code, englishCountryName(country.code)] as const),
  ...PROVINCES.map((province) => [province.code, province.name] as const),
]);

const NAMES: Readonly<Record<Language, NameTable>> = {
  nl: new Map([...COUNTRIES, ...PROVINCES].map((subject) => [subject.code, subject.name])),
  en: ENGLISH_NAMES,
};

const SENTENCE_NAMES: Readonly<Record<Language, NameTable>> = {
  nl: NAMES.nl,
  en: new Map(
    [...ENGLISH_NAMES].map(([code, name]) => [
      code,
      ENGLISH_NAMES_WITH_ARTICLE.has(code) ? `the ${name}` : name,
    ]),
  ),
};

const CAPITALS: Readonly<Record<Language, NameTable>> = {
  nl: new Map([...COUNTRIES, ...PROVINCES].map((subject) => [subject.code, subject.capital])),
  // Ook de hoofdsteden van provincies zijn eigennamen.
  en: new Map([
    ...Object.entries(ENGLISH_CAPITALS),
    ...PROVINCES.map((province) => [province.code, province.capital] as const),
  ]),
};

/** De naam van een land of provincie in de gekozen taal, zoals op een antwoordknop. */
export function subjectName(subject: SubjectRef, language: Language = currentLanguage()): string {
  return NAMES[language].get(subject.code) ?? subject.name;
}

/** De naam midden in een zin: in het Engels met "the" waar dat hoort ("the Netherlands"). */
export function subjectNameInSentence(
  subject: SubjectRef,
  language: Language = currentLanguage(),
): string {
  return SENTENCE_NAMES[language].get(subject.code) ?? subject.name;
}

/** De hoofdstad (of hoofdsteden, met komma's) in de gekozen taal. */
export function subjectCapital(
  subject: Pick<FlagSubject, "code" | "capital">,
  language: Language = currentLanguage(),
): string {
  return CAPITALS[language].get(subject.code) ?? subject.capital;
}
