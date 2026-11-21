import type { Language } from "@shared/i18n";
import type { MazeLevel } from "./types";

/** Engelse levelnamen per level-id. De Nederlandse naam staat in het level zelf. */
const ENGLISH_NAMES: Readonly<Record<string, string>> = {
  "hart-1": "Heart",
  "ster-1": "Star",
  "vis-1": "Fish",
  "huis-1": "House",
  "boom-1": "Tree",
  "raket-1": "Rocket",
  "kat-1": "Cat",
  "bloem-1": "Flower",
  "maan-1": "Moon",
  "hart-2": "Big heart",
};

const LEVEL_NAME: Readonly<Record<Language, (level: MazeLevel) => string>> = {
  nl: (level) => level.name,
  en: (level) => ENGLISH_NAMES[level.id] ?? level.name,
};

/** De naam van een level in de gekozen taal. */
export function levelName(level: MazeLevel, language: Language): string {
  return LEVEL_NAME[language](level);
}
