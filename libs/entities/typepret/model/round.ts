import { shuffledIndexes } from "@shared/lib";
import { HINT_AFTER_MISTAKES, RETRY_ACCURACY, ROUND_LENGTH, UNLOCK_ACCURACY } from "./lessons";
import type { Group, Lesson, Round, RoundResult, RoundState, Verdict } from "./types";
import { WORDS } from "./words";

const GROUP_SIZE = 2;

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

/** Twee tekens per groep; minstens één nieuwe toets zolang die er is. */
function drillGroups(lesson: Lesson, random: () => number): Group[] {
  const groups: Group[] = [];
  const groupCount = ROUND_LENGTH / GROUP_SIZE;
  for (let index = 0; index < groupCount; index += 1) {
    const first = lesson.newKeys.length > 0 && index % 2 === 0 ? lesson.newKeys : lesson.keys;
    const second = lesson.newKeys.length > 0 && index % 3 === 0 ? lesson.newKeys : lesson.keys;
    groups.push(pick(first, random) + pick(second, random));
  }
  return groups;
}

function wordPool(lesson: Lesson): readonly string[] {
  const { min, max } = lesson.wordLength ?? { min: 3, max: 5 };
  return WORDS.filter(
    (word) =>
      word.length >= min &&
      word.length <= max &&
      [...word].every((letter) => lesson.keys.includes(letter)),
  );
}

/** Zoekt woorden die samen precies `remaining` letters opleveren. */
function fillWords(
  pool: readonly string[],
  remaining: number,
  random: () => number,
  previous: string,
): string[] | undefined {
  if (remaining === 0) {
    return [];
  }
  for (const index of shuffledIndexes(pool.length, random)) {
    const word = pool[index];
    if (word.length > remaining || word === previous) {
      continue;
    }
    const rest = fillWords(pool, remaining - word.length, random, word);
    if (rest) {
      return [word, ...rest];
    }
  }
  return undefined;
}

function wordGroups(lesson: Lesson, random: () => number): Group[] {
  const pool = wordPool(lesson);
  const words = fillWords(pool, ROUND_LENGTH, random, "");
  if (!words) {
    throw new Error(`Geen woorden die samen ${ROUND_LENGTH} letters geven voor ${lesson.id}`);
  }
  return words;
}

export function createRound(lesson: Lesson, random: () => number): Round {
  const groups =
    lesson.kind === "woorden" ? wordGroups(lesson, random) : drillGroups(lesson, random);
  return { lessonId: lesson.id, groups, targets: [...groups.join("")] };
}

export function startRound(round: Round): RoundState {
  return {
    round,
    index: 0,
    correct: 0,
    errors: 0,
    mistakesOnTarget: 0,
    missed: [],
    finished: round.targets.length === 0,
  };
}

export function currentTarget(state: RoundState): string | undefined {
  return state.round.targets[state.index];
}

/** Hulp-trap: na een paar fouten op hetzelfde doelteken komt de vinger groter in beeld. */
export function needsHint(state: RoundState): boolean {
  return !state.finished && state.mistakesOnTarget >= HINT_AFTER_MISTAKES;
}

/**
 * Verwerkt één toets (`event.key`). Alleen losse tekens tellen; Shift, Backspace
 * en andere functietoetsen doen niets. Hoofdletters tellen als kleine letters.
 */
export function pressKey(state: RoundState, rawKey: string): RoundState {
  const target = currentTarget(state);
  if (state.finished || target === undefined || [...rawKey].length !== 1 || rawKey === " ") {
    return state;
  }

  const key = rawKey.toLowerCase();
  if (key === target) {
    const index = state.index + 1;
    return {
      ...state,
      index,
      correct: state.correct + 1,
      mistakesOnTarget: 0,
      finished: index >= state.round.targets.length,
    };
  }

  // Een herhaalde fout op hetzelfde doelteken telt maar één keer mee.
  const firstMistake = state.mistakesOnTarget === 0;
  return {
    ...state,
    errors: state.errors + (firstMistake ? 1 : 0),
    mistakesOnTarget: state.mistakesOnTarget + 1,
    missed: firstMistake ? [...state.missed, target] : state.missed,
  };
}

export function accuracyOf(state: Pick<RoundState, "correct" | "errors">): number {
  const total = state.correct + state.errors;
  return total === 0 ? 1 : state.correct / total;
}

export function verdictFor(accuracy: number): Verdict {
  if (accuracy >= UNLOCK_ACCURACY) {
    return "ontgrendeld";
  }
  return accuracy < RETRY_ACCURACY ? "nogmaals" : "bijna";
}

export function resultOf(state: RoundState): RoundResult {
  const accuracy = accuracyOf(state);
  return {
    lessonId: state.round.lessonId,
    accuracy,
    verdict: verdictFor(accuracy),
    correct: state.correct,
    errors: state.errors,
    missed: state.missed,
  };
}
