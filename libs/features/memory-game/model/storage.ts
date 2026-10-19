import { MEMORY_DIFFICULTIES, type MemoryDifficulty } from "@entities/memory";
import { GAME_STORAGE_KEYS, profileStorageKey, writeGameProgress } from "@shared/lib";
import { DEFAULT_MEMORY_SETTINGS, type MemorySettings } from "./settings";

const STORAGE_KEY = GAME_STORAGE_KEYS.memory;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isMemoryDifficulty(value: unknown): value is MemoryDifficulty {
  return typeof value === "string" && (MEMORY_DIFFICULTIES as readonly string[]).includes(value);
}

export function loadMemorySettings(profileId?: string): MemorySettings {
  try {
    const raw = localStorage.getItem(profileStorageKey(STORAGE_KEY, profileId));
    if (!raw) {
      return DEFAULT_MEMORY_SETTINGS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isMemoryDifficulty(parsed.difficulty)) {
      return DEFAULT_MEMORY_SETTINGS;
    }
    return { difficulty: parsed.difficulty };
  } catch {
    return DEFAULT_MEMORY_SETTINGS;
  }
}

export function saveMemorySettings(settings: MemorySettings, profileId?: string): void {
  writeGameProgress(STORAGE_KEY, "memory", settings, profileId);
}
