import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_PROFILES,
  PROFILE_NAME_MAX_LENGTH,
  createInitialProfileState,
  createProfile,
  parseProfileExport,
  parseProfileState,
  removeProfile,
  updateProfile,
} from "@entities/profile";
import { createPlayState, generatePuzzle } from "@entities/sudoku";
import { DEFAULT_MATH_SETTINGS, loadMathState, saveMathState } from "@features/math-trainer";
import {
  exportProfilesJson,
  importProfiles,
  importProfilesJson,
  loadProfileState,
  readProfileExport,
  saveProfileState,
  validateProfileExport,
} from "@features/profile-switcher";
import { DEFAULT_SETTINGS, loadSudokuState, saveSudokuState } from "@features/sudoku-game";
import {
  GAME_STORAGE_KEYS,
  PROFILE_STORAGE_KEY,
  profileStorageKey,
  readActiveProfileId,
} from "@shared/lib";

const NOW = "2026-10-18T12:00:00.000Z";

function twoProfiles() {
  const initial = createInitialProfileState(NOW);
  const state = createProfile(initial, { name: "Sam", avatar: "fox" }, NOW);
  if (!state) {
    throw new Error("Could not create the second profile");
  }
  return { initial, state };
}

interface ExportFixture {
  schemaVersion: number;
  exportedAt: string;
  activeProfileId: string;
  profiles: Array<{
    id: string;
    name: string;
    avatar: string;
    createdAt: string;
    games: Record<string, Record<string, unknown>>;
  }>;
}

function validExport(): ExportFixture {
  return {
    schemaVersion: 1,
    exportedAt: NOW,
    activeProfileId: "p1",
    profiles: [
      {
        id: "p1",
        name: "Speler 1",
        avatar: "bear",
        createdAt: NOW,
        games: {
          "games.math.v1": {
            settings: { mode: "keer", level: "moeilijk" },
            best: { "keer:moeilijk": 8 },
          },
        },
      },
    ],
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("profile storage keys", () => {
  it("keeps profile 1 on the legacy keys", () => {
    expect(profileStorageKey(GAME_STORAGE_KEYS.sudoku)).toBe("games.sudoku.v1");
    expect(profileStorageKey(GAME_STORAGE_KEYS.sudoku, "p1")).toBe("games.sudoku.v1");
    expect(readActiveProfileId()).toBe("p1");
  });

  it("namespaces extra profiles", () => {
    expect(profileStorageKey(GAME_STORAGE_KEYS.sudoku, "p2")).toBe("games.p2.sudoku.v1");
    expect(profileStorageKey(GAME_STORAGE_KEYS.arrows, "p3")).toBe("games.p3.arrows.v2");
  });

  it("follows the persisted active profile", () => {
    const { state } = twoProfiles();
    saveProfileState(state);

    expect(readActiveProfileId()).toBe("p2");
    expect(profileStorageKey(GAME_STORAGE_KEYS.math)).toBe("games.p2.math.v1");
  });

  it("falls back to profile 1 when the preference is corrupt", () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, "{not json");
    expect(readActiveProfileId()).toBe("p1");

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ activeProfileId: "p2" }));
    expect(readActiveProfileId()).toBe("p2");
  });
});

describe("first start and migration", () => {
  it("creates profile 1 without touching existing game keys", () => {
    const play = createPlayState(generatePuzzle(4, "makkelijk", 5));
    play.entries[0] = play.puzzle.solution[0];
    const payload = { play, settings: DEFAULT_SETTINGS };
    localStorage.setItem(GAME_STORAGE_KEYS.sudoku, JSON.stringify(payload));

    const state = loadProfileState();

    expect(state.profiles).toHaveLength(1);
    expect(state.profiles[0]?.id).toBe("p1");
    expect(state.activeProfileId).toBe("p1");
    expect(JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) ?? "null")).toEqual(state);

    const restored = loadSudokuState();
    expect(restored?.play?.entries).toEqual(play.entries);
    expect(restored?.settings).toEqual(DEFAULT_SETTINGS);
    expect(localStorage.getItem(GAME_STORAGE_KEYS.sudoku)).toBe(JSON.stringify(payload));
  });

  it("keeps an existing profile state on reload", () => {
    const { state } = twoProfiles();
    saveProfileState(state);

    expect(loadProfileState()).toEqual(state);
  });
});

