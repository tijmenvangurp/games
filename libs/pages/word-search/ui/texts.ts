import { defineTexts } from "@shared/i18n";

export const wordSearchPageTexts = defineTexts(
  {
    title: "Woordzoeker",
    chooseTheme: "Kies je thema",
    backToGame: "Terug naar je woordzoeker",
    themes: { tuin: "in de tuin", onderwater: "onder water", pokemon: "Pokémon" },
    difficulties: { makkelijk: "makkelijk", gemiddeld: "gemiddeld", moeilijk: "moeilijk" },
    doneTitle: "Gevonden!",
    doneDescription: (count: number) => `Je vond alle ${count} woorden.`,
  },
  {
    title: "Word Search",
    chooseTheme: "Choose your theme",
    backToGame: "Back to your word search",
    themes: { tuin: "in the garden", onderwater: "under water", pokemon: "Pokémon" },
    difficulties: { makkelijk: "easy", gemiddeld: "medium", moeilijk: "hard" },
    doneTitle: "All found!",
    doneDescription: (count: number) => `You found all ${count} words.`,
  },
);
