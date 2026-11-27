import type { Translation } from "./nl";

/**
 * English texts. Game names that are proper names (Sudoku, Pokémon Memory,
 * Bonjour !) stay as they are; the rest follow the meaning, not the letters.
 */
export const en = {
  language: {
    label: "Language",
    nl: "Nederlands",
    en: "English",
  },
  meta: {
    description: "Sudoku and other games for kids. Works on phone and tablet.",
  },
  home: {
    title: "Games",
    surprise: "Surprise me!",
    filterLabel: "Filter games by type",
    all: "All",
    comingSoon: "Coming soon",
  },
  shell: {
    back: "Back to the menu",
    backToGame: "Back to your game",
    newGame: "New game",
    soundOff: "Turn sound off",
    soundOn: "Turn sound on",
    speechOff: "Turn reading aloud off",
    speechOn: "Turn reading aloud on",
    listen: "Listen to the text",
  },
  setup: {
    title: "New game",
    start: "Play",
    loading: "Making the game…",
  },
  celebration: {
    again: "One more time",
    choose: "Choose another game",
    home: "Back to the menu",
  },
  praise: ["Well done!", "Nicely done!", "Great job!", "All correct!", "Clever!", "Super!"],
} as const satisfies Translation;
