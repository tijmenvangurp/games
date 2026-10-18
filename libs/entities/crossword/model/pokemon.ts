import { buildCrossword } from "./builder";
import type { CrosswordInput } from "./types";

const POKEMON_GRID = [
  ".....B..",
  "ARTICUNO",
  ".SNORLAX",
  ".....B..",
  "MAGIKARP",
  "EEVEES..",
  "W....A..",
  ".....U..",
  ".....R..",
];

const POKEMON_INPUT: CrosswordInput = {
  id: "pokemon-1",
  title: "Pokémon",
  category: "Pokémon",
  grid: POKEMON_GRID,
  entries: [
    {
      direction: "down",
      row: 0,
      col: 5,
      answer: "BULBASAUR",
      clue: "Groene starter met een bloembol op zijn rug.",
    },
    {
      direction: "across",
      row: 1,
      col: 0,
      answer: "ARTICUNO",
      clue: "IJsvogel-legende met ijskrachten.",
    },
    {
      direction: "across",
      row: 2,
      col: 1,
      answer: "SNORLAX",
      clue: "Slapende blauwe reus die veel eet.",
    },
    {
      direction: "across",
      row: 4,
      col: 0,
      answer: "MAGIKARP",
      clue: "Rode vis die vooral spartelt.",
    },
    {
      direction: "across",
      row: 5,
      col: 0,
      answer: "EEVEE",
      clue: "Vosachtige Pokémon die in veel soorten kan evolueren.",
    },
    {
      direction: "down",
      row: 4,
      col: 0,
      answer: "MEW",
      clue: "Zeldzame roze Pokémon met een lange staart.",
    },
  ],
};

export const POKEMON_CROSSWORD = buildCrossword(POKEMON_INPUT);
