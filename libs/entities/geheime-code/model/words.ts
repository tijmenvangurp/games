import type { LevelId, ThemeId, WordSet } from "./types";

export const THEME_LABEL: Readonly<Record<ThemeId, string>> = {
  sinterklaas: "Sinterklaas",
  tuin: "Tuin",
  onderwater: "Onder water",
};

export const THEME_DESCRIPTION: Readonly<Record<ThemeId, string>> = {
  sinterklaas: "Pakjes, pepernoten en de boot.",
  tuin: "Bloemen, dieren en de slak.",
  onderwater: "Vissen, koraal en de zee.",
};

export const LEVEL_LABEL: Readonly<Record<LevelId, string>> = {
  1: "Kijk & schrijf",
  2: "Zoek & schrijf",
  3: "Kraak de code",
};

export const LEVEL_DESCRIPTION: Readonly<Record<LevelId, string>> = {
  1: "Vier korte woorden. De code staat open.",
  2: "Zes woorden en meer letters.",
  3: "De volle code, zonder hulp.",
};

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

export function setsFor(theme: ThemeId, level: LevelId): readonly WordSet[] {
  return WORD_SETS.filter((set) => set.theme === theme && set.level === level);
}

export function setFor(theme: ThemeId, level: LevelId, round: 1 | 2): WordSet | undefined {
  return WORD_SETS.find((set) => set.theme === theme && set.level === level && set.round === round);
}
