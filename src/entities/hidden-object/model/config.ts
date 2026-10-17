import type { BadgeKind, DecorationKind, SeekDifficulty, SeekTheme } from "./types";

export const SCENE_SIZE = 1000;
export const SCENE_MARGIN = 56;

interface SeekConfig {
  columns: number;
  creatureScale: number;
  decorations: number;
}

export const SEEK_CONFIG: Record<SeekDifficulty, SeekConfig> = {
  makkelijk: { columns: 5, creatureScale: 0.78, decorations: 12 },
  gemiddeld: { columns: 7, creatureScale: 0.7, decorations: 22 },
  moeilijk: { columns: 9, creatureScale: 0.62, decorations: 34 },
};

export const BODY_COLORS = [
  "#7dd3fc",
  "#f9a8d4",
  "#fcd34d",
  "#86efac",
  "#c4b5fd",
  "#fdba74",
] as const;

export const HAT_COLORS = [
  "#ef4444",
  "#0ea5e9",
  "#22c55e",
  "#a855f7",
  "#f97316",
  "#14b8a6",
] as const;

export const BELLY_COLORS = ["#ffffff", "#fef3c7", "#e0f2fe", "#fce7f3"] as const;

export const TARGET_BADGE: BadgeKind = "star";

export const DECOY_BADGES: readonly BadgeKind[] = ["heart", "moon", "drop", "bolt", "flower"];

export const THEME_DECORATIONS: Record<
  SeekTheme,
  { kinds: readonly DecorationKind[]; colors: readonly string[] }
> = {
  tuin: {
    kinds: ["flower", "leaf", "star"],
    colors: ["#86efac", "#f9a8d4", "#fde68a", "#a7f3d0"],
  },
  onderwater: {
    kinds: ["bubble", "shell", "leaf"],
    colors: ["#7dd3fc", "#bae6fd", "#99f6e4", "#c7d2fe"],
  },
};
