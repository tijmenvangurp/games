import { createSeed, mulberry32, shuffledIndexes } from "@shared/lib";
import {
  WORD_SEARCH_CONFIG,
  WORD_SEARCH_DIRECTIONS,
  WORD_SEARCH_WORDS,
  type WordSearchDirection,
} from "./config";
import type {
  Cell,
  WordSearchDifficulty,
  WordSearchPlacement,
  WordSearchPuzzle,
  WordSearchTheme,
} from "./types";

const MAX_WORD_ATTEMPTS = 400;
const MAX_PUZZLE_ATTEMPTS = 8;

function randomInt(min: number, max: number, random: () => number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function pickWords(
  theme: WordSearchTheme,
  difficulty: WordSearchDifficulty,
  random: () => number,
): string[] {
  const pool = WORD_SEARCH_WORDS[theme];
  const { wordCount } = WORD_SEARCH_CONFIG[difficulty];

  return shuffledIndexes(pool.length, random)
    .slice(0, wordCount)
    .map((index) => pool[index]);
}

function emptyGrid(size: number): string[][] {
  return Array.from({ length: size }, () => Array<string>(size).fill(""));
}

/** The valid start range for a word along one axis. */
function startRange(delta: number, length: number, size: number): [number, number] {
  if (delta > 0) {
    return [0, size - 1 - (length - 1) * delta];
  }
  if (delta < 0) {
    return [(length - 1) * -delta, size - 1];
  }
  return [0, size - 1];
}

function cellsForWord(
  grid: string[][],
  letters: string,
  startRow: number,
  startCol: number,
  direction: WordSearchDirection,
): Cell[] | null {
  const cells: Cell[] = [];

  for (let index = 0; index < letters.length; index += 1) {
    const row = startRow + direction.row * index;
    const col = startCol + direction.col * index;
    const current = grid[row]?.[col];
    if (current === undefined || (current !== "" && current !== letters[index])) {
      return null;
    }
    cells.push({ row, col });
  }

  return cells;
}

function writeWord(grid: string[][], letters: string, cells: readonly Cell[]): void {
  cells.forEach((cell, index) => {
    grid[cell.row][cell.col] = letters[index] ?? "";
  });
}

function tryPlaceWord(
  grid: string[][],
  word: string,
  directions: readonly WordSearchDirection[],
  random: () => number,
): WordSearchPlacement | null {
  const size = grid.length;
  const letters = word.toUpperCase();

  for (let attempt = 0; attempt < MAX_WORD_ATTEMPTS; attempt += 1) {
    const direction = directions[Math.floor(random() * directions.length)];
    if (!direction) {
      return null;
    }

    const [minRow, maxRow] = startRange(direction.row, letters.length, size);
    const [minCol, maxCol] = startRange(direction.col, letters.length, size);
    if (minRow > maxRow || minCol > maxCol) {
      continue;
    }

    const startRow = randomInt(minRow, maxRow, random);
    const startCol = randomInt(minCol, maxCol, random);
    const cells = cellsForWord(grid, letters, startRow, startCol, direction);
    if (!cells) {
      continue;
    }

    writeWord(grid, letters, cells);
    return { word, cells };
  }

  return null;
}

function placeWords(
  grid: string[][],
  words: readonly string[],
  directions: readonly WordSearchDirection[],
  random: () => number,
): WordSearchPlacement[] {
  const placed = new Map<string, WordSearchPlacement>();
  const ordered = [...words].sort((first, second) => second.length - first.length);

  for (const word of ordered) {
    const placement = tryPlaceWord(grid, word, directions, random);
    if (!placement) {
      throw new Error(`Geen plek gevonden voor "${word}"`);
    }
    placed.set(word, placement);
  }

  return words
    .map((word) => placed.get(word))
    .filter((placement): placement is WordSearchPlacement => placement !== undefined);
}

function fillGrid(grid: string[][], random: () => number): void {
  for (const row of grid) {
    for (let index = 0; index < row.length; index += 1) {
      if (row[index] === "") {
        row[index] = String.fromCharCode(65 + Math.floor(random() * 26));
      }
    }
  }
}

/**
 * Builds a deterministic word search with the word list from one of the app
 * themes. The same seed always produces the same grid and placements.
 */
export function createWordSearch(
  theme: WordSearchTheme,
  difficulty: WordSearchDifficulty,
  seed: number = createSeed(),
): WordSearchPuzzle {
  const config = WORD_SEARCH_CONFIG[difficulty];
  const directions = WORD_SEARCH_DIRECTIONS[difficulty];
  const random = mulberry32(seed);
  const words = pickWords(theme, difficulty, random);

  for (let attempt = 0; attempt < MAX_PUZZLE_ATTEMPTS; attempt += 1) {
    const grid = emptyGrid(config.size);

    try {
      const placements = placeWords(grid, words, directions, random);
      fillGrid(grid, random);
      return {
        theme,
        difficulty,
        size: config.size,
        grid,
        placements,
      };
    } catch {
      // Try a fresh grid with the next random values.
    }
  }

  throw new Error(`Kon geen woordzoeker maken voor ${theme}/${difficulty}`);
}
