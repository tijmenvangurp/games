import type { WordSearchDifficulty, WordSearchTheme } from "./types";

export interface WordSearchDirection {
  row: number;
  col: number;
}

interface WordSearchConfig {
  size: number;
  wordCount: number;
}

export const WORD_SEARCH_CONFIG: Record<WordSearchDifficulty, WordSearchConfig> = {
  makkelijk: { size: 10, wordCount: 8 },
  gemiddeld: { size: 12, wordCount: 10 },
  moeilijk: { size: 14, wordCount: 12 },
};

/**
 * Makkelijk leest alleen vooruit: links naar rechts en boven naar beneden.
 * Gemiddeld voegt de twee diagonale richtingen naar beneden toe. Moeilijk zet
 * alle acht richtingen open, inclusief achteruit en omhoog.
 */
export const WORD_SEARCH_DIRECTIONS: Record<WordSearchDifficulty, readonly WordSearchDirection[]> =
  {
    makkelijk: [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ],
    gemiddeld: [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: -1 },
    ],
    moeilijk: [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: -1 },
      { row: 0, col: -1 },
      { row: -1, col: 0 },
      { row: -1, col: -1 },
      { row: -1, col: 1 },
    ],
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
