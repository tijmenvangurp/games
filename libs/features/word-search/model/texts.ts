import { defineTexts } from "@shared/i18n";

/** Zichtbare status naast de Nederlandse spraak; in het Engels zonder stem. */
export const wordSearchFeedbackTexts = defineTexts(
  {
    instruction: "Sleep over een woord of tik de eerste en de laatste letter.",
    lastLetter: "Kies de laatste letter.",
    wrong: "Die niet — probeer een andere lijn.",
    complete: "Alle woorden gevonden!",
    found: (word: string) => `${word} gevonden`,
  },
  {
    instruction: "Drag across a word, or tap its first and last letter.",
    lastLetter: "Now choose the last letter.",
    wrong: "Not that one — try another line.",
    complete: "You found all the words!",
    found: (word: string) => `You found ${word}!`,
  },
);
