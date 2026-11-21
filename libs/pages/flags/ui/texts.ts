import { defineTexts } from "@shared/i18n";

export const flagsPageTexts = defineTexts(
  {
    title: "Vlaggenreis",
    chooseArea: "Kies een gebied",
    perfect: "Perfect!",
    traveller: "Wat een wereldreiziger!",
    practised: "Goed geoefend!",
    stars: (stars: number, total: number) => `Je haalde ${stars} van de ${total} sterren.`,
    backToGame: "Terug naar je spel",
  },
  {
    title: "Flag Trip",
    chooseArea: "Choose an area",
    perfect: "Perfect!",
    traveller: "What a world traveller!",
    practised: "Good practice!",
    stars: (stars: number, total: number) => `You got ${stars} out of ${total} stars.`,
    backToGame: "Back to your game",
  },
);
