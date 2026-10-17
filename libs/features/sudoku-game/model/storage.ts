import { isSudokuSize, type PlayState, type SudokuPuzzle } from "@entities/sudoku";
import { DEFAULT_SETTINGS, type SudokuSettings } from "./settings";

const STORAGE_KEY = "games.sudoku.v1";

export interface PersistedSudokuState {
  play: PlayState | null;
  settings: SudokuSettings;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDifficulty(value: unknown): boolean {
  return value === "makkelijk" || value === "gemiddeld" || value === "moeilijk";
}

function isIntegerArray(value: unknown, length: number): value is number[] {
  return (
    Array.isArray(value) && value.length === length && value.every((item) => Number.isInteger(item))
  );
}

function isBooleanArray(value: unknown, length: number): value is boolean[] {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every((item) => typeof item === "boolean")
  );
}

function isPuzzle(value: unknown): value is SudokuPuzzle {
  if (!isRecord(value)) {
    return false;
  }
  const { size, difficulty, seed, givens, solution } = value;
  if (typeof size !== "number" || !isSudokuSize(size)) {
    return false;
  }
  const cells = size * size;
  return (
    isDifficulty(difficulty) &&
    typeof seed === "number" &&
    isIntegerArray(givens, cells) &&
    isIntegerArray(solution, cells)
  );
}

function isSelectedCell(value: unknown, cells: number): boolean {
  return (
    value === null ||
    (typeof value === "number" && Number.isInteger(value) && value >= 0 && value < cells)
  );
}

function isPlayState(value: unknown): value is PlayState {
  if (!isRecord(value)) {
    return false;
  }
  const puzzle = value.puzzle;
  if (!isPuzzle(puzzle)) {
    return false;
  }
  const cells = puzzle.givens.length;
  return (
    isIntegerArray(value.entries, cells) &&
    isBooleanArray(value.hinted, cells) &&
    isSelectedCell(value.selected, cells) &&
    typeof value.solved === "boolean"
  );
}

function isSettings(value: unknown): value is SudokuSettings {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.size === "number" &&
    isSudokuSize(value.size) &&
    isDifficulty(value.difficulty) &&
    (value.theme === "numbers" || value.theme === "animals")
  );
}

export function loadSudokuState(): PersistedSudokuState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }
    return {
      play: isPlayState(parsed.play) ? parsed.play : null,
      settings: isSettings(parsed.settings) ? parsed.settings : DEFAULT_SETTINGS,
    };
  } catch {
    return null;
  }
}

export function saveSudokuState(state: PersistedSudokuState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode); playing still works.
  }
}
