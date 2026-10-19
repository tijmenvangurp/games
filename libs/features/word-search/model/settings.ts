import type { WordSearchDifficulty, WordSearchTheme } from "@entities/word-search";

export interface WordSearchSettings {
  theme: WordSearchTheme;
  difficulty: WordSearchDifficulty;
}

export const DEFAULT_WORD_SEARCH_SETTINGS: WordSearchSettings = {
  theme: "tuin",
  difficulty: "makkelijk",
};

export const WORD_SEARCH_THEME_OPTIONS = [
  { value: "tuin", label: "Tuin", hint: "Bloemen en beestjes" },
  { value: "onderwater", label: "Onder water", hint: "Vissen en schelpen" },
  { value: "pokemon", label: "Pokémon", hint: "Generatie 1" },
] as const;

export const WORD_SEARCH_DIFFICULTY_OPTIONS = [
  { value: "makkelijk", label: "Makkelijk", hint: "10 × 10 · 8 woorden" },
  { value: "gemiddeld", label: "Gemiddeld", hint: "12 × 12 · 10 woorden" },
  { value: "moeilijk", label: "Moeilijk", hint: "14 × 14 · 12 woorden" },
] as const;
