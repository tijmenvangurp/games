import { create } from "zustand";
import { createSeed } from "@shared/lib";
import { createQuizQuestion, type QuizDifficulty, type QuizMode, type QuizQuestion } from "./quiz";
import { loadPokemonQuizSettings, savePokemonQuizSettings } from "./storage";
import type { PokemonQuizSettings } from "./settings";

interface PokemonQuizStore {
  question: QuizQuestion | null;
  selectedId: number | null;
  answered: boolean;
  correctCount: number;
  rounds: number;
  settings: PokemonQuizSettings;
  start: (question: QuizQuestion) => void;
  startNewGame: () => void;
  newQuestion: () => void;
  answer: (pokemonId: number) => void;
  chooseDifficulty: (difficulty: QuizDifficulty) => void;
  chooseMode: (mode: QuizMode) => void;
}

function nextQuestion(settings: PokemonQuizSettings): QuizQuestion {
  return createQuizQuestion(settings.difficulty, createSeed(), settings.mode);
}

export const usePokemonQuizStore = create<PokemonQuizStore>((set, get) => ({
  question: null,
  selectedId: null,
  answered: false,
  correctCount: 0,
  rounds: 0,
  settings: loadPokemonQuizSettings(),

  start: (question) =>
    set({
      question,
      selectedId: null,
      answered: false,
      correctCount: 0,
      rounds: 0,
    }),

  startNewGame: () => get().start(nextQuestion(get().settings)),

  newQuestion: () => {
    const { settings } = get();
    set({
      question: nextQuestion(settings),
      selectedId: null,
      answered: false,
    });
  },

  answer: (pokemonId) =>
    set((state) => {
      if (!state.question || state.answered) {
        return {};
      }
      const correct = pokemonId === state.question.targetId;
      return {
        selectedId: pokemonId,
        answered: true,
        rounds: state.rounds + 1,
        correctCount: state.correctCount + (correct ? 1 : 0),
      };
    }),

  chooseDifficulty: (difficulty) => {
    const settings = { ...get().settings, difficulty };
    set({ settings });
    savePokemonQuizSettings(settings);
  },

  chooseMode: (mode) => {
    const settings = { ...get().settings, mode };
    set({ settings });
    savePokemonQuizSettings(settings);
  },
}));
