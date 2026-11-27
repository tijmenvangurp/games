import { defineTexts } from "@shared/i18n";

/** Teksten van het Draaiwerk-scherm (Engels: Gearworks). */
export const draaiwerkPageTexts = defineTexts(
  {
    title: "Draaiwerk",
    backToGame: "Terug naar het spel",
    levelsSubtitle: (levels: number, chapters: number) =>
      `${levels} levels · ${chapters} hoofdstukken`,
    playSubtitle: (chapter: string, level: number, total: number) =>
      `${chapter} · level ${level} van ${total}`,
  },
  {
    title: "Gearworks",
    backToGame: "Back to the game",
    levelsSubtitle: (levels: number, chapters: number) => `${levels} levels · ${chapters} chapters`,
    playSubtitle: (chapter: string, level: number, total: number) =>
      `${chapter} · level ${level} of ${total}`,
  },
);
