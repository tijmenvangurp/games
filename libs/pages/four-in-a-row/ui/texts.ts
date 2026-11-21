import { defineTexts } from "@shared/i18n";

export const fourInARowPageTexts = defineTexts(
  {
    title: "Vier op een Rij",
    again: "Nog een potje",
    chooseSettings: "Andere instellingen",
    chooseSize: "Andere grootte",
    winDescription: (stand: string) => `Vier op een rij! De stand is nu ${stand}.`,
    drawDescription: "Het bord is vol zonder vier op een rij.",
    drawTitle: "Gelijkspel!",
  },
  {
    title: "Four in a Row",
    again: "One more game",
    chooseSettings: "Other settings",
    chooseSize: "Other board size",
    winDescription: (stand: string) => `Four in a row! The score is now ${stand}.`,
    drawDescription: "The board is full and nobody got four in a row.",
    drawTitle: "It's a draw!",
  },
);
