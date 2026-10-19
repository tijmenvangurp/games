export const LETTER_IDS = ["i", "k", "m", "s", "p", "v", "e", "n", "t", "a"] as const;

export type LetterId = (typeof LETTER_IDS)[number];

export type LetterKind = "vowel" | "consonant";

export type LetterLesson = "letters" | "woorden" | "trein";

export interface LetterLessonInfo {
  id: LetterLesson;
  title: string;
  description: string;
}

export type LetterStage = "nieuw" | "oefenen" | "bijna" | "vast";

export interface Letter {
  id: LetterId;
  glyph: string;
  kind: LetterKind;
  /** Pad naar de losse klank (/m/), geen letternaam ("em"). */
  sound: string;
}

export interface LetterWord {
  id: string;
  word: string;
  letter: LetterId;
  letters: readonly LetterId[];
  audio: string;
}

export interface LetterProgress {
  attempts: number;
  correct: number;
  lastSeen: string | null;
  nextReview: string | null;
  stage: LetterStage;
}

export type LetterProgressMap = Record<LetterId, LetterProgress>;

export interface KlankQuestion {
  kind: "klank";
  id: string;
  target: LetterId;
  /** Losse klank van de doelletters. */
  sound: string;
  choices: readonly LetterId[];
}

export interface VangerQuestion {
  kind: "vanger";
  id: string;
  target: LetterId;
  word: LetterWord;
  choices: readonly LetterId[];
}

export interface JachtQuestion {
  kind: "jacht";
  id: string;
  target: LetterId;
  choices: readonly LetterId[];
}

export interface TreinQuestion {
  kind: "trein";
  id: string;
  target: LetterId;
  word: LetterWord;
  tiles: readonly LetterId[];
}

export interface LeesQuestion {
  kind: "lees";
  id: string;
  target: LetterWord;
  choices: readonly LetterWord[];
}

export type LetterQuestion =
  | KlankQuestion
  | VangerQuestion
  | JachtQuestion
  | TreinQuestion
  | LeesQuestion;

export interface LetterRound {
  lesson: LetterLesson;
  questions: readonly LetterQuestion[];
  newLetters: readonly LetterId[];
}
