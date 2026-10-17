import { MEMORY_DIFFICULTIES, type MemoryDifficulty } from "@entities/memory";
import { DEFAULT_MEMORY_SETTINGS, type MemorySettings } from "./settings";

const STORAGE_KEY = "games.memory.v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDifficulty(value: unknown): value is MemoryDifficulty {
  return typeof value === "string" && (MEMORY_DIFFICULTIES as readonly string[]).includes(value);
}

export function loadMemorySettings(): MemorySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_MEMORY_SETTINGS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isDifficulty(parsed.difficulty)) {
      return DEFAULT_MEMORY_SETTINGS;
    }
    return { difficulty: parsed.difficulty };
  } catch {
    return DEFAULT_MEMORY_SETTINGS;
  }
}

export function saveMemorySettings(settings: MemorySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage may be unavailable (private mode); playing still works.
  }
}
