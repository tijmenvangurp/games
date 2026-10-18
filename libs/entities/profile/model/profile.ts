import { LEGACY_PROFILE_ID, isProfileId } from "@shared/lib";

export const MAX_PROFILES = 4;
export const PROFILE_NAME_MAX_LENGTH = 16;
const PROFILE_STATE_VERSION = 1;
export const PROFILE_EXPORT_SCHEMA_VERSION = 1;

export const PROFILE_AVATARS = [
  { id: "bear", emoji: "🐻", label: "Beer" },
  { id: "fox", emoji: "🦊", label: "Vos" },
  { id: "panda", emoji: "🐼", label: "Panda" },
  { id: "frog", emoji: "🐸", label: "Kikker" },
  { id: "cat", emoji: "🐱", label: "Kat" },
  { id: "unicorn", emoji: "🦄", label: "Eenhoorn" },
  { id: "octopus", emoji: "🐙", label: "Octopus" },
  { id: "turtle", emoji: "🐢", label: "Schildpad" },
] as const;

export type ProfileAvatarId = (typeof PROFILE_AVATARS)[number]["id"];

export const DEFAULT_PROFILE_AVATAR: ProfileAvatarId = "bear";
const DEFAULT_PROFILE_NAME = "Speler 1";

export interface Profile {
  readonly id: string;
  readonly name: string;
  readonly avatar: ProfileAvatarId;
  readonly createdAt: string;
}

export interface ProfileState {
  readonly version: typeof PROFILE_STATE_VERSION;
  readonly activeProfileId: string;
  /** Next id number, so deleted profile ids are never reused. */
  readonly nextProfileNumber: number;
  readonly profiles: readonly Profile[];
}

export type ProfileGameData = Record<string, Record<string, unknown>>;

export interface ExportedProfile extends Profile {
  readonly games: ProfileGameData;
}

export interface ProfileExportFile {
  readonly schemaVersion: typeof PROFILE_EXPORT_SCHEMA_VERSION;
  readonly exportedAt: string;
  readonly activeProfileId: string;
  readonly profiles: readonly ExportedProfile[];
}

function isProfileAvatar(value: unknown): value is ProfileAvatarId {
  return typeof value === "string" && PROFILE_AVATARS.some((avatar) => avatar.id === value);
}

export function avatarFor(id: ProfileAvatarId): (typeof PROFILE_AVATARS)[number] {
  return PROFILE_AVATARS.find((avatar) => avatar.id === id) ?? PROFILE_AVATARS[0];
}

function normalizeProfileName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const name = value.trim();
  return name.length > 0 && name.length <= PROFILE_NAME_MAX_LENGTH ? name : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isSafeRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && Object.keys(value).every((key) => !FORBIDDEN_KEYS.has(key));
}

function readProfile(value: unknown): Profile | null {
  if (!isRecord(value) || !isProfileId(value.id)) {
    return null;
  }
  const name = normalizeProfileName(value.name);
  if (!name || !isProfileAvatar(value.avatar)) {
    return null;
  }
  if (typeof value.createdAt !== "string" || value.createdAt.length === 0) {
    return null;
  }
  return {
    id: value.id,
    name,
    avatar: value.avatar,
    createdAt: value.createdAt,
  };
}

export function createInitialProfileState(now: string = new Date().toISOString()): ProfileState {
  return {
    version: PROFILE_STATE_VERSION,
    activeProfileId: LEGACY_PROFILE_ID,
    nextProfileNumber: 2,
    profiles: [
      {
        id: LEGACY_PROFILE_ID,
        name: DEFAULT_PROFILE_NAME,
        avatar: DEFAULT_PROFILE_AVATAR,
        createdAt: now,
      },
    ],
  };
}

function readProfileList<T extends Profile>(
  value: Record<string, unknown>,
  read: (candidate: unknown) => T | null,
): T[] | null {
  if (
    !Array.isArray(value.profiles) ||
    value.profiles.length < 1 ||
    value.profiles.length > MAX_PROFILES ||
    typeof value.activeProfileId !== "string"
  ) {
    return null;
  }

  const profiles: T[] = [];
  const ids = new Set<string>();
  for (const candidate of value.profiles) {
    const profile = read(candidate);
    if (!profile || ids.has(profile.id)) {
      return null;
    }
    ids.add(profile.id);
    profiles.push(profile);
  }

  return ids.has(value.activeProfileId) ? profiles : null;
}

