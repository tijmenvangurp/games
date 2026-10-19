import { PUZZLES } from "./puzzles";

export const PUZZLE_PROGRESS_STORAGE_KEY = "games.chess-puzzles.v1";

const KNOWN_PUZZLE_IDS: ReadonlySet<string> = new Set(PUZZLES.map((puzzle) => puzzle.id));

interface StoredPuzzleProgress {
  readonly solved: readonly string[];
}

function isKnownPuzzleId(value: unknown): value is string {
  return typeof value === "string" && KNOWN_PUZZLE_IDS.has(value);
}

export function loadSolvedPuzzleIds(): ReadonlySet<string> {
  try {
    if (typeof localStorage === "undefined") {
      return new Set();
    }

    const raw = localStorage.getItem(PUZZLE_PROGRESS_STORAGE_KEY);
    if (!raw) {
      return new Set();
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return new Set();
    }

    const solved = (parsed as Partial<StoredPuzzleProgress>).solved;
    if (!Array.isArray(solved)) {
      return new Set();
    }

    return new Set(solved.filter(isKnownPuzzleId));
  } catch {
    return new Set();
  }
}

export function saveSolvedPuzzleIds(ids: ReadonlySet<string>): void {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }

    const solved = [...ids].filter(isKnownPuzzleId);
    localStorage.setItem(PUZZLE_PROGRESS_STORAGE_KEY, JSON.stringify({ solved }));
  } catch {
    // Storage is een bonus; zonder localStorage blijft de sessie werken.
  }
}
