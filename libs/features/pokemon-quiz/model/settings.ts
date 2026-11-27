import { QUIZ_DIFFICULTIES, type QuizDifficulty } from "./quiz";
import type { PokemonQuizTexts } from "./texts";

export interface PokemonQuizSettings {
  difficulty: QuizDifficulty;
}

export const DEFAULT_POKEMON_QUIZ_SETTINGS: PokemonQuizSettings = {
  difficulty: "gemiddeld",
};

export function pokemonQuizDifficultyOptions(t: PokemonQuizTexts) {
  return QUIZ_DIFFICULTIES.map((value) => ({ value, ...t.difficulties[value] }));
}
