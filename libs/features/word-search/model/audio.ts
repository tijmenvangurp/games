import { WORD_SEARCH_WORDS } from "@entities/word-search";
import type { SpeechGroup, SpeechLine } from "@shared/lib";

const FOLDER = "words";

function line(id: string, text: string): SpeechLine {
  return { folder: FOLDER, id, text };
}

const DUTCH_WORDS = [...new Set([...WORD_SEARCH_WORDS.tuin, ...WORD_SEARCH_WORDS.onderwater])];

const WORD_LINES = new Map<string, SpeechLine>(
  DUTCH_WORDS.map((word) => [word, line(`word-${word}`, word)]),
);

export const WORD_SEARCH_LINES = {
  instruction: line(
    "word-instruction",
    "Sleep over een woord of tik de eerste en de laatste letter.",
  ),
  lastLetter: line("word-last-letter", "Kies de laatste letter."),
  wrong: line("word-wrong", "Die niet — probeer een andere lijn."),
  complete: line("word-complete", "Alle woorden gevonden!"),
  found: line("word-found", "gevonden"),
} as const;

export function wordSpeech(word: string): SpeechLine | null {
  return WORD_LINES.get(word) ?? null;
}

export function wordFoundSpeech(word: string): readonly SpeechLine[] {
  const speech = wordSpeech(word);
  return speech ? [speech, WORD_SEARCH_LINES.found] : [WORD_SEARCH_LINES.found];
}

export interface WordSearchFeedback {
  readonly key: string;
  readonly text: string;
  readonly lines: readonly SpeechLine[];
}

interface FeedbackInput {
  readonly puzzleId: string;
  readonly complete: boolean;
  readonly wrong: boolean;
  readonly selectedCount: number;
  readonly lastFound: string | null;
}

/**
 * Eén prioriteit voor de zichtbare status en de spraak. Zo spreekt “gevonden”
 * niet tegelijk met de algemene instructie.
 */
export function wordSearchFeedbackSpeech({
  puzzleId,
  complete,
  wrong,
  selectedCount,
  lastFound,
}: FeedbackInput): WordSearchFeedback {
  if (complete) {
    return {
      key: `word-complete-${puzzleId}`,
      text: WORD_SEARCH_LINES.complete.text,
      lines: [WORD_SEARCH_LINES.complete],
    };
  }
  if (lastFound) {
    return {
      key: `word-found-${puzzleId}-${lastFound}`,
      text: `${lastFound} gevonden`,
      lines: wordFoundSpeech(lastFound),
    };
  }
  if (wrong) {
    return {
      key: `word-wrong-${puzzleId}`,
      text: WORD_SEARCH_LINES.wrong.text,
      lines: [WORD_SEARCH_LINES.wrong],
    };
  }
  if (selectedCount === 1) {
    return {
      key: `word-last-${puzzleId}`,
      text: WORD_SEARCH_LINES.lastLetter.text,
      lines: [WORD_SEARCH_LINES.lastLetter],
    };
  }
  return {
    key: `word-instruction-${puzzleId}`,
    text: WORD_SEARCH_LINES.instruction.text,
    lines: [WORD_SEARCH_LINES.instruction],
  };
}

export const speechGroups = [
  {
    folder: FOLDER,
    lines: [...WORD_LINES.values(), ...Object.values(WORD_SEARCH_LINES)],
  },
] satisfies readonly SpeechGroup[];
