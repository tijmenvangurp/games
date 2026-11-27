import { defineTexts } from "@shared/i18n";

export const memoryPageTexts = defineTexts(
  {
    title: "Pokémon Memory",
    chooseSubtitle: "Kies je spel",
    subtitle: (pairs: number, mode: string) => `${pairs} paren · ${mode}`,
    modes: { auto: "groeit mee", manual: "zelf gekozen" },
    backToGame: "Terug naar je spel",
    challengeWonTitle: "Uitdaging gelukt!",
    foundTitle: "Alle Pokémon gevonden!",
    challengeWon: (pairs: number) =>
      `Je koos de uitdaging en haalde hem. We gaan verder met ${pairs} paren.`,
    challengeTried:
      "Dat was een flinke uitdaging. Je bleef proberen; volgende keer pakken we weer een haalbaar bord.",
    levelUp: (pairs: number) =>
      `Je bleef zoeken en vond ze allemaal. Volgende keer ${pairs} paren.`,
    levelDown: "Je bleef proberen. Volgende keer doen we het iets rustiger aan.",
    steady: "Je bleef zoeken en vond elk paar.",
  },
  {
    title: "Pokémon Memory",
    chooseSubtitle: "Choose your game",
    subtitle: (pairs: number, mode: string) => `${pairs} pairs · ${mode}`,
    modes: { auto: "grows with you", manual: "your choice" },
    backToGame: "Back to your game",
    challengeWonTitle: "Challenge complete!",
    foundTitle: "You found all the Pokémon!",
    challengeWon: (pairs: number) =>
      `You took the challenge and beat it. Next we'll play with ${pairs} pairs.`,
    challengeTried:
      "That was a big challenge. You kept trying; next time we'll pick a board that fits you again.",
    levelUp: (pairs: number) => `You kept looking and found them all. Next time: ${pairs} pairs.`,
    levelDown: "You kept trying. Next time we'll take it a little easier.",
    steady: "You kept looking and found every pair.",
  },
);
