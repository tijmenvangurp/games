import type { CrosswordPuzzle } from "@entities/crossword";

const STORAGE_KEY = "games.crossword.v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cellExists(puzzle: CrosswordPuzzle, key: string): boolean {
  const [row, col] = key.split(":").map(Number);
  if (!Number.isInteger(row) || !Number.isInteger(col)) {
    return false;
  }
  return Boolean(puzzle.cells[row]?.[col]?.solution);
}

export function loadCrosswordLetters(puzzle: CrosswordPuzzle): Record<string, string> {
  try {
    if (typeof localStorage === "undefined") {
      return {};
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.letters)) {
      return {};
    }

    const letters: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.letters)) {
      if (typeof value === "string" && /^[A-Z]$/.test(value) && cellExists(puzzle, key)) {
        letters[key] = value;
      }
    }
    return letters;
  } catch {
    return {};
  }
}

export function saveCrosswordLetters(letters: Record<string, string>): void {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ letters }));
  } catch {
    // Storage may be unavailable; the in-memory game still works.
  }
}
