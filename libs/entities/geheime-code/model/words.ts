import { currentLanguage, type Language } from "@shared/i18n";
import type { LevelId, ThemeId, WordSet } from "./types";
import { ENGLISH_WORD_SETS } from "./words-en";

/**
 * Twee gecureerde rondes per thema en niveau. De letters van een set blijven
 * binnen 12 symbolen op niveau 1 en binnen 14 op niveau 2 en 3; de test bewaakt
 * dat. De woordkeuze is met de hand gedaan, omdat een letterzuinige generator
 * de thematische woorden zou laten vallen.
 */
export const WORD_SETS: readonly WordSet[] = [
  {
    id: "sinterklaas-1-1",
    theme: "sinterklaas",
    level: 1,
    round: 1,
    words: ["sint", "piet", "boot", "staf"],
  },
  {
    id: "sinterklaas-1-2",
    theme: "sinterklaas",
    level: 1,
    round: 2,
    words: ["zak", "boek", "ster", "hart"],
  },
  {
    id: "sinterklaas-2-1",
    theme: "sinterklaas",
    level: 2,
    round: 1,
    words: ["pakje", "fiets", "snoep", "boot", "sint", "staf"],
  },
  {
    id: "sinterklaas-2-2",
    theme: "sinterklaas",
    level: 2,
    round: 2,
    words: ["baard", "schoen", "snoep", "sint", "boek", "boot"],
  },
  {
    id: "sinterklaas-3-1",
    theme: "sinterklaas",
    level: 3,
    round: 1,
    words: ["pakje", "fiets", "snoep", "schoen", "sint", "boot"],
  },
  {
    id: "sinterklaas-3-2",
    theme: "sinterklaas",
    level: 3,
    round: 2,
    words: ["mijter", "snoep", "sint", "boek", "boot", "staf"],
  },
  {
    id: "tuin-1-1",
    theme: "tuin",
    level: 1,
    round: 1,
    words: ["bij", "roos", "tulp", "slak"],
  },
  {
    id: "tuin-1-2",
    theme: "tuin",
    level: 1,
    round: 2,
    words: ["boom", "gras", "blad", "hark"],
  },
  {
    id: "tuin-2-1",
    theme: "tuin",
    level: 2,
    round: 1,
    words: ["bloem", "boom", "gras", "slak", "roos", "hark"],
  },
  {
    id: "tuin-2-2",
    theme: "tuin",
    level: 2,
    round: 2,
    words: ["boom", "gras", "slak", "roos", "hark", "nest"],
  },
  {
    id: "tuin-3-1",
    theme: "tuin",
    level: 3,
    round: 1,
    words: ["bloem", "vijver", "blad", "roos", "nest"],
  },
  {
    id: "tuin-3-2",
    theme: "tuin",
    level: 3,
    round: 2,
    words: ["water", "vogel", "nest", "zon", "roos", "blad"],
  },
  {
    id: "onderwater-1-1",
    theme: "onderwater",
    level: 1,
    round: 1,
    words: ["vis", "krab", "zee", "boot"],
  },
  {
    id: "onderwater-1-2",
    theme: "onderwater",
    level: 1,
    round: 2,
    words: ["zand", "golf", "diep", "haai"],
  },
  {
    id: "onderwater-2-1",
    theme: "onderwater",
    level: 2,
    round: 1,
    words: ["vis", "krab", "boot", "koraal", "walvis", "alg"],
  },
  {
    id: "onderwater-2-2",
    theme: "onderwater",
    level: 2,
    round: 2,
    words: ["zee", "zand", "walvis", "alg", "diep", "haai"],
  },
  {
    id: "onderwater-3-1",
    theme: "onderwater",
    level: 3,
    round: 1,
    words: ["vis", "krab", "boot", "koraal", "walvis", "alg"],
  },
  {
    id: "onderwater-3-2",
    theme: "onderwater",
    level: 3,
    round: 2,
    words: ["zee", "zand", "walvis", "alg", "diep", "haai"],
  },
];

const SETS_BY_LANGUAGE: Readonly<Record<Language, readonly WordSet[]>> = {
  nl: WORD_SETS,
  en: ENGLISH_WORD_SETS,
};

/** De woordensets van de actieve taal. */
function activeSets(): readonly WordSet[] {
  return SETS_BY_LANGUAGE[currentLanguage()];
}

export function setsFor(theme: ThemeId, level: LevelId): readonly WordSet[] {
  return activeSets().filter((set) => set.theme === theme && set.level === level);
}

export function setFor(theme: ThemeId, level: LevelId, round: 1 | 2): WordSet | undefined {
  return activeSets().find(
    (set) => set.theme === theme && set.level === level && set.round === round,
  );
}
