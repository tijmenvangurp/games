import { useState } from "react";
import type { FrenchItem, FrenchLesson } from "@entities/french";
import { playSound } from "@shared/lib";
import { createSentencePuzzle, isSentenceCorrect, type SentenceToken } from "./sentence";
import { useFrenchProgressStore } from "./use-french-progress-store";

export interface SentenceBuilderState {
  phrases: readonly FrenchItem[];
  item: FrenchItem | undefined;
  index: number;
  available: SentenceToken[];
  selected: SentenceToken[];
  answered: boolean;
  correct: boolean;
  score: number;
  finished: boolean;
  choose: (token: SentenceToken) => void;
  remove: (token: SentenceToken) => void;
  check: () => void;
  next: () => void;
  restart: () => void;
  resetPuzzle: () => void;
}

export function useSentenceBuilder(lesson: FrenchLesson): SentenceBuilderState {
  const phrases = lesson.items.filter((item) => item.kind === "phrase" && item.reviewed);
  const [index, setIndex] = useState(0);
  const [available, setAvailable] = useState<SentenceToken[]>(() =>
    phrases[0] ? createSentencePuzzle(phrases[0]) : [],
  );
  const [selected, setSelected] = useState<SentenceToken[]>([]);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(phrases.length === 0);
  const item = phrases[index];

  const startPuzzle = (nextIndex: number) => {
    const next = phrases[nextIndex];
    setIndex(nextIndex);
    setAvailable(next ? createSentencePuzzle(next) : []);
    setSelected([]);
    setAnswered(false);
    setCorrect(false);
  };

  const restart = () => {
    setScore(0);
    setFinished(false);
    startPuzzle(0);
  };

  const choose = (token: SentenceToken) => {
    if (answered) {
      return;
    }
    setAvailable((tokens) => tokens.filter((candidate) => candidate.id !== token.id));
    setSelected((tokens) => [...tokens, token]);
  };

  const remove = (token: SentenceToken) => {
    if (answered) {
      return;
    }
    setSelected((tokens) => tokens.filter((candidate) => candidate.id !== token.id));
    setAvailable((tokens) => [...tokens, token]);
  };

  const check = () => {
    if (!item) {
      return;
    }
    const isCorrect = isSentenceCorrect(selected, item);
    setAnswered(true);
    setCorrect(isCorrect);
    if (isCorrect) {
      setScore((value) => value + 1);
    }
    useFrenchProgressStore.getState().record(item.id, isCorrect);
    if (isCorrect) {
      playSound("match");
    }
  };

  const next = () => {
    if (index + 1 >= phrases.length) {
      setFinished(true);
      return;
    }
    startPuzzle(index + 1);
  };

  return {
    phrases,
    item,
    index,
    available,
    selected,
    answered,
    correct,
    score,
    finished,
    choose,
    remove,
    check,
    next,
    restart,
    resetPuzzle: () => startPuzzle(index),
  };
}
