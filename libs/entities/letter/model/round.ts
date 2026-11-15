import { shuffledIndexes } from "@shared/lib";
import {
  CONFUSION_GROUPS,
  LETTER_BY_ID,
  LETTER_ORDER,
  TRAIN_WORDS,
  WORDS,
  WORDS_BY_LETTER,
} from "./data";
import { createEmptyProgressMap, dueLetters, todayIso } from "./progress";
import type {
  JachtQuestion,
  KlankPosition,
  KlankQuestion,
  LeesQuestion,
  LetterId,
  LetterProgressMap,
  LetterQuestion,
  LetterRound,
  LetterWord,
  PlekQuestion,
  TreinQuestion,
  VangerQuestion,
  ZoemQuestion,
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
 * Kiest leeswoorden voor een leesvraag. Afleiders beginnen bij voorkeur met
 * een andere letter, zodat het kind niet alleen naar de beginletter kan gokken.
 */
function wordChoicesFor(
  target: LetterWord,
  count: number,
  random: () => number,
): readonly LetterWord[] {
  const differentOnset = WORDS.filter(
    (word) => word.id !== target.id && word.letter !== target.letter,
  );
  const pool =
    differentOnset.length >= count - 1
      ? differentOnset
      : WORDS.filter((word) => word.id !== target.id);
  const distractors = shuffle(pool, random).slice(0, count - 1);

  return shuffle([target, ...distractors], random);
}

function buildLees(id: string, target: LetterWord, random: () => number): LeesQuestion {
  return {
    kind: "lees",
    id,
    target,
    choices: wordChoicesFor(target, 3, random),
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

  return { lesson: "letters", questions, newLetters: focus };
}

/**
 * Bouwt een Woordlezen-ronde: zes verschillende woorden, elk met drie
 * geschreven opties. De leerkracht of ouder hoeft niets in te stellen.
 */
export function createWordRound(random: () => number = Math.random): LetterRound {
  const targets = shuffle(WORDS, random).slice(0, ROUND_SIZE);
  const questions = targets.map<LeesQuestion>((word, index) =>
    buildLees(`q${index + 1}`, word, random),
  );

  if (questions.length !== ROUND_SIZE) {
    throw new Error("Woordlezen heeft een onverwachte lengte");
  }

  return { lesson: "woorden", questions, newLetters: [] };
}

/**
 * Bouwt een Woordtrein-ronde: zes woorden bouwen uit losse letters. Dit is de
 * stap van woorden herkennen naar zelf decoderen (synthese).
 */
export function createTrainRound(random: () => number = Math.random): LetterRound {
  const words = shuffle(TRAIN_WORDS, random).slice(0, ROUND_SIZE);
  const questions = words.map<TreinQuestion>((word, index) =>
    buildTrein(`q${index + 1}`, word, random),
  );

  if (questions.length !== ROUND_SIZE) {
    throw new Error("Woordtrein heeft een onverwachte lengte");
  }

  return { lesson: "trein", questions, newLetters: [] };
}

/**
 * Woorden met drie unieke letters. Daardoor is de plek van elke klank
 * eenduidig: begin, midden of eind.
 */
const POSITION_WORDS = WORDS.filter(
  (word) => word.letters.length === 3 && new Set(word.letters).size === word.letters.length,
);

const POSITION_PATTERN: readonly KlankPosition[] = [
  "begin",
  "midden",
  "eind",
  "begin",
  "midden",
  "eind",
];

function letterAtPosition(word: LetterWord, position: KlankPosition): LetterId {
  const index = position === "begin" ? 0 : position === "midden" ? 1 : word.letters.length - 1;
  const letter = word.letters[index];
  if (!letter) {
    throw new Error(`Geen letter op plek ${position} in ${word.word}`);
  }
  return letter;
}

function buildPlek(id: string, word: LetterWord, position: KlankPosition): PlekQuestion {
  return {
    kind: "plek",
    id,
    word,
    target: letterAtPosition(word, position),
    position,
  };
}

/**
 * Bouwt een Klankplek-ronde: het kind hoort een woord en bepaalt waar de
 * gevraagde klank zit. Twee vragen per positie, zodat begin, midden en eind
 * alle drie aan bod komen.
 */
export function createPlekRound(random: () => number = Math.random): LetterRound {
  const words = shuffle(POSITION_WORDS, random).slice(0, ROUND_SIZE);
  const positions = shuffle(POSITION_PATTERN, random);
  const questions = words.map<PlekQuestion>((word, index) =>
    buildPlek(`q${index + 1}`, word, positions[index] ?? "begin"),
  );

  if (questions.length !== ROUND_SIZE) {
    throw new Error("Klankplek heeft een onverwachte lengte");
  }

  return { lesson: "klankplek", questions, newLetters: [] };
}

/**
 * Bouwt een Zoemlees-ronde: zes woorden die het kind ziet en letter voor
 * letter verklaakt. De letterklanken zijn het model; daarna klinkt het woord.
 */
export function createZoomRound(random: () => number = Math.random): LetterRound {
  const words = shuffle(TRAIN_WORDS, random).slice(0, ROUND_SIZE);
  const questions = words.map<ZoemQuestion>((word, index) => ({
    kind: "zoem",
    id: `q${index + 1}`,
    word,
  }));

  if (questions.length !== ROUND_SIZE) {
    throw new Error("Zoemlees heeft een onverwachte lengte");
  }

  return { lesson: "zoemlees", questions, newLetters: [] };
}
