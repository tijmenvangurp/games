import {
  PROFILE_EXPORT_SCHEMA_VERSION,
  createInitialProfileState,
  parseProfileExport,
  parseProfileState,
  profileStateFromExport,
  type ProfileExportFile,
  type ProfileGameData,
  type ProfileState,
} from "@entities/profile";
import {
  GAME_STORAGE_KEY_LIST,
  PROFILE_STORAGE_KEY,
  isProfileNamespaceKey,
  profileStorageKey,
} from "@shared/lib";

const KNOWN_GAME_KEYS: ReadonlySet<string> = new Set(GAME_STORAGE_KEY_LIST);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function loadProfileState(): ProfileState {
  try {
    if (typeof localStorage === "undefined") {
      return createInitialProfileState();
    }
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = parseProfileState(JSON.parse(raw));
      if (parsed) {
        return parsed;
      }
    }
  } catch {
    // Fall through to a fresh profile 1.
  }

  const initial = createInitialProfileState();
  saveProfileState(initial);
  return initial;
}

export function saveProfileState(state: ProfileState): void {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode); the in-memory state works.
  }
}

function readGameValue(key: string): Record<string, unknown> | null {
  try {
    if (typeof localStorage === "undefined") {
      return null;
    }
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readProfileGames(profileId: string): ProfileGameData {
  const games: ProfileGameData = {};
  for (const baseKey of GAME_STORAGE_KEY_LIST) {
    const value = readGameValue(profileStorageKey(baseKey, profileId));
    if (value) {
      games[baseKey] = value;
    }
  }
  return games;
}

export function readProfileExport(now: string = new Date().toISOString()): ProfileExportFile {
  const state = loadProfileState();
  return {
    schemaVersion: PROFILE_EXPORT_SCHEMA_VERSION,
    exportedAt: now,
    activeProfileId: state.activeProfileId,
    profiles: state.profiles.map((profile) => ({
      ...profile,
      games: readProfileGames(profile.id),
    })),
  };
}

export function exportProfilesJson(now?: string): string {
  return JSON.stringify(readProfileExport(now), null, 2);
}

/**
 * Rejects unknown game keys instead of writing them. This keeps an import
 * from a different app or a newer schema from touching unrelated storage.
 */
export function validateProfileExport(value: unknown): ProfileExportFile | null {
  const file = parseProfileExport(value);
  if (!file) {
    return null;
  }

  for (const profile of file.profiles) {
    for (const key of Object.keys(profile.games)) {
      if (!KNOWN_GAME_KEYS.has(key)) {
        return null;
      }
    }
  }

  return file;
}

function writeProfileGames(profileId: string, games: ProfileGameData): void {
  for (const baseKey of GAME_STORAGE_KEY_LIST) {
    const value = games[baseKey];
    const key = profileStorageKey(baseKey, profileId);
    try {
      if (value) {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // Storage may be unavailable; other keys are still attempted.
    }
  }
}

export function clearProfileGames(profileId: string): void {
  for (const baseKey of GAME_STORAGE_KEY_LIST) {
    try {
      localStorage.removeItem(profileStorageKey(baseKey, profileId));
    } catch {
      // Storage may be unavailable; nothing to clear.
    }
  }
}

function clearAllProfileGames(): void {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }

    for (const baseKey of GAME_STORAGE_KEY_LIST) {
      localStorage.removeItem(baseKey);
    }

    const namespacedKeys: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && isProfileNamespaceKey(key)) {
        namespacedKeys.push(key);
      }
    }
    for (const key of namespacedKeys) {
      localStorage.removeItem(key);
    }
  } catch {
    // Storage may be unavailable; the caller keeps the previous state.
  }
}

/**
 * Validates the whole file before writing anything. The device-wide sound
 * preference is intentionally left untouched.
 */
export function importProfiles(value: unknown): ProfileState | null {
  const file = validateProfileExport(value);
  if (!file) {
    return null;
  }

  const state = profileStateFromExport(file);
  clearAllProfileGames();
  for (const profile of file.profiles) {
    writeProfileGames(profile.id, profile.games);
  }
  saveProfileState(state);
  return state;
}

export function importProfilesJson(text: string): ProfileState | null {
  try {
    return importProfiles(JSON.parse(text) as unknown);
  } catch {
    return null;
  }
}
