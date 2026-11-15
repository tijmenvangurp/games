import type { SeekDifficulty, SeekTheme } from "@entities/hidden-object";

export interface SeekSettings {
  difficulty: SeekDifficulty;
  theme: SeekTheme;
}

export const DEFAULT_SEEK_SETTINGS: SeekSettings = {
  difficulty: "makkelijk",
  theme: "tuin",
};

export const SEEK_DIFFICULTY_OPTIONS = [
  { value: "makkelijk", label: "Makkelijk", hint: "5 × 5" },
  { value: "gemiddeld", label: "Gemiddeld", hint: "7 × 7" },
  { value: "moeilijk", label: "Moeilijk", hint: "9 × 9" },
] as const;

export const SEEK_THEME_OPTIONS = [
  { value: "tuin", label: "Tuin", hint: "Bloemen en blaadjes" },
  { value: "onderwater", label: "Onder water", hint: "Bubbels en schelpen" },
] as const;
