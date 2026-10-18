import type { MemoryDifficulty } from "@entities/memory";

export interface MemorySettings {
  difficulty: MemoryDifficulty;
}

export const DEFAULT_MEMORY_SETTINGS: MemorySettings = {
  difficulty: "gemiddeld",
};

export const MEMORY_DIFFICULTY_OPTIONS = [
  { value: "makkelijk", label: "Makkelijk", hint: "6 paren" },
  { value: "gemiddeld", label: "Gemiddeld", hint: "8 paren" },
  { value: "moeilijk", label: "Moeilijk", hint: "10 paren" },
] as const;
