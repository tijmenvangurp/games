import { WordSearch } from "@aydee-app/word-search";
import { createSeed, mulberry32, shuffledIndexes } from "@shared/lib";
import { WORD_SEARCH_CONFIG, WORD_SEARCH_WORDS } from "./config";
import type {
  WordSearchDifficulty,
  WordSearchPlacement,
  WordSearchPuzzle,
  WordSearchTheme,
} from "./types";

const MAX_ATTEMPTS = 8;

function pickWords(
  theme: WordSearchTheme,
  difficulty: WordSearchDifficulty,
  seed: number,
): string[] {
  const pool = WORD_SEARCH_WORDS[theme];
  const { wordCount } = WORD_SEARCH_CONFIG[difficulty];

  return shuffledIndexes(pool.length, mulberry32(seed))
    .slice(0, wordCount)
    .map((index) => pool[index]);
}

function toPlacements(
  words: readonly string[],
  positions: ReadonlyMap<string, readonly { x: number; y: number }[]>,
): WordSearchPlacement[] {
  return words.map((word) => {
    const cells = positions.get(word.toUpperCase());
    if (!cells) {
      throw new Error(`Geen plek gevonden voor "${word}"`);
    }

    return {
      word,
      cells: cells.map(({ x, y }) => ({ row: x, col: y })),
    };
  });
}

/**
 * Builds a word search with the word list from one of the app themes.
 *
 * The seed only determines which words are chosen; the placement itself is
 * random inside the generator library. The whole puzzle is stored in
 * localStorage, so a reload shows the same board.
 */
export function createWordSearch(
  theme: WordSearchTheme,
  difficulty: WordSearchDifficulty,
  seed: number = createSeed(),
): WordSearchPuzzle {
  const config = WORD_SEARCH_CONFIG[difficulty];
  const words = pickWords(theme, difficulty, seed);
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const generator = new WordSearch({
        words,
        size: config.size,
        allowDiagonal: config.allowDiagonal,
        fillBlanks: true,
      });
      const grid = generator.generate();

      return {
        theme,
        difficulty,
        size: config.size,
        grid,
        placements: toPlacements(words, generator.getPositions()),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Kon geen woordzoeker maken: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}