export function parseProfileState(value: unknown): ProfileState | null {
  const activeProfileId = isRecord(value) ? value.activeProfileId : undefined;
  if (
    !isRecord(value) ||
    value.version !== PROFILE_STATE_VERSION ||
    !isProfileId(activeProfileId) ||
    typeof value.nextProfileNumber !== "number" ||
    !Number.isInteger(value.nextProfileNumber) ||
    value.nextProfileNumber < 2
  ) {
    return null;
  }

  const profiles = readProfileList(value, readProfile);
  if (!profiles) {
    return null;
  }

  const largestId = Math.max(...profiles.map((profile) => Number(profile.id.slice(1))));
  if (value.nextProfileNumber <= largestId) {
    return null;
  }

  return {
    version: PROFILE_STATE_VERSION,
    activeProfileId,
    nextProfileNumber: value.nextProfileNumber,
    profiles,
  };
}

export interface NewProfileInput {
  readonly name: string;
  readonly avatar: ProfileAvatarId;
  readonly createdAt?: string;
}

export function createProfile(
  state: ProfileState,
  input: NewProfileInput,
  now: string = new Date().toISOString(),
): ProfileState | null {
  if (state.profiles.length >= MAX_PROFILES) {
    return null;
  }
  const name = normalizeProfileName(input.name);
  if (!name || !isProfileAvatar(input.avatar)) {
    return null;
  }

  const id = `p${state.nextProfileNumber}`;
  if (state.profiles.some((profile) => profile.id === id)) {
    return null;
  }

  return {
    ...state,
    activeProfileId: id,
    nextProfileNumber: state.nextProfileNumber + 1,
    profiles: [
      ...state.profiles,
      { id, name, avatar: input.avatar, createdAt: input.createdAt ?? now },
    ],
  };
}

export function selectProfile(state: ProfileState, id: string): ProfileState | null {
  if (!state.profiles.some((profile) => profile.id === id)) {
    return null;
  }
  return { ...state, activeProfileId: id };
}

export function removeProfile(state: ProfileState, id: string): ProfileState | null {
  if (state.profiles.length <= 1 || !state.profiles.some((profile) => profile.id === id)) {
    return null;
  }
  const profiles = state.profiles.filter((profile) => profile.id !== id);
  const activeProfileId =
    state.activeProfileId === id ? (profiles[0]?.id ?? LEGACY_PROFILE_ID) : state.activeProfileId;
  return { ...state, activeProfileId, profiles };
}

const EXPORT_GAME_KEY_PATTERN = /^games\.[a-z0-9-]+\.v\d+$/;

function readExportedProfile(value: unknown): ExportedProfile | null {
  const profile = readProfile(value);
  if (!profile || !isRecord(value) || !isSafeRecord(value.games)) {
    return null;
  }

  const games: ProfileGameData = {};
  for (const [key, game] of Object.entries(value.games)) {
    if (!EXPORT_GAME_KEY_PATTERN.test(key) || !isSafeRecord(game)) {
      return null;
    }
    games[key] = game;
  }

  return { ...profile, games };
}

export function parseProfileExport(value: unknown): ProfileExportFile | null {
  const activeProfileId = isRecord(value) ? value.activeProfileId : undefined;
  if (
    !isRecord(value) ||
    value.schemaVersion !== PROFILE_EXPORT_SCHEMA_VERSION ||
    typeof value.exportedAt !== "string" ||
    value.exportedAt.length === 0 ||
    !isProfileId(activeProfileId)
  ) {
    return null;
  }

  const profiles = readProfileList(value, readExportedProfile);
  if (!profiles) {
    return null;
  }

  return {
    schemaVersion: PROFILE_EXPORT_SCHEMA_VERSION,
    exportedAt: value.exportedAt,
    activeProfileId,
    profiles,
  };
}

export function profileStateFromExport(file: ProfileExportFile): ProfileState {
  const largestId = Math.max(...file.profiles.map((profile) => Number(profile.id.slice(1))));
  return {
    version: PROFILE_STATE_VERSION,
    activeProfileId: file.activeProfileId,
    nextProfileNumber: largestId + 1,
    profiles: file.profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      createdAt: profile.createdAt,
    })),
  };
}
