import { create } from "zustand";
import {
  createLetterRound,
  createWordRound,
  recordLetterAnswer,
  type LetterId,
  type LetterLesson,
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
  wrongChoices: readonly string[];
  filled: readonly LetterId[];
  wrongLetters: readonly LetterId[];
  progress: LetterProgressMap;
  finished: boolean;
  start: (lesson?: LetterLesson) => void;
  choose: (answer: string) => void;
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

function startRound(set: StoreSet, get: StoreGet, lesson: LetterLesson = "letters"): void {
  const round = lesson === "woorden" ? createWordRound() : createLetterRound(get().progress);
  set({
    round,
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

function expectedAnswer(question: LetterQuestion): string {
  return question.kind === "lees" ? question.target.id : question.target;
}

/** Woordlezen is oefenen; alleen lettervragen werken de lettervoortgang bij. */
function applyChoiceProgress(
  set: StoreSet,
  get: StoreGet,
  question: LetterQuestion,
  correct: boolean,
): void {
  if (question.kind === "lees") {
    return;
  }
  applyProgress(set, get, question.target, correct);
}

function choose(set: StoreSet, get: StoreGet, answer: string): void {
  const question = currentQuestion(get);
  const { answered, wrongChoices } = get();
  if (!question || question.kind === "trein" || answered) {
    return;
  }

  if (answer === expectedAnswer(question)) {
    set({ answered: true, correct: true });
    applyChoiceProgress(set, get, question, wrongChoices.length === 0);
    playSound("match");
    playHaptic("match");
    return;
  }

  const nextWrong = [...wrongChoices, answer];
  const revealed = nextWrong.length >= 2;
  set({ wrongChoices: nextWrong, answered: revealed, correct: false });
  if (revealed) {
    applyChoiceProgress(set, get, question, false);
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
  start: (lesson) => startRound(set, get, lesson),
  choose: (answer) => choose(set, get, answer),
  submitTrain: (letter) => submitTrain(set, get, letter),
  next: () => nextQuestion(set, get),
}));
