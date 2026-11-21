import type { SeekDifficulty, SeekTheme } from "@entities/hidden-object";

export interface SeekSettings {
  difficulty: SeekDifficulty;
  theme: SeekTheme;
}

export const DEFAULT_SEEK_SETTINGS: SeekSettings = {
  difficulty: "makkelijk",
  theme: "tuin",
};

// De labels staan per taal in `texts.ts`; hier staan de waarden en de rastermaat.
export const SEEK_DIFFICULTY_OPTIONS = [
  { value: "makkelijk", hint: "5 × 5" },
  { value: "gemiddeld", hint: "7 × 7" },
  { value: "moeilijk", hint: "9 × 9" },
] as const;

export const SEEK_THEME_OPTIONS = [{ value: "tuin" }, { value: "onderwater" }] as const;
