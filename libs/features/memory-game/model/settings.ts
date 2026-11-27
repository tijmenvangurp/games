import type { AdaptiveState } from "@entities/adaptive";
import { levelIndexForPairs, MEMORY_LEVELS, MEMORY_START_LEVEL } from "@entities/memory";
import type { MemoryTexts } from "./texts";

export type MemoryMode = "auto" | "manual";

export interface MemorySettings {
  mode: MemoryMode;
  /** Level index used when the child chooses a level themselves. */
  manualIndex: number;
  /** The level the automatic controller follows. */
  adaptive: AdaptiveState;
}

const START_INDEX = levelIndexForPairs(MEMORY_START_LEVEL);

export const DEFAULT_MEMORY_SETTINGS: MemorySettings = {
  mode: "auto",
  manualIndex: START_INDEX,
  adaptive: { levelIndex: START_INDEX, streak: 0 },
};

const MODE_EMOJI = { auto: "🌱", manual: "🎚️" } as const;

export function memoryModeOptions(t: MemoryTexts) {
  return (["auto", "manual"] as const).map((value) => ({
    value,
    label: t.modes[value].label,
    hint: t.modes[value].hint,
    emoji: MODE_EMOJI[value],
  }));
}

const LEVEL_EMOJI = ["🐣", "🌱", "🌱", "🌤️", "🌤️", "⚡", "⚡", "🔥", "🔥"] as const;

export function memoryLevelOptions(t: MemoryTexts) {
  return MEMORY_LEVELS.map((pairs, index) => ({
    value: index,
    label: t.levelLabel(pairs),
    hint: t.levelHint(pairs * 2),
    emoji: LEVEL_EMOJI[index] ?? "⚡",
  }));
}

export function currentLevelIndex(settings: MemorySettings): number {
  return settings.mode === "auto" ? settings.adaptive.levelIndex : settings.manualIndex;
}
