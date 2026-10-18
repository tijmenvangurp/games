import {
  cellsBetween,
  WORD_SEARCH_DIFFICULTIES,
  WORD_SEARCH_THEMES,
  type Cell,
  type WordSearchDifficulty,
  type WordSearchPlacement,
  type WordSearchPuzzle,
  type WordSearchTheme,
} from "@entities/word-search";
import { readStoredJson, writeStoredJson } from "@shared/lib";
import { DEFAULT_WORD_SEARCH_SETTINGS, type WordSearchSettings } from "./settings";

const STORAGE_KEY = "games.word-search.v1";

export interface StoredWordSearchState {
  settings: WordSearchSettings;
  puzzle: WordSearchPuzzle | null;
  found: readonly string[];
}

const FALLBACK: StoredWordSearchState = {
  settings: DEFAULT_WORD_SEARCH_SETTINGS,
  puzzle: null,
  found: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTheme(value: unknown): value is WordSearchTheme {
  return typeof value === "string" && (WORD_SEARCH_THEMES as readonly string[]).includes(value);
}

function isDifficulty(value: unknown): value is WordSearchDifficulty {
  return (
    typeof value === "string" && (WORD_SEARCH_DIFFICULTIES as readonly string[]).includes(value)
  );
}

function isSettings(value: unknown): value is WordSearchSettings {
  return isRecord(value) && isTheme(value.theme) && isDifficulty(value.difficulty);
}

function isCell(value: unknown): value is Cell {
  return (
    isRecord(value) &&
    typeof value.row === "number" &&
    Number.isInteger(value.row) &&
    typeof value.col === "number" &&
    Number.isInteger(value.col)
  );
}

function isCellArray(value: unknown): value is Cell[] {
  return Array.isArray(value) && value.every(isCell);
}

function isGrid(value: unknown, size: number): value is string[][] {
  return (
    Array.isArray(value) &&
    value.length === size &&
    value.every(
      (row) =>
        Array.isArray(row) &&
        row.length === size &&
        row.every((letter) => typeof letter === "string" && /^[A-Z]$/.test(letter)),
    )
  );
}

function isSize(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 3 && value <= 30;
}

function isWord(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z]+$/.test(value);
}

function cellsAreStraight(cells: readonly Cell[]): boolean {
  const first = cells[0];
  const last = cells.at(-1);
  if (!first || !last) {
    return false;
  }

  const line = cellsBetween(first, last);
  return (
    line.length === cells.length &&
    line.every((cell, index) => {
      const original = cells[index];
      return original !== undefined && cell.row === original.row && cell.col === original.col;
    })
  );
}

function cellsMatchGrid(
  cells: readonly Cell[],
  word: string,
  grid: readonly (readonly string[])[],
  size: number,
): boolean {
  return cells.every((cell, index) => {
    if (cell.row < 0 || cell.row >= size || cell.col < 0 || cell.col >= size) {
      return false;
    }
    return grid[cell.row]?.[cell.col] === word[index]?.toUpperCase();
  });
}

function isPlacement(
  value: unknown,
  grid: readonly (readonly string[])[],
  size: number,
): value is WordSearchPlacement {
  if (!isRecord(value)) {
    return false;
  }

  const word = value.word;
  const cells = value.cells;
  if (!isWord(word) || !isCellArray(cells) || cells.length !== word.length) {
    return false;
  }

  return cellsAreStraight(cells) && cellsMatchGrid(cells, word, grid, size);
}

function isPuzzle(value: unknown): value is WordSearchPuzzle {
  if (
    !isRecord(value) ||
    !isTheme(value.theme) ||
    !isDifficulty(value.difficulty) ||
    !isSize(value.size)
  ) {
    return false;
  }

  const size = value.size;
  const grid = value.grid;
  if (!isGrid(grid, size)) {
    return false;
  }

  const placements = value.placements;
  return (
    Array.isArray(placements) &&
    placements.length > 0 &&
    placements.every((placement) => isPlacement(placement, grid, size))
  );
}

export function loadWordSearchState(): StoredWordSearchState {
  const parsed = readStoredJson(STORAGE_KEY);
  if (!isRecord(parsed)) {
    return FALLBACK;
  }

  const settings = isSettings(parsed.settings) ? parsed.settings : FALLBACK.settings;
  const puzzle = isPuzzle(parsed.puzzle) ? parsed.puzzle : null;
  const found =
    puzzle && Array.isArray(parsed.found)
      ? [
          ...new Set(
            parsed.found.filter(
              (word): word is string =>
                typeof word === "string" &&
                puzzle.placements.some((placement) => placement.word === word),
            ),
          ),
        ]
      : [];

  return { settings, puzzle, found };
}

export function saveWordSearchState(state: StoredWordSearchState): void {
  writeStoredJson(STORAGE_KEY, state);
}
