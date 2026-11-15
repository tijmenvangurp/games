import type { QuizDifficulty } from "./quiz";

export interface PokemonQuizSettings {
  difficulty: QuizDifficulty;
}

export const DEFAULT_POKEMON_QUIZ_SETTINGS: PokemonQuizSettings = {
  difficulty: "gemiddeld",
};

export const POKEMON_QUIZ_DIFFICULTY_OPTIONS = [
  { value: "makkelijk", label: "Makkelijk", hint: "3 namen" },
  { value: "gemiddeld", label: "Gemiddeld", hint: "4 namen" },
  { value: "moeilijk", label: "Moeilijk", hint: "5 namen · silhouet" },
  { value: "meester", label: "Meester", hint: "5 namen · silhouet · stukje" },
] as const;
