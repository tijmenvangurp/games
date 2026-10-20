import type { AdaptiveState } from "@entities/adaptive";
import { levelIndexForPairs, MEMORY_LEVELS, MEMORY_START_LEVEL } from "@entities/memory";

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

export const MEMORY_MODE_OPTIONS = [
  {
    value: "auto",
    label: "Groeit mee",
    hint: "De app kiest het aantal paren",
    emoji: "🌱",
  },
  {
    value: "manual",
    label: "Zelf kiezen",
    hint: "Blijf op één niveau",
    emoji: "🎚️",
  },
] as const;

const LEVEL_EMOJI = ["🐣", "🌱", "🌱", "🌤️", "🌤️", "⚡", "⚡", "🔥", "🔥"] as const;

export function memoryLevelOptions() {
  return MEMORY_LEVELS.map((pairs, index) => ({
    value: index,
    label: `${pairs} paren`,
    hint: `${pairs * 2} kaarten`,
    emoji: LEVEL_EMOJI[index] ?? "⚡",
  }));
}

export function currentLevelIndex(settings: MemorySettings): number {
  return settings.mode === "auto" ? settings.adaptive.levelIndex : settings.manualIndex;
}
