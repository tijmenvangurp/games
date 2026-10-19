import type { QuizDifficulty, QuizMode } from "./quiz";

export interface PokemonQuizSettings {
  difficulty: QuizDifficulty;
  mode: QuizMode;
}

export const DEFAULT_POKEMON_QUIZ_SETTINGS: PokemonQuizSettings = {
  difficulty: "gemiddeld",
  mode: "naam",
};

export const POKEMON_QUIZ_MODE_OPTIONS = [
  {
    value: "naam",
    label: "Naam raden",
    hint: "Je ziet de Pokémon",
    symbol: "Aa",
  },
  {
    value: "geluid",
    label: "Geluid raden",
    hint: "Je hoort de Pokémon",
    symbol: "♪",
  },
  {
    value: "plaatje",
    label: "Geluid kiezen",
    hint: "Je ziet de Pokémon",
    symbol: "♬",
  },
] as const;

interface DifficultyOption {
  value: QuizDifficulty;
  label: string;
  hint: string;
}

function optionNoun(mode: QuizMode): string {
  if (mode === "geluid") {
    return "plaatjes";
  }
  if (mode === "plaatje") {
    return "geluiden";
  }
  return "namen";
}

/** Difficulty hints differ per mode: silhouettes only make sense with names. */
export function pokemonQuizDifficultyOptions(mode: QuizMode): readonly DifficultyOption[] {
  const noun = optionNoun(mode);
  const silhouettes = mode === "naam";

  return [
    {
      value: "makkelijk",
      label: "Makkelijk",
      hint: `3 ${noun}`,
    },
    {
      value: "gemiddeld",
      label: "Gemiddeld",
      hint: `4 ${noun}`,
    },
    {
      value: "moeilijk",
      label: "Moeilijk",
      hint: silhouettes ? `5 ${noun} · silhouet` : `5 ${noun}`,
    },
    {
      value: "meester",
      label: "Meester",
      hint: silhouettes ? `5 ${noun} · silhouet · stukje` : `5 ${noun}`,
    },
  ];
}
