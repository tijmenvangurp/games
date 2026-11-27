import type { WordSearchDifficulty, WordSearchTheme } from "@entities/word-search";

export interface WordSearchSettings {
  theme: WordSearchTheme;
  difficulty: WordSearchDifficulty;
}

export const DEFAULT_WORD_SEARCH_SETTINGS: WordSearchSettings = {
  theme: "tuin",
  difficulty: "makkelijk",
};
