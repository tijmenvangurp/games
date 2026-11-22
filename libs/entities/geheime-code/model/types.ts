export const THEMES = ["sinterklaas", "tuin", "onderwater"] as const;

export type ThemeId = (typeof THEMES)[number];

export const LEVELS = [1, 2, 3] as const;

export type LevelId = (typeof LEVELS)[number];

export type ToneId = "indigo" | "green" | "orange" | "pink" | "violet" | "blue";

export interface CodeSymbol {
  readonly id: string;
  /** Nederlandse naam voor de schermlezer en de symbolensheet. */
  readonly name: string;
  readonly tone: ToneId;
}

export interface WordSet {
  readonly id: string;
  readonly theme: ThemeId;
  readonly level: LevelId;
  /** Twee rondes per thema en niveau. */
  readonly round: 1 | 2;
  readonly words: readonly string[];
}

export interface CodeTableCell {
  readonly letter: string;
  readonly symbolId: string;
}

export interface CodeWordCell {
  readonly letter: string;
  readonly symbolId: string;
}

export interface CodeWordRow {
  readonly word: string;
  readonly cells: readonly CodeWordCell[];
}

export interface Puzzle {
  readonly theme: ThemeId;
  readonly level: LevelId;
  readonly round: 1 | 2;
  readonly set: WordSet;
  /** In weergavevolgorde: op niveau 1 vast, daarna geschud. */
  readonly table: readonly CodeTableCell[];
  readonly rows: readonly CodeWordRow[];
}

export interface RoundResult {
  readonly theme: ThemeId;
  readonly level: LevelId;
  readonly round: 1 | 2;
  readonly firstTry: number;
  readonly total: number;
}

export interface Attempt extends RoundResult {
  readonly at: number;
}

export interface Progress {
  /** Beste aantal woorden in één keer, per thema en niveau. */
  readonly best: Readonly<Record<string, number>>;
  /** Begrensd lokaal log, laatste pogingen achteraan. */
  readonly log: readonly Attempt[];
}
