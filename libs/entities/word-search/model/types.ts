export const WORD_SEARCH_THEMES = ["tuin", "onderwater"] as const;

export type WordSearchTheme = (typeof WORD_SEARCH_THEMES)[number];

export const WORD_SEARCH_DIFFICULTIES = ["makkelijk", "gemiddeld", "moeilijk"] as const;

export type WordSearchDifficulty = (typeof WORD_SEARCH_DIFFICULTIES)[number];

export interface Cell {
  row: number;
  col: number;
}

export interface WordSearchPlacement {
  word: string;
  cells: readonly Cell[];
}

export interface WordSearchPuzzle {
  theme: WordSearchTheme;
  difficulty: WordSearchDifficulty;
  size: number;
  grid: readonly (readonly string[])[];
  placements: readonly WordSearchPlacement[];
}
