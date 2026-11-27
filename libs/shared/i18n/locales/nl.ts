import type { Widen } from "../widen";

/**
 * Nederlandse teksten: de standaardtaal en de bron voor de vorm van elke andere taal.
 * Een nieuwe sleutel komt hier eerst; `en.ts` moet dezelfde vorm hebben.
 */
export const nl = {
  language: {
    label: "Taal",
    nl: "Nederlands",
    en: "English",
  },
  meta: {
    description: "Sudoku en andere spelletjes voor kinderen. Werkt op telefoon en tablet.",
  },
  home: {
    title: "Spellen",
    surprise: "Verras me!",
    filterLabel: "Filter spellen op soort",
    all: "Alles",
    comingSoon: "Binnenkort",
  },
  shell: {
    back: "Terug naar het menu",
    backToGame: "Terug naar je spel",
    newGame: "Nieuw spel",
    soundOff: "Geluid uitzetten",
    soundOn: "Geluid aanzetten",
    speechOff: "Voorlezen uitzetten",
    speechOn: "Voorlezen aanzetten",
    listen: "Beluister de tekst",
  },
  setup: {
    title: "Nieuw spel",
    start: "Spelen",
    loading: "Spel maken…",
  },
  celebration: {
    again: "Nog een keer",
    choose: "Ander spel kiezen",
    home: "Naar het menu",
  },
  praise: ["Goedzo!", "Knap gedaan!", "Top gedaan!", "Helemaal goed!", "Slim gedaan!", "Super!"],
} as const;

/** De vorm die elke vertaling moet volgen, met vrije tekst in plaats van de Nederlandse letterlijke waarden. */
export type Translation = Widen<typeof nl>;
