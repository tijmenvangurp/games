import { create } from "zustand";
import type { FrenchItem, FrenchLesson } from "@entities/french";
import { createFrenchQuestion, createFrenchQueue, type FrenchQuestion } from "./quiz";
import { useFrenchProgressStore } from "./use-french-progress-store";

interface FrenchQuizStore {
  lesson: FrenchLesson | null;
  pool: FrenchItem[];
  queue: FrenchItem[];
  index: number;
  question: FrenchQuestion | null;
  selected: string | null;
  answered: boolean;
  correctCount: number;
  finished: boolean;
  start: (lesson: FrenchLesson, pool?: readonly FrenchItem[]) => void;
  answer: (option: string) => void;
  next: () => void;
  reset: () => void;
}

function questionFor(
  queue: FrenchItem[],
  index: number,
  pool: readonly FrenchItem[],
): FrenchQuestion | null {
  const item = queue[index];
  return item ? createFrenchQuestion(item, pool) : null;
}

export const useFrenchQuizStore = create<FrenchQuizStore>((set, get) => ({
  lesson: null,
  pool: [],
  queue: [],
  index: 0,
  question: null,
  selected: null,
  answered: false,
  correctCount: 0,
  finished: false,

  start: (lesson, pool = lesson.items) => {
    const progress = useFrenchProgressStore.getState().progress;
    const queue = createFrenchQueue(lesson, { progress });
    const questionPool = [...pool];
    set({
      lesson,
      pool: questionPool,
      queue,
      index: 0,
      question: questionFor(queue, 0, questionPool),
      selected: null,
      answered: false,
      correctCount: 0,
      finished: queue.length === 0,
    });
  },

  answer: (option) =>
    set((state) => {
      if (!state.question || state.answered) {
        return {};
      }
      return {
        selected: option,
        answered: true,
        correctCount: state.correctCount + (option === state.question.item.nl ? 1 : 0),
      };
    }),

  next: () => {
    const { pool, queue, index } = get();
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      set({ question: null, selected: null, answered: false, finished: true });
      return;
    }
    set({
      index: nextIndex,
      question: questionFor(queue, nextIndex, pool),
      selected: null,
      answered: false,
    });
  },

  reset: () =>
    set({
      lesson: null,
      pool: [],
      queue: [],
      index: 0,
      question: null,
      selected: null,
      answered: false,
      correctCount: 0,
      finished: false,
    }),
}));
