import { QUIZ_DIFFICULTIES, type QuizDifficulty } from "./quiz";
import { DEFAULT_POKEMON_QUIZ_SETTINGS, type PokemonQuizSettings } from "./settings";

const STORAGE_KEY = "games.pokemon-quiz.v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDifficulty(value: unknown): value is QuizDifficulty {
  return typeof value === "string" && (QUIZ_DIFFICULTIES as readonly string[]).includes(value);
}

export function loadPokemonQuizSettings(): PokemonQuizSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_POKEMON_QUIZ_SETTINGS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isDifficulty(parsed.difficulty)) {
      return DEFAULT_POKEMON_QUIZ_SETTINGS;
    }
    return { difficulty: parsed.difficulty };
  } catch {
    return DEFAULT_POKEMON_QUIZ_SETTINGS;
  }
}

export function savePokemonQuizSettings(settings: PokemonQuizSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage may be unavailable (private mode); playing still works.
  }
}
