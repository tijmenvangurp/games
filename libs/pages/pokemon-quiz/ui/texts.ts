import { defineTexts } from "@shared/i18n";

export const pokemonQuizPageTexts = defineTexts(
  {
    title: "Wie is deze Pokémon?",
    chooseSubtitle: "Kies je spel",
    subtitle: (difficulty: string, names: number) => `${difficulty} · ${names} namen`,
    difficulties: {
      makkelijk: "makkelijk",
      gemiddeld: "gemiddeld",
      moeilijk: "moeilijk",
      meester: "meester",
    },
    backToGame: "Terug naar je spel",
  },
  {
    title: "Who's that Pokémon?",
    chooseSubtitle: "Choose your game",
    subtitle: (difficulty: string, names: number) => `${difficulty} · ${names} names`,
    difficulties: {
      makkelijk: "easy",
      gemiddeld: "medium",
      moeilijk: "hard",
      meester: "master",
    },
    backToGame: "Back to your game",
  },
);
