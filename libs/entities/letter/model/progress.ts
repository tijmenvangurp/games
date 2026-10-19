import { LETTER_ORDER } from "./data";
import type { LetterId, LetterProgress, LetterProgressMap, LetterStage } from "./types";

const REVIEW_INTERVALS = [1, 3, 7, 14] as const;

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function createEmptyProgress(): LetterProgress {
  return {
    attempts: 0,
    correct: 0,
    lastSeen: null,
    nextReview: null,
    stage: "nieuw",
  };
}

export function createEmptyProgressMap(): LetterProgressMap {
  return Object.fromEntries(
    LETTER_ORDER.map((letter) => [letter, createEmptyProgress()]),
  ) as Record<LetterId, LetterProgress>;
}

export function stageForCorrect(correct: number): LetterStage {
  if (correct <= 0) {
    return "nieuw";
  }
  if (correct <= 2) {
    return "oefenen";
  }
  if (correct <= 4) {
    return "bijna";
  }
  return "vast";
}

export function intervalForCorrect(correct: number): number {
  const index = Math.min(Math.max(correct, 1), REVIEW_INTERVALS.length) - 1;
  return REVIEW_INTERVALS[index] ?? REVIEW_INTERVALS[0];
}

export function isKnownStage(stage: LetterStage): boolean {
  return stage === "bijna" || stage === "vast";
}

export function knownLetters(progress: LetterProgressMap): readonly LetterId[] {
  return LETTER_ORDER.filter((letter) => isKnownStage(progress[letter].stage));
}

export function dueLetters(progress: LetterProgressMap, today: string): readonly LetterId[] {
  return LETTER_ORDER.filter((letter) => {
    const item = progress[letter];
    return item.attempts === 0 || item.nextReview === null || item.nextReview <= today;
  });
}

/**
 * Verwerkt één antwoord. Alleen een eerste-try goed antwoord telt mee voor de
 * mastery-teller; een fout antwoord komt de volgende dag terug.
 */
export function recordLetterAnswer(
  progress: LetterProgressMap,
  letter: LetterId,
  correct: boolean,
  today = todayIso(),
): LetterProgressMap {
  const current = progress[letter];
  const nextCorrect = current.correct + (correct ? 1 : 0);
  const interval = correct ? intervalForCorrect(nextCorrect) : 1;

  return {
    ...progress,
    [letter]: {
      attempts: current.attempts + 1,
      correct: nextCorrect,
      lastSeen: today,
      nextReview: addDays(today, interval),
      stage: stageForCorrect(nextCorrect),
    },
  };
}
