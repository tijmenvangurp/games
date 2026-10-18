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
  { value: "tuin", label: "Tuin", hint: "Bloemen en beestjes", emoji: "🌷" },
  { value: "onderwater", label: "Onder water", hint: "Vissen en schelpen", emoji: "🐠" },
  { value: "pokemon", label: "Pokémon", hint: "Generatie 1", emoji: "⚡" },
] as const;

export const WORD_SEARCH_DIFFICULTY_OPTIONS = [
  { value: "makkelijk", label: "Makkelijk", hint: "10 × 10 · 8 woorden", emoji: "🌱" },
  { value: "gemiddeld", label: "Gemiddeld", hint: "12 × 12 · 10 woorden", emoji: "🌤️" },
  { value: "moeilijk", label: "Moeilijk", hint: "14 × 14 · 12 woorden", emoji: "🔥" },
] as const;