describe("profile separation", () => {
  it("writes and reads game state per profile", () => {
    const { initial, state } = twoProfiles();
    saveProfileState(initial);
    saveMathState({
      settings: { mode: "plus", level: "makkelijk" },
      best: { "plus:makkelijk": 4 },
    });

    saveProfileState(state);
    saveMathState({
      settings: { mode: "keer", level: "moeilijk" },
      best: { "keer:moeilijk": 9 },
    });

    expect(localStorage.getItem("games.math.v1")).not.toBeNull();
    expect(localStorage.getItem("games.p2.math.v1")).not.toBeNull();
    expect(loadMathState().settings).toEqual({ mode: "keer", level: "moeilijk" });

    saveProfileState({ ...state, activeProfileId: "p1" });
    expect(loadMathState().settings).toEqual({ mode: "plus", level: "makkelijk" });
    expect(loadMathState().best).toEqual({ "plus:makkelijk": 4 });
  });

  it("keeps a corrupt profile namespace out of the other profile", () => {
    const { initial, state } = twoProfiles();
    saveProfileState(state);
    localStorage.setItem("games.p2.math.v1", "{broken");

    expect(loadMathState()).toEqual({ settings: DEFAULT_MATH_SETTINGS, best: {} });

    saveProfileState({ ...initial, activeProfileId: "p1" });
    expect(loadMathState().settings).toEqual(DEFAULT_MATH_SETTINGS);
  });
});

describe("export and import", () => {
  it("round-trips all profiles and game state", () => {
    const { initial, state } = twoProfiles();
    saveProfileState(initial);
    saveMathState({
      settings: { mode: "deel", level: "gemiddeld" },
      best: { "deel:gemiddeld": 7 },
    });

    saveProfileState(state);
    const play = createPlayState(generatePuzzle(4, "makkelijk", 12));
    saveSudokuState({ play, settings: DEFAULT_SETTINGS });
    localStorage.setItem("games.sound.v1", "off");

    const json = exportProfilesJson(NOW);
    const file = JSON.parse(json) as unknown;
    expect(validateProfileExport(file)).not.toBeNull();
    expect(readProfileExport(NOW).profiles).toHaveLength(2);

    localStorage.clear();
    const imported = importProfiles(file);

    expect(imported).not.toBeNull();
    expect(imported?.profiles.map((profile) => profile.name)).toEqual(["Speler 1", "Sam"]);
    expect(imported?.activeProfileId).toBe("p2");
    expect(loadSudokuState()?.play?.entries).toEqual(play.entries);
    expect(loadMathState().settings).toEqual({ mode: "plus", level: "makkelijk" });

    saveProfileState({ ...imported!, activeProfileId: "p1" });
    expect(loadMathState().settings).toEqual({ mode: "deel", level: "gemiddeld" });
    expect(loadMathState().best).toEqual({ "deel:gemiddeld": 7 });
  });

  it("does not export the device-wide sound preference", () => {
    localStorage.setItem("games.sound.v1", "off");
    const json = exportProfilesJson(NOW);
    expect(json).not.toContain("games.sound.v1");
  });

  it("leaves the sound preference alone on import", () => {
    localStorage.setItem("games.sound.v1", "off");
    expect(importProfiles(validExport())).not.toBeNull();
    expect(localStorage.getItem("games.sound.v1")).toBe("off");
  });

  it("replaces stale profile namespaces and legacy keys", () => {
    localStorage.setItem("games.p2.math.v1", JSON.stringify({ stale: true }));
    localStorage.setItem("games.math.v1", JSON.stringify({ stale: true }));

    expect(importProfiles(validExport())).not.toBeNull();

    expect(localStorage.getItem("games.p2.math.v1")).toBeNull();
    expect(JSON.parse(localStorage.getItem("games.math.v1") ?? "null")).toEqual({
      settings: { mode: "keer", level: "moeilijk" },
      best: { "keer:moeilijk": 8 },
    });
  });

  it("rejects invalid files before writing anything", () => {
    localStorage.setItem("games.math.v1", JSON.stringify({ keep: true }));

    const invalid = [
      null,
      {},
      { ...validExport(), schemaVersion: 2 },
      { ...validExport(), activeProfileId: "p9" },
      { ...validExport(), profiles: [] },
      {
        ...validExport(),
        profiles: [{ ...validExport().profiles[0], avatar: "dragon" }],
      },
      {
        ...validExport(),
        profiles: [{ ...validExport().profiles[0], games: { "games.math.v1": 42 } }],
      },
      {
        ...validExport(),
        profiles: [{ ...validExport().profiles[0], games: { "games.secret.v1": {} } }],
      },
      {
        ...validExport(),
        profiles: [
          { ...validExport().profiles[0], games: { "games.math.v1": {} } },
          {
            ...validExport().profiles[0],
            id: "p1",
          },
        ],
      },
    ];

    for (const candidate of invalid) {
      expect(validateProfileExport(candidate)).toBeNull();
      expect(importProfiles(candidate)).toBeNull();
      expect(JSON.parse(localStorage.getItem("games.math.v1") ?? "null")).toEqual({ keep: true });
    }

    expect(importProfilesJson("{not json")).toBeNull();
    expect(JSON.parse(localStorage.getItem("games.math.v1") ?? "null")).toEqual({ keep: true });
  });

  it("accepts a profile without game state and rejects a missing games object", () => {
    const empty = validExport();
    empty.profiles[0]!.games = {};
    expect(validateProfileExport(empty)).not.toBeNull();

    const missing = validExport();
    delete (missing.profiles[0] as { games?: unknown }).games;
    expect(validateProfileExport(missing)).toBeNull();
  });

  it("caps the number of profiles at four", () => {
    let state = createInitialProfileState(NOW);
    for (let index = 2; index <= MAX_PROFILES; index += 1) {
      const next = createProfile(state, { name: `Speler ${index}`, avatar: "bear" }, NOW);
      if (!next) {
        throw new Error("Could not add a profile");
      }
      state = next;
    }

    expect(state.profiles).toHaveLength(MAX_PROFILES);
    expect(createProfile(state, { name: "Te veel", avatar: "bear" }, NOW)).toBeNull();
  });
});

