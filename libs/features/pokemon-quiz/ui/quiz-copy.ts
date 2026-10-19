import type { QuizMode } from "../model/quiz";

interface QuizPlayCopy {
  eyebrow: string;
  prompt: string;
  hint: string;
}

/** Copy for each play mode; every variant changes one sensory channel at most. */
export const QUIZ_PLAY_COPY: Record<QuizMode, QuizPlayCopy> = {
  naam: {
    eyebrow: "Raad de Pokémon",
    prompt: "Kies de juiste naam",
    hint: "Kies een naam. Daarna hoor je de Pokémon.",
  },
  geluid: {
    eyebrow: "Luister en kies",
    prompt: "Kies het juiste plaatje",
    hint: "Luister goed. Tik op de luidspreker om opnieuw te luisteren.",
  },
  plaatje: {
    eyebrow: "Kijk en luister",
    prompt: "Kies het juiste geluid",
    hint: "Beluister de geluiden en kies het geluid van deze Pokémon.",
  },
};
