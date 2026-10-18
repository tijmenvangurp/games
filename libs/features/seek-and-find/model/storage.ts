import {
  SEEK_DIFFICULTIES,
  SEEK_THEMES,
  type SeekDifficulty,
  type SeekTheme,
} from "@entities/hidden-object";
import { GAME_STORAGE_KEYS, profileStorageKey } from "@shared/lib";
import { DEFAULT_SEEK_SETTINGS, type SeekSettings } from "./settings";

const STORAGE_KEY = GAME_STORAGE_KEYS.seek;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDifficulty(value: unknown): value is SeekDifficulty {
  return typeof value === "string" && (SEEK_DIFFICULTIES as readonly string[]).includes(value);
}

function isTheme(value: unknown): value is SeekTheme {
  return typeof value === "string" && (SEEK_THEMES as readonly string[]).includes(value);
}

export function loadSeekSettings(): SeekSettings {
  try {
    const raw = localStorage.getItem(profileStorageKey(STORAGE_KEY));
    if (!raw) {
      return DEFAULT_SEEK_SETTINGS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isDifficulty(parsed.difficulty) || !isTheme(parsed.theme)) {
      return DEFAULT_SEEK_SETTINGS;
    }
    return { difficulty: parsed.difficulty, theme: parsed.theme };
  } catch {
    return DEFAULT_SEEK_SETTINGS;
  }
}

export function saveSeekSettings(settings: SeekSettings): void {
  try {
    localStorage.setItem(profileStorageKey(STORAGE_KEY), JSON.stringify(settings));
  } catch {
    // Storage may be unavailable (private mode); playing still works.
  }
}
