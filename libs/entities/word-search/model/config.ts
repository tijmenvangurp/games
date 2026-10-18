import type { WordSearchDifficulty, WordSearchTheme } from "./types";

interface WordSearchConfig {
  size: number;
  wordCount: number;
  allowDiagonal: boolean;
}

export const WORD_SEARCH_CONFIG: Record<WordSearchDifficulty, WordSearchConfig> = {
  makkelijk: { size: 10, wordCount: 8, allowDiagonal: false },
  gemiddeld: { size: 12, wordCount: 10, allowDiagonal: true },
  moeilijk: { size: 14, wordCount: 12, allowDiagonal: true },
};

/**
 * Woorden uit de twee thema's die de app al gebruikt voor "Waar is Wobbel?".
 * Alles is A-Z zonder accenten; de generator zet de letters in de grid om naar
 * hoofdletters. De langste woorden zijn 7 letters en passen dus ook op 10×10.
 */
export const WORD_SEARCH_WORDS: Record<WordSearchTheme, readonly string[]> = {
  tuin: [
    "bloem",
    "boom",
    "gras",
    "tulp",
    "slak",
    "bij",
    "vijver",
    "roos",
    "blad",
    "hark",
    "schop",
    "zon",
    "water",
    "vogel",
    "nest",
    "zaad",
  ],
  onderwater: [
    "vis",
    "krab",
    "zee",
    "boot",
    "zand",
    "koraal",
    "octopus",
    "walvis",
    "water",
    "golf",
    "haai",
    "kwal",
    "schelp",
    "zeester",
    "dolfijn",
    "bubbel",
  ],
};
