import type { Language } from "@shared/i18n";

/**
 * Korte Nederlandse woorden die alleen uit basisrij-letters bestaan
 * (a s d f g h j k l). Zonder `;`, want die komt alleen in oefenreeksen voor.
 */
export const WORDS: readonly string[] = [
  "als",
  "dag",
  "dak",
  "gas",
  "gaf",
  "had",
  "hal",
  "hak",
  "jas",
  "kas",
  "lag",
  "sla",
  "kaas",
  "haas",
  "haal",
  "laag",
  "daad",
  "gaaf",
  "slak",
  "glas",
  "glad",
  "klas",
  "half",
  "hals",
  "slag",
  "klad",
  "salsa",
  "sjaal",
];

/** Engelse oefenwoorden met dezelfde regels: alleen basisrij-letters, drie tot vijf lang. */
const ENGLISH_WORDS: readonly string[] = [
  "add",
  "ash",
  "ask",
  "dad",
  "gas",
  "had",
  "has",
  "lad",
  "sad",
  "all",
  "hall",
  "fall",
  "glad",
  "flag",
  "dash",
  "half",
  "alas",
  "adds",
  "asks",
  "dads",
  "lads",
  "flask",
  "shall",
  "salad",
  "glass",
  "flash",
  "slash",
  "falls",
  "halls",
];

const WORDS_BY_LANGUAGE: Readonly<Record<Language, readonly string[]>> = {
  nl: WORDS,
  en: ENGLISH_WORDS,
};

/** De oefenwoorden in de gekozen taal. */
export function wordsFor(language: Language): readonly string[] {
  return WORDS_BY_LANGUAGE[language];
}
