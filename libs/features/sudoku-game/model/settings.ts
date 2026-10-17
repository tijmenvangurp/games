import type { Difficulty, SudokuSize } from "@entities/sudoku";

export type SymbolTheme = "numbers" | "animals";

export interface SudokuSettings {
  size: SudokuSize;
  difficulty: Difficulty;
  theme: SymbolTheme;
}

export const DEFAULT_SETTINGS: SudokuSettings = {
  size: 4,
  difficulty: "makkelijk",
  theme: "animals",
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

export const DIFFICULTY_OPTIONS: readonly {
  value: Difficulty;
  label: string;
  emoji: string;
}[] = [
  { value: "makkelijk", label: "Makkelijk", emoji: "🌱" },
  { value: "gemiddeld", label: "Gemiddeld", emoji: "🌤️" },
  { value: "moeilijk", label: "Moeilijk", emoji: "🔥" },
];

export const SIZE_OPTIONS: readonly {
  value: SudokuSize;
  label: string;
  hint: string;
  emoji: string;
}[] = [
  { value: 4, label: "4 × 4", hint: "Voor de jongste", emoji: "🐣" },
  { value: 6, label: "6 × 6", hint: "Iets meer uitdaging", emoji: "🦊" },
  { value: 9, label: "9 × 9", hint: "De klassieker", emoji: "🧠" },
];
