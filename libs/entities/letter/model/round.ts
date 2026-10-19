import { shuffledIndexes } from "@shared/lib";
import { CONFUSION_GROUPS, LETTER_BY_ID, LETTER_ORDER, TRAIN_WORDS, WORDS_BY_LETTER } from "./data";
import { createEmptyProgressMap, dueLetters, todayIso } from "./progress";
import type {
  JachtQuestion,
  KlankQuestion,
  LetterId,
  LetterProgressMap,
  LetterQuestion,
  LetterRound,
  LetterWord,
  TreinQuestion,
  VangerQuestion,
} from "./types";

const ROUND_SIZE = 6;

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  return shuffledIndexes(items.length, random).map((index) => items[index]);
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function choicesFor(target: LetterId, count: number, random: () => number): readonly LetterId[] {
  const family = CONFUSION_GROUPS.find((group) => group.includes(target)) ?? [];
  const close = family.filter((letter) => letter !== target);
  const rest = LETTER_ORDER.filter((letter) => letter !== target && !close.includes(letter));
  const distractors = [...shuffle(close, random), ...shuffle(rest, random)].slice(0, count - 1);

  return shuffle([target, ...distractors], random);
}

function wordForLetter(letter: LetterId, random: () => number): LetterWord {
  const words = WORDS_BY_LETTER[letter];
  const word = words[0];
  if (!word) {
    throw new Error(`Geen woord voor letter ${letter}`);
  }
  return pick(words, random);
}

function trainWordFor(
  target: LetterId,
  introduced: ReadonlySet<LetterId>,
  random: () => number,
): LetterWord | null {
  const candidates = TRAIN_WORDS.filter((word) =>
    word.letters.every((letter) => introduced.has(letter)),
  );
  if (candidates.length === 0) {
    return null;
  }

  const preferred = candidates.filter((word) => word.letters.includes(target));
  return pick(preferred.length > 0 ? preferred : candidates, random);
}

function buildKlank(id: string, target: LetterId, random: () => number): KlankQuestion {
  return {
    kind: "klank",
    id,
    target,
    sound: LETTER_BY_ID[target].sound,
    choices: choicesFor(target, 3, random),
  };
}

function buildVanger(id: string, target: LetterId, random: () => number): VangerQuestion {
  return {
    kind: "vanger",
    id,
    target,
    word: wordForLetter(target, random),
    choices: choicesFor(target, 3, random),
  };
}

function buildJacht(id: string, target: LetterId, random: () => number): JachtQuestion {
  return {
    kind: "jacht",
    id,
    target,
    choices: choicesFor(target, Math.min(6, LETTER_ORDER.length), random),
  };
}

function buildTrein(id: string, word: LetterWord, random: () => number): TreinQuestion {
  const extra = pick(
    LETTER_ORDER.filter((letter) => !word.letters.includes(letter)),
    random,
  );

  return {
    kind: "trein",
    id,
    target: word.letter,
    word,
    tiles: shuffle([...word.letters, extra], random),
  };
}

/**
 * Bouwt een korte Letterronde: twee nieuwe letters, daarna herhaling in
 * wisselende vormen. De woordtrein verschijnt alleen als alle letters van het
 * woord al zijn geïntroduceerd.
 */
export function createLetterRound(
  progress: LetterProgressMap = createEmptyProgressMap(),
  random: () => number = Math.random,
  today = todayIso(),
): LetterRound {
  const unseen = LETTER_ORDER.filter((letter) => progress[letter].attempts === 0);
  const due = dueLetters(progress, today).filter((letter) => !unseen.includes(letter));
  const rest = LETTER_ORDER.filter((letter) => !unseen.includes(letter) && !due.includes(letter));
  const review = [...shuffle(due, random), ...shuffle(rest, random)];
  const focus = unseen.length > 0 ? unseen.slice(0, 2) : review.slice(0, 1);

  const first = focus[0] ?? LETTER_ORDER[0];
  const second = focus[1] ?? review[0] ?? first;
  const third = review[0] ?? first;
  const fourth = review[1] ?? second;
  const fifth = review[2] ?? third;
  const sixth = review[3] ?? fourth;

  const introduced = new Set<LetterId>([
    ...focus,
    ...LETTER_ORDER.filter((letter) => progress[letter].attempts > 0),
  ]);
  const trainWord = trainWordFor(fifth, introduced, random);

  const questions: LetterQuestion[] = [
    buildKlank("q1", first, random),
    buildVanger("q2", second, random),
    buildJacht("q3", first, random),
    buildKlank("q4", third, random),
    trainWord ? buildTrein("q5", trainWord, random) : buildVanger("q5", fifth, random),
    buildJacht("q6", sixth, random),
  ];

  if (questions.length !== ROUND_SIZE) {
    throw new Error("Letterronde heeft een onverwachte lengte");
  }

  return { questions, newLetters: focus };
}
