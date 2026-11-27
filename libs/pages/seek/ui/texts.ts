import { defineTexts } from "@shared/i18n";

export const seekPageTexts = defineTexts(
  {
    title: "Waar is Wobbel?",
    chooseSubtitle: "Kies je zoekveld",
    backToGame: "Terug naar je zoekveld",
    difficulty: { makkelijk: "makkelijk", gemiddeld: "gemiddeld", moeilijk: "moeilijk" },
    themes: { tuin: "in de tuin", onderwater: "onder water" },
    foundTitle: "Gevonden!",
    foundAtOnce: "Je vond hem meteen. Goed gekeken!",
    foundAfter: (tries: number) => `${tries} keer verder gekeken, en toch gevonden!`,
  },
  {
    title: "Where is Wobbel?",
    chooseSubtitle: "Choose your search scene",
    backToGame: "Back to your search scene",
    difficulty: { makkelijk: "easy", gemiddeld: "medium", moeilijk: "hard" },
    themes: { tuin: "in the garden", onderwater: "under water" },
    foundTitle: "Found it!",
    foundAtOnce: "You found him straight away. Good looking!",
    foundAfter: (tries: number) =>
      `You looked ${tries} more ${tries === 1 ? "time" : "times"}, and still found him!`,
  },
);
