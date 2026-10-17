export const SEEK_DIFFICULTIES = ["makkelijk", "gemiddeld", "moeilijk"] as const;

export type SeekDifficulty = (typeof SEEK_DIFFICULTIES)[number];

export const SEEK_THEMES = ["tuin", "onderwater"] as const;

export type SeekTheme = (typeof SEEK_THEMES)[number];

export type BadgeKind = "star" | "heart" | "moon" | "drop" | "bolt" | "flower";

export type DecorationKind = "flower" | "leaf" | "bubble" | "shell" | "star";

export interface CreatureColors {
  body: string;
  hat: string;
  belly: string;
}

export interface HiddenCreature {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  colors: CreatureColors;
  badge: BadgeKind;
}

export interface Decoration {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  kind: DecorationKind;
  color: string;
}

export interface SeekScene {
  seed: number;
  difficulty: SeekDifficulty;
  theme: SeekTheme;
  creatures: HiddenCreature[];
  decorations: Decoration[];
  targetId: number;
  /** Radius of the area shown by the hint button. */
  hintRadius: number;
}
