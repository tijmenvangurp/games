import { defineTexts } from "@shared/i18n";

/**
 * De namen van spelers, bordgroottes en computerniveaus. Spelers heten naar hun
 * kleur; de kleuren zelf staan in het design systeem.
 */
export const fourInARowLabels = defineTexts(
  {
    players: { one: "Blauw", two: "Rood" },
    boardSizes: { groot: "Groot bord", klein: "Klein bord" },
    levels: { makkelijk: "Makkelijk", middel: "Middel", moeilijk: "Moeilijk" },
  },
  {
    players: { one: "Blue", two: "Red" },
    boardSizes: { groot: "Large board", klein: "Small board" },
    levels: { makkelijk: "Easy", middel: "Medium", moeilijk: "Hard" },
  },
);
