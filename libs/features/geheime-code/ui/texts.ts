import { defineTexts } from "@shared/i18n";

/** Teksten van het speelscherm van Geheime Code. Nederlands is de bron. */
export const geheimeCodePlayTexts = defineTexts(
  {
    setupTitle: "Kies je code",
    theme: "Thema",
    level: "Niveau",
    code: "Code",
    word: "Woord",
    secretCode: "Geheime code",
    letter: (letter: string) => `letter ${letter}`,
    empty: "leeg",
    chooseLetter: "Kies een letter",
    erase: "Wissen",
    wordDone: "Woord klaar.",
    tryAgain: "Probeer nog eens.",
    done: "Klaar",
    next: "Volgende",
  },
  {
    setupTitle: "Choose your code",
    theme: "Theme",
    level: "Level",
    code: "Code",
    word: "Word",
    secretCode: "Secret code",
    letter: (letter: string) => `letter ${letter}`,
    empty: "empty",
    chooseLetter: "Choose a letter",
    erase: "Erase",
    wordDone: "Word done.",
    tryAgain: "Try again.",
    done: "Done",
    next: "Next",
  },
);
