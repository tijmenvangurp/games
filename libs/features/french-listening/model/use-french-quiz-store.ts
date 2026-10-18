import { create } from "zustand";
import type { FrenchItem, FrenchLesson } from "@entities/french";
import { createFrenchQuestion, createFrenchQueue, type FrenchQuestion } from "./quiz";

interface FrenchQuizStore {
  lesson: FrenchLesson | null;
  queue: FrenchItem[];
  index: number;
  question: FrenchQuestion | null;
  selected: string | null;
  answered: boolean;
  correctCount: number;
  finished: boolean;
  start: (lesson: FrenchLesson) => void;
  answer: (option: string) => void;
  next: () => void;
  reset: () => void;
}

function questionFor(
  queue: FrenchItem[],
  index: number,
  lesson: FrenchLesson,
): FrenchQuestion | null {
  const item = queue[index];
  return item ? createFrenchQuestion(item, lesson.items) : null;
}

export const useFrenchQuizStore = create<FrenchQuizStore>((set, get) => ({
  lesson: null,
  queue: [],
  index: 0,
  question: null,
  selected: null,
  answered: false,
  correctCount: 0,
  finished: false,

  start: (lesson) => {
    const queue = createFrenchQueue(lesson);
    set({
      lesson,
      queue,
      index: 0,
      question: questionFor(queue, 0, lesson),
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
    const { lesson, queue, index } = get();
    if (!lesson) {
      return;
    }
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      set({ question: null, selected: null, answered: false, finished: true });
      return;
    }
    set({
      index: nextIndex,
      question: questionFor(queue, nextIndex, lesson),
      selected: null,
      answered: false,
    });
  },

  reset: () =>
    set({
      lesson: null,
      queue: [],
      index: 0,
      question: null,
      selected: null,
      answered: false,
      correctCount: 0,
      finished: false,
    }),
}));
