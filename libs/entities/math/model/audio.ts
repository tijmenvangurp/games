import type { SpeechGroup, SpeechLine } from "@shared/lib";
import { dutchNumberWord } from "./number-words";
import type { MathMode, MathQuestion } from "./types";

const FOLDER = "math";

function line(id: string, text: string): SpeechLine {
  return { folder: FOLDER, id, text };
}

const OPERATOR_WORDS: Record<MathMode, string> = {
  plus: "plus",
  min: "min",
  keer: "keer",
  deel: "gedeeld door",
};

const NUMBERS = new Map<number, SpeechLine>();
for (let value = 0; value <= 100; value += 1) {
  NUMBERS.set(value, line(`math-number-${value}`, dutchNumberWord(value)));
}

const OPERATORS: Record<MathMode, SpeechLine> = {
  plus: line("math-plus", OPERATOR_WORDS.plus),
  min: line("math-min", OPERATOR_WORDS.min),
  keer: line("math-keer", OPERATOR_WORDS.keer),
  deel: line("math-deel", OPERATOR_WORDS.deel),
};

/**
 * Bemoedigingen voor een goede som. De reeks schuift per ronde op, zodat een
 * kind binnen één ronde alle varianten hoort en dezelfde som dezelfde regel
 * houdt.
 */
const PRAISE_LINES: readonly SpeechLine[] = [
  line("math-correct", "Goed gerekend!"),
  line("math-praise-knap", "Knap gedaan!"),
  line("math-praise-top", "Top gedaan!"),
  line("math-praise-helemaal", "Helemaal goed!"),
  line("math-praise-slim", "Slim gerekend!"),
  line("math-praise-goedzo", "Goedzo!"),
];

export const MATH_PRAISE_LINES = PRAISE_LINES;

export const MATH_LINES = {
  whatIs: line("math-what-is", "Wat is"),
  answerPrefix: line("math-answer-prefix", "Het juiste antwoord is"),
  almost: line("math-almost", "Bijna! Probeer nog één keer."),
  choose: line("math-choose", "Kies het juiste antwoord."),
} as const;

export function numberSpeech(value: number): SpeechLine {
  const speech = NUMBERS.get(value);
  if (!speech) {
    throw new RangeError(`Geen spraakregel voor ${value}.`);
  }
  return speech;
}

export function operatorSpeech(mode: MathMode): SpeechLine {
  return OPERATORS[mode];
}

/**
 * De bemoediging voor deze som. De seed en het vraagnummer maken de keuze
 * stabiel: bij elke render van dezelfde som klinkt en staat dezelfde regel.
 */
export function praiseSpeech(seed: number, question: MathQuestion): SpeechLine {
  return PRAISE_LINES[(seed + question.id) % PRAISE_LINES.length];
}

/** De gesproken som: “Wat is tien plus vijf?”. */
export function mathQuestionSpeech(question: MathQuestion): readonly SpeechLine[] {
  return [
    MATH_LINES.whatIs,
    numberSpeech(question.left),
    operatorSpeech(question.mode),
    numberSpeech(question.right),
  ];
}

/** Een bemoediging, of “Het juiste antwoord is vijftien.”. */
export function mathFeedbackSpeech(
  question: MathQuestion,
  correct: boolean,
  seed: number,
): readonly SpeechLine[] {
  if (correct) {
    return [praiseSpeech(seed, question)];
  }
  return [MATH_LINES.answerPrefix, numberSpeech(question.answer)];
}

export const speechGroups = [
  {
    folder: FOLDER,
    lines: [
      ...NUMBERS.values(),
      ...Object.values(OPERATORS),
      ...Object.values(MATH_LINES),
      ...PRAISE_LINES,
    ],
  },
] satisfies readonly SpeechGroup[];
