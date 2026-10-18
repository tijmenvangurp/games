export type FrenchKind = "word" | "phrase";
export type FrenchLevel = "A1.1" | "A1.2";
export type FrenchThemeId = "animaux";

export interface FrenchItem {
  /** Stable id; also used for the audio filename. */
  id: string;
  /** What the player reads after answering. */
  fr: string;
  /** What TTS should say; defaults to `fr`. */
  audioText?: string;
  /** Primary Dutch translation. */
  nl: string;
  /** Alternative translations, only used on flashcards. */
  nlAlt?: readonly string[];
  kind: FrenchKind;
  theme: FrenchThemeId;
  level: FrenchLevel;
  emoji?: string;
  /** Short explanation shown after the answer. */
  note?: string;
  /** Curated Dutch distractors for phrase questions. */
  distractors?: readonly string[];
  /** Only reviewed items are included in the quiz and audio pipeline. */
  reviewed: boolean;
}

export interface FrenchLesson {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  level: FrenchLevel;
  items: readonly FrenchItem[];
}
