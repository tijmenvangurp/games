import {
  GAME_CATEGORIES,
  type GameCatalogEntry,
  type GameCategory,
  type GameId,
} from "./game-catalog";
import type { Language } from "@shared/i18n";

interface GameText {
  readonly name: string;
  readonly description: string;
}

/**
 * Engelse naam en beschrijving per spel. De Nederlandse tekst staat in de catalogus zelf.
 * Eigennamen (Sudoku, Pokémon Memory, Bonjour !) blijven gelijk.
 */
const ENGLISH_GAMES: Readonly<Record<GameId, GameText>> = {
  sudoku: {
    name: "Sudoku",
    description: "A puzzle with numbers or animals. Choose 4 × 4, 6 × 6 or 9 × 9.",
  },
  "math-trainer": {
    name: "Times Table Topper",
    description: "Practise adding, subtracting, multiplying and dividing. Earn stars.",
  },
  arrows: {
    name: "Arrows",
    description: "Clear all the arrows without letting them bump into each other.",
  },
  seek: {
    name: "Where is Wobbel?",
    description: "Find the little monster with the star among all the other Wobbels.",
  },
  "word-search": {
    name: "Word Search",
    description: "Find words in the garden, under water or among the Pokémon.",
  },
  alchemy: {
    name: "Mix & Match",
    description: "Drag elements onto each other and discover what you make.",
  },
  draaiwerk: {
    name: "Gearworks",
    description: "Connect gears, belts and chains. Light the lamp and send the lift up.",
  },
  memory: {
    name: "Pokémon Memory",
    description: "Find the pairs among the 151 Pokémon from Generation 1.",
  },
  "pokemon-quiz": {
    name: "Who's that Pokémon?",
    description: "Pick the right name for the picture. 3, 4 or 5 names.",
  },
  chess: {
    name: "Chess",
    description: "Learn the pieces, solve puzzles or play a game.",
  },
  flags: {
    name: "Flag Trip",
    description: "Learn flags and put countries or provinces in the right place.",
  },
  "french-listening": {
    name: "Bonjour !",
    description: "Listen to French and pick the right English translation.",
  },
  letters: {
    name: "Letter Fun",
    description: "Hear the sound, find the letter, build and read little words.",
  },
  "four-in-a-row": {
    name: "Four in a Row",
    description: "Get four in a row, together or against the computer.",
  },
  ganzenbord: {
    name: "Game of the Goose",
    description: "Roll the dice and race your goose to 63.",
  },
  typepret: {
    name: "Typing Fun",
    description: "Learn to touch type: fingers on the home row, tap the letter that lights up.",
  },
  murdoku: {
    name: "Who Did It?",
    description:
      "Read the clues, fill in the floor plan and find the thief who was alone with the loot.",
  },
  "geheime-code": {
    name: "Secret Code",
    description: "Find the letter for each symbol and crack the code.",
  },
};

const ENGLISH_CATEGORIES: Readonly<Record<GameCategory, string>> = {
  puzzel: "Puzzles & Logic",
  "taal-rekenen": "Words & Numbers",
  spel: "Board & Memory",
  ontdekken: "Discover",
};

export function gameText(
  game: Pick<GameCatalogEntry, "id" | "name" | "description">,
  language: Language,
): GameText {
  return language === "en" ? ENGLISH_GAMES[game.id] : game;
}

export function categoryLabel(category: GameCategory, language: Language): string {
  if (language === "en") {
    return ENGLISH_CATEGORIES[category];
  }
  return GAME_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}
