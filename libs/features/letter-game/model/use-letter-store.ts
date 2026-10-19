import { create } from "zustand";
import {
  createLetterRound,
  recordLetterAnswer,
  type LetterId,
  type LetterProgressMap,
  type LetterQuestion,
  type LetterRound,
} from "@entities/letter";
import { playHaptic, playSound } from "@shared/lib";
import { loadLetterProgress, saveLetterProgress } from "./progress";

interface LetterStore {
  round: LetterRound | null;
  index: number;
  answered: boolean;
  correct: boolean;
  wrongChoices: readonly LetterId[];
  filled: readonly LetterId[];
  wrongLetters: readonly LetterId[];
  progress: LetterProgressMap;
  finished: boolean;
  start: () => void;
  choose: (letter: LetterId) => void;
  submitTrain: (letter: LetterId) => void;
  next: () => void;
}

type StoreSet = (
  partial: Partial<LetterStore> | ((state: LetterStore) => Partial<LetterStore>),
) => void;
type StoreGet = () => LetterStore;

function currentQuestion(get: StoreGet): LetterQuestion | null {
  const { round, index } = get();
  return round?.questions[index] ?? null;
}

function applyProgress(set: StoreSet, get: StoreGet, letter: LetterId, correct: boolean): void {
  const progress = recordLetterAnswer(get().progress, letter, correct);
  set({ progress });
  saveLetterProgress(progress);
}

function startRound(set: StoreSet, get: StoreGet): void {
  set({
    round: createLetterRound(get().progress),
    index: 0,
    answered: false,
    correct: false,
    wrongChoices: [],
    filled: [],
    wrongLetters: [],
    finished: false,
  });
  playSound("tap");
  playHaptic("tap");
}

function choose(set: StoreSet, get: StoreGet, letter: LetterId): void {
  const question = currentQuestion(get);
  const { answered, wrongChoices } = get();
  if (!question || question.kind === "trein" || answered) {
    return;
  }

  const firstTry = wrongChoices.length === 0;
  if (letter === question.target) {
    set({ answered: true, correct: true });
    applyProgress(set, get, question.target, firstTry);
    playSound("match");
    playHaptic("match");
    return;
  }

  const nextWrong = [...wrongChoices, letter];
  const revealed = nextWrong.length >= 2;
  set({ wrongChoices: nextWrong, answered: revealed, correct: false });
  if (revealed) {
    applyProgress(set, get, question.target, false);
  }
  playSound(revealed ? "almost" : "wrong");
  playHaptic(revealed ? "almost" : "wrong");
}

function submitTrain(set: StoreSet, get: StoreGet, letter: LetterId): void {
  const question = currentQuestion(get);
  const { answered, filled, wrongLetters } = get();
  if (!question || question.kind !== "trein" || answered) {
    return;
  }

  const expected = question.word.letters[filled.length];
  if (!expected) {
    return;
  }

  if (letter !== expected) {
    set({ wrongLetters: [...wrongLetters, letter] });
    playSound("wrong");
    playHaptic("wrong");
    return;
  }

  const nextFilled = [...filled, letter];
  if (nextFilled.length < question.word.letters.length) {
    set({ filled: nextFilled });
    playSound("tap");
    playHaptic("tap");
    return;
  }

  set({ filled: nextFilled, answered: true, correct: true });
  applyProgress(set, get, question.target, wrongLetters.length === 0);
  playSound("match");
  playHaptic("match");
}

function nextQuestion(set: StoreSet, get: StoreGet): void {
  const { round, index, answered, finished } = get();
  if (!round || finished || !answered) {
    return;
  }

  if (index + 1 >= round.questions.length) {
    set({ finished: true });
    playSound("win");
    playHaptic("win");
    return;
  }

  set({
    index: index + 1,
    answered: false,
    correct: false,
    wrongChoices: [],
    filled: [],
    wrongLetters: [],
  });
  playSound("tap");
  playHaptic("tap");
}

const initialProgress = loadLetterProgress();

export const useLetterStore = create<LetterStore>((set, get) => ({
  round: null,
  index: 0,
  answered: false,
  correct: false,
  wrongChoices: [],
  filled: [],
  wrongLetters: [],
  progress: initialProgress,
  finished: false,
  start: () => startRound(set, get),
  choose: (letter) => choose(set, get, letter),
  submitTrain: (letter) => submitTrain(set, get, letter),
  next: () => nextQuestion(set, get),
}));
