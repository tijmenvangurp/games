import type { Difficulty, SudokuSize } from "@entities/sudoku";

export type SymbolTheme = "numbers" | "animals";

export type MistakeMode = "direct" | "check";

export interface SudokuSettings {
  size: SudokuSize;
  difficulty: Difficulty;
  theme: SymbolTheme;
  mistakeMode: MistakeMode;
}

export const DEFAULT_SETTINGS: SudokuSettings = {
  size: 4,
  difficulty: "makkelijk",
  theme: "animals",
  mistakeMode: "direct",
};

const ANIMAL_SYMBOLS: Record<4 | 6, readonly string[]> = {
  4: ["🐶", "🐱", "🐰", "🦊"],
  6: ["🐶", "🐱", "🐰", "🦊", "🐼", "🦁"],
};

export function symbolsFor(size: SudokuSize, theme: SymbolTheme): readonly string[] {
  if (size === 9 || theme === "numbers") {
    return Array.from({ length: size }, (_, index) => String(index + 1));
  }
  return ANIMAL_SYMBOLS[size];
}

// De labels staan per taal in `texts.ts`; hier staan alleen de waarden.
export const DIFFICULTY_OPTIONS: readonly { value: Difficulty }[] = [
  { value: "makkelijk" },
  { value: "gemiddeld" },
  { value: "moeilijk" },
];

export const MISTAKE_MODE_OPTIONS: readonly { value: MistakeMode }[] = [
  { value: "direct" },
  { value: "check" },
];

export const THEME_OPTIONS: readonly { value: SymbolTheme }[] = [
  { value: "numbers" },
  { value: "animals" },
];

export const SIZE_OPTIONS: readonly { value: SudokuSize; label: string }[] = [
  { value: 4, label: "4 × 4" },
  { value: 6, label: "6 × 6" },
  { value: 9, label: "9 × 9" },
];