describe("profile model", () => {
  it("never removes the last profile and never reuses an id", () => {
    const initial = createInitialProfileState(NOW);
    expect(removeProfile(initial, "p1")).toBeNull();

    const second = createProfile(initial, { name: "Sam", avatar: "fox" }, NOW);
    if (!second) {
      throw new Error("Could not create the second profile");
    }
    const afterRemoval = removeProfile(second, "p2");
    expect(afterRemoval?.profiles).toHaveLength(1);
    expect(afterRemoval?.activeProfileId).toBe("p1");
    expect(afterRemoval?.nextProfileNumber).toBe(3);

    const third = createProfile(afterRemoval!, { name: "Noa", avatar: "panda" }, NOW);
    expect(third?.profiles[1]?.id).toBe("p3");
  });

  it("renames a profile and changes its avatar without touching the others", () => {
    const { state } = twoProfiles();
    const next = updateProfile(state, "p2", { name: "  Emma  ", avatar: "panda" });

    expect(next).not.toBeNull();
    expect(next?.activeProfileId).toBe("p2");
    expect(next?.profiles[0]).toEqual(state.profiles[0]);
    expect(next?.profiles[1]).toMatchObject({ id: "p2", name: "Emma", avatar: "panda" });
  });

  it("rejects an empty, too long or unknown profile update", () => {
    const { state } = twoProfiles();

    expect(updateProfile(state, "p2", { name: "   ", avatar: "fox" })).toBeNull();
    expect(
      updateProfile(state, "p2", {
        name: "x".repeat(PROFILE_NAME_MAX_LENGTH + 1),
        avatar: "fox",
      }),
    ).toBeNull();
    expect(updateProfile(state, "p9", { name: "Emma", avatar: "fox" })).toBeNull();
  });

  it("rejects malformed state", () => {
    const initial = createInitialProfileState(NOW);
    expect(parseProfileState(initial)).toEqual(initial);
    expect(parseProfileState({ ...initial, version: 2 })).toBeNull();
    expect(parseProfileState({ ...initial, profiles: [] })).toBeNull();
    expect(parseProfileState({ ...initial, nextProfileNumber: 1 })).toBeNull();
    expect(
      parseProfileState({ ...initial, profiles: [{ ...initial.profiles[0], name: " " }] }),
    ).toBeNull();
  });

  it("rejects a duplicate profile id in an export", () => {
    const file = validExport();
    expect(parseProfileExport(file)).not.toBeNull();
    expect(
      parseProfileExport({
        ...file,
        profiles: [file.profiles[0], file.profiles[0]],
      }),
    ).toBeNull();
  });
});
