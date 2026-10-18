import { describe, expect, it } from "vitest";
import {
  compareProgressVersions,
  mergeProgressData,
  parsePlayersResponse,
  parseProgressDocument,
  parseProgressListResponse,
  parseSyncableProgress,
  progressDataEquals,
  PROGRESS_SCHEMA_VERSION,
  type ProgressVersion,
} from "@entities/progress";

const EARLY = "2026-10-18T10:00:00.000Z";
const LATE = "2026-10-18T11:00:00.000Z";

function version(
  data: ProgressVersion["data"],
  clientUpdatedAt = EARLY,
  revision = 1,
): ProgressVersion {
  return { schemaVersion: PROGRESS_SCHEMA_VERSION, revision, clientUpdatedAt, data };
}

describe("progress merge", () => {
  it("uses last-write-wins for settings and ignores an older revision", () => {
    const existing = version({ settings: { difficulty: "moeilijk" } }, LATE, 1);
    const incoming = version({ settings: { difficulty: "makkelijk" } }, EARLY, 9);

    expect(mergeProgressData(existing, incoming)).toEqual({
      settings: { difficulty: "moeilijk" },
    });
    expect(mergeProgressData(incoming, existing)).toEqual({
      settings: { difficulty: "moeilijk" },
    });
  });

  it("uses the revision as tiebreaker when timestamps are equal", () => {
    const existing = version({ settings: { difficulty: "makkelijk" } }, LATE, 2);
    const incoming = version({ settings: { difficulty: "moeilijk" } }, LATE, 3);

    expect(compareProgressVersions(incoming, existing)).toBe(1);
    expect(mergeProgressData(existing, incoming)).toEqual({
      settings: { difficulty: "moeilijk" },
    });
  });

  it("keeps the highest best score per key", () => {
    const existing = version({ best: { "plus:makkelijk": 8, "keer:gemiddeld": 4 } }, LATE);
    const incoming = version({ best: { "plus:makkelijk": 6, "keer:gemiddeld": 9 } }, EARLY);

    expect(mergeProgressData(existing, incoming)).toEqual({
      best: { "plus:makkelijk": 8, "keer:gemiddeld": 9 },
    });
  });

  it("keeps the highest unlocked count", () => {
    const existing = version({ unlocked: 4 }, LATE);
    const incoming = version({ unlocked: 7 }, EARLY);

    expect(mergeProgressData(existing, incoming)).toEqual({ unlocked: 7 });
  });

  it("merges settings, best and unlocked in one payload", () => {
    const existing = version(
      { settings: { difficulty: "makkelijk" }, best: { plus: 5 }, unlocked: 2 },
      EARLY,
    );
    const incoming = version(
      { settings: { difficulty: "moeilijk" }, best: { plus: 4 }, unlocked: 5 },
      LATE,
    );

    expect(mergeProgressData(existing, incoming)).toEqual({
      settings: { difficulty: "moeilijk" },
      best: { plus: 5 },
      unlocked: 5,
    });
  });

  it("does not merge a different schema version", () => {
    const existing = version({ settings: { difficulty: "moeilijk" } }, EARLY);
    const incoming: ProgressVersion = {
      schemaVersion: PROGRESS_SCHEMA_VERSION + 1,
      revision: 9,
      clientUpdatedAt: LATE,
      data: { settings: { difficulty: "makkelijk" } },
    };

    expect(mergeProgressData(existing, incoming)).toEqual({
      settings: { difficulty: "moeilijk" },
    });
    expect(mergeProgressData(null, incoming)).toEqual({});
  });

  it("returns the incoming data when there is no local snapshot", () => {
    expect(mergeProgressData(null, version({ settings: { difficulty: "gemiddeld" } }))).toEqual({
      settings: { difficulty: "gemiddeld" },
    });
  });
});

describe("progress data equality", () => {
  it("ignores key order and compares values", () => {
    expect(
      progressDataEquals(
        { settings: { a: "x", b: "y" }, best: { plus: 3 }, unlocked: 2 },
        { settings: { b: "y", a: "x" }, best: { plus: 3 }, unlocked: 2 },
      ),
    ).toBe(true);
    expect(progressDataEquals({ settings: { a: "x" } }, { settings: { a: "y" } })).toBe(false);
    expect(progressDataEquals({}, { unlocked: 1 })).toBe(false);
  });
});

describe("progress validation", () => {
  it("accepts a well-formed document and list", () => {
    const document = {
      gameId: "math",
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      revision: 3,
      data: { settings: { mode: "keer", level: "moeilijk" }, best: { "keer:moeilijk": 8 } },
      clientUpdatedAt: LATE,
      serverUpdatedAt: LATE,
    };

    expect(parseProgressDocument(document)).toEqual(document);
    expect(parseProgressListResponse({ progress: [document] })?.progress).toHaveLength(1);
  });

  it("rejects a wrong schema, bad revision and unsafe keys", () => {
    const base = {
      gameId: "math",
      revision: 1,
      data: {},
      clientUpdatedAt: LATE,
      serverUpdatedAt: LATE,
    };

    expect(parseProgressDocument({ ...base, schemaVersion: 99 })).toBeNull();
    expect(parseProgressDocument({ ...base, schemaVersion: 1, revision: -1 })).toBeNull();
    expect(
      parseProgressDocument({
        ...base,
        schemaVersion: 1,
        data: { settings: JSON.parse('{"__proto__":"x"}') as Record<string, unknown> },
      }),
    ).toBeNull();
    expect(
      parseProgressDocument({
        ...base,
        schemaVersion: 1,
        data: { best: { plus: 1.5 } },
      }),
    ).toBeNull();
  });

  it("strips unknown top-level data keys but rejects malformed known keys", () => {
    expect(parseSyncableProgress({ settings: { theme: "tuin" }, future: true })).toEqual({
      settings: { theme: "tuin" },
    });
    expect(parseSyncableProgress({ unlocked: -1 })).toBeNull();
    expect(parseSyncableProgress({ best: [] })).toBeNull();
    expect(parseSyncableProgress(null)).toBeNull();
  });

  it("rejects duplicate player slots", () => {
    expect(
      parsePlayersResponse({
        players: [
          { id: "a", slot: 1, avatar: "bear", createdAt: LATE },
          { id: "b", slot: 1, avatar: "fox", createdAt: LATE },
        ],
      }),
    ).toBeNull();
    expect(
      parsePlayersResponse({
        players: [{ id: "a", slot: 1, avatar: "bear", createdAt: LATE }],
      })?.players,
    ).toHaveLength(1);
  });
});
