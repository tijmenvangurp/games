import { defineTexts } from "@shared/i18n";

export const ganzenbordPageTexts = defineTexts(
  {
    title: "Ganzenbord",
    subtitle: (players: number) => `${players} spelers`,
    adjustBoard: "Bord bijstellen",
    again: "Nog een potje",
    choose: "Andere spelers",
    drawTitle: "Gelijkspel!",
  },
  {
    title: "Game of the Goose",
    subtitle: (players: number) => `${players} players`,
    adjustBoard: "Adjust the board",
    again: "One more game",
    choose: "Other players",
    drawTitle: "It's a draw!",
  },
);
