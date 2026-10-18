import { create } from "zustand";
import { createRound, type MathLevel, type MathMode, type MathRound } from "@entities/math";
import { playHaptic, playSound } from "@shared/lib";
import { loadMathState, saveMathState } from "./storage";
import { bestKey, type MathSettings } from "./settings";

interface MathStore {
  round: MathRound | null;
  questionIndex: number;
  wrongChoices: readonly number[];
  answered: boolean;
  correct: boolean;
  stars: number;
  streak: number;
  finished: boolean;
  settings: MathSettings;
  best: Record<string, number>;
  start: () => void;
  newRound: () => void;
  chooseMode: (mode: MathMode) => void;
  chooseLevel: (level: MathLevel) => void;
  chooseAnswer: (choice: number) => void;
  next: () => void;
}

type StoreSet = (partial: Partial<MathStore> | ((state: MathStore) => Partial<MathStore>)) => void;

type StoreGet = () => MathStore;

function startRound(set: StoreSet, get: StoreGet): void {
  const { settings, best } = get();
  const round = createRound(settings.mode, settings.level);
  set({
    round,
    questionIndex: 0,
    wrongChoices: [],
    answered: false,
    correct: false,
    stars: 0,
    streak: 0,
    finished: false,
  });
  saveMathState({ settings, best });
}

function chooseMode(set: StoreSet, get: StoreGet, mode: MathMode): void {
  const settings = { ...get().settings, mode };
  const best = get().best;
  set({ settings });
  saveMathState({ settings, best });
}

function chooseLevel(set: StoreSet, get: StoreGet, level: MathLevel): void {
  const settings = { ...get().settings, level };
  const best = get().best;
  set({ settings });
  saveMathState({ settings, best });
}

function answerQuestion(set: StoreSet, get: StoreGet, choice: number): void {
  const { round, questionIndex, wrongChoices, answered, stars, streak } = get();
  if (!round || answered) {
    return;
  }

  const question = round.questions[questionIndex];
  if (!question) {
    return;
  }

  if (choice === question.answer) {
    const firstTry = wrongChoices.length === 0;
    set({
      answered: true,
      correct: true,
      stars: stars + (firstTry ? 1 : 0),
      streak: firstTry ? streak + 1 : 0,
    });
    playSound("match");
    playHaptic("match");
    return;
  }

  const nextWrong = [...wrongChoices, choice];
  const revealed = nextWrong.length >= 2;
  set({
    wrongChoices: nextWrong,
    answered: revealed,
    correct: false,
    streak: 0,
  });
  playSound(revealed ? "almost" : "wrong");
  playHaptic(revealed ? "almost" : "wrong");
}

function nextQuestion(set: StoreSet, get: StoreGet): void {
  const { round, questionIndex, answered, stars, best, settings, finished } = get();
  if (!round || finished || !answered) {
    return;
  }

  if (questionIndex + 1 >= round.questions.length) {
    const key = bestKey(settings.mode, settings.level);
    const nextBest = { ...best, [key]: Math.max(best[key] ?? 0, stars) };
    set({ finished: true, best: nextBest });
    saveMathState({ settings, best: nextBest });
    playSound("win");
    playHaptic("win");
    return;
  }

  set({
    questionIndex: questionIndex + 1,
    wrongChoices: [],
    answered: false,
    correct: false,
  });
  playSound("tap");
  playHaptic("tap");
}

const initial = loadMathState();

export const useMathStore = create<MathStore>((set, get) => ({
  round: null,
  questionIndex: 0,
  wrongChoices: [],
  answered: false,
  correct: false,
  stars: 0,
  streak: 0,
  finished: false,
  settings: initial.settings,
  best: initial.best,

  start: () => startRound(set, get),
  newRound: () => startRound(set, get),
  chooseMode: (mode) => chooseMode(set, get, mode),
  chooseLevel: (level) => chooseLevel(set, get, level),
  chooseAnswer: (choice) => answerQuestion(set, get, choice),
  next: () => nextQuestion(set, get),
}));
