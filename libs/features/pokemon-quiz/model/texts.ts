import { defineTexts } from "@shared/i18n";

export const pokemonQuizTexts = defineTexts(
  {
    difficultyLegend: "Moeilijkheid",
    difficulties: {
      makkelijk: { label: "Makkelijk", hint: "3 namen" },
      gemiddeld: { label: "Gemiddeld", hint: "4 namen" },
      moeilijk: { label: "Moeilijk", hint: "5 namen · silhouet" },
      meester: { label: "Meester", hint: "5 namen · silhouet · stukje" },
    },
    score: (correct: number, rounds: number) => `${correct} van ${rounds} goed`,
    rounds: "rondes",
    optionsLabel: "Kies de juiste naam",
    chooseName: "Kies een naam.",
    fragmentPrompt: "Je ziet steeds een stukje…",
    prompt: "Wie is deze Pokémon?",
    notYet: "Nog niet.",
    itIs: (name: string) => `Het is ${name}.`,
    rightAnswer: (name: string) => `Het juiste antwoord is ${name}.`,
    next: "Volgende Pokémon",
  },
  {
    difficultyLegend: "Difficulty",
    difficulties: {
      makkelijk: { label: "Easy", hint: "3 names" },
      gemiddeld: { label: "Medium", hint: "4 names" },
      moeilijk: { label: "Hard", hint: "5 names · silhouette" },
      meester: { label: "Master", hint: "5 names · silhouette · close-up" },
    },
    score: (correct: number, rounds: number) => `${correct} of ${rounds} correct`,
    rounds: "rounds",
    optionsLabel: "Choose the right name",
    chooseName: "Choose a name.",
    fragmentPrompt: "You only see a little piece…",
    prompt: "Who's that Pokémon?",
    notYet: "Not quite.",
    itIs: (name: string) => `It's ${name}.`,
    rightAnswer: (name: string) => `The right answer is ${name}.`,
    next: "Next Pokémon",
  },
);

export type PokemonQuizTexts = (typeof pokemonQuizTexts)["nl"];
