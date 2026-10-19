import { GAME_STORAGE_KEYS, profileStorageKey, writeGameProgress } from "@shared/lib";
import { QUIZ_DIFFICULTIES, type QuizDifficulty } from "./quiz";
import { DEFAULT_POKEMON_QUIZ_SETTINGS, type PokemonQuizSettings } from "./settings";

const STORAGE_KEY = GAME_STORAGE_KEYS.pokemonQuiz;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isPokemonQuizDifficulty(value: unknown): value is QuizDifficulty {
  return typeof value === "string" && (QUIZ_DIFFICULTIES as readonly string[]).includes(value);
}

export function loadPokemonQuizSettings(profileId?: string): PokemonQuizSettings {
  try {
    const raw = localStorage.getItem(profileStorageKey(STORAGE_KEY, profileId));
    if (!raw) {
      return DEFAULT_POKEMON_QUIZ_SETTINGS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isPokemonQuizDifficulty(parsed.difficulty)) {
      return DEFAULT_POKEMON_QUIZ_SETTINGS;
    }
    return { difficulty: parsed.difficulty };
  } catch {
    return DEFAULT_POKEMON_QUIZ_SETTINGS;
  }
}

export function savePokemonQuizSettings(settings: PokemonQuizSettings, profileId?: string): void {
  writeGameProgress(STORAGE_KEY, "pokemon-quiz", settings, profileId);
}
