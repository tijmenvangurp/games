import { create } from "zustand";
import { createRound, type FlagLevel, type FlagRound, type FlagScope } from "@entities/geography";
import { playHaptic, playSound } from "@shared/lib";
import { bestKey, type FlagSettings } from "./settings";
import { loadFlagState, saveFlagState } from "./storage";

interface FlagStore {
  round: FlagRound | null;
  questionIndex: number;
  wrongChoices: readonly string[];
  answered: boolean;
  correct: boolean;
  stars: number;
  streak: number;
  finished: boolean;
  settings: FlagSettings;
  best: Record<string, number>;
  start: () => void;
  newRound: () => void;
  chooseScope: (scope: FlagScope) => void;
  chooseLevel: (level: FlagLevel) => void;
  chooseAnswer: (code: string) => void;
  next: () => void;
}

type StoreSet = (partial: Partial<FlagStore> | ((state: FlagStore) => Partial<FlagStore>)) => void;

type StoreGet = () => FlagStore;

function startRound(set: StoreSet, get: StoreGet): void {
  const { settings, best } = get();
  const round = createRound(settings.scope, settings.level);
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
  saveFlagState({ settings, best });
}

function chooseScope(set: StoreSet, get: StoreGet, scope: FlagScope): void {
  const settings = { ...get().settings, scope };
  const best = get().best;
  set({ settings });
  saveFlagState({ settings, best });
}

function chooseLevel(set: StoreSet, get: StoreGet, level: FlagLevel): void {
  const settings = { ...get().settings, level };
  const best = get().best;
  set({ settings });
  saveFlagState({ settings, best });
}

function answerQuestion(set: StoreSet, get: StoreGet, code: string): void {
  const { round, questionIndex, wrongChoices, answered, stars, streak } = get();
  if (!round || answered) {
    return;
  }

  const question = round.questions[questionIndex];
  if (!question) {
    return;
  }

  if (code === question.subject.code) {
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

  const nextWrong = [...wrongChoices, code];
  // All but one option ruled out: show the answer without a further guess.
  const revealed = nextWrong.length >= question.choices.length - 1;
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
    const key = bestKey(settings.scope, settings.level);
    const nextBest = { ...best, [key]: Math.max(best[key] ?? 0, stars) };
    set({ finished: true, best: nextBest });
    saveFlagState({ settings, best: nextBest });
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

const initial = loadFlagState();

export const useFlagStore = create<FlagStore>((set, get) => ({
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
  chooseScope: (scope) => chooseScope(set, get, scope),
  chooseLevel: (level) => chooseLevel(set, get, level),
  chooseAnswer: (code) => answerQuestion(set, get, code),
  next: () => nextQuestion(set, get),
}));
