import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PROGRESS_SCHEMA_VERSION,
  type PlayerRecord,
  type ProgressDocument,
  type SyncableProgress,
} from "@entities/progress";
import {
  flushProgressOutbox,
  hydrateProgress,
  isProfileSyncEnabled,
  ProgressApiError,
  setProfileSyncEnabled,
  startProgressSync,
  stopProgressSync,
  type ProgressApi,
} from "@features/sync";
import { enqueueOutbox, readOutbox, type OutboxEntry } from "../../libs/features/sync/model/outbox";
import {
  getProfileSyncEnabled,
  loadSyncState,
  saveSyncState,
  setProfileSyncEnabledState,
} from "../../libs/features/sync/model/sync-state";
import { notifyProgressChanged, registerProgressAdapter } from "@shared/lib";

const EARLY = "2026-10-18T10:00:00.000Z";
const LATE = "2026-10-18T11:00:00.000Z";
const NOW = "2026-10-18T12:00:00.000Z";
const PLAYER: PlayerRecord = {
  id: "player-1",
  slot: 1,
  avatar: "bear",
  createdAt: NOW,
};
const PLAYER_TWO: PlayerRecord = {
  id: "player-2",
  slot: 2,
  avatar: "fox",
  createdAt: NOW,
};

function documentFor(
  data: SyncableProgress,
  revision = 1,
  clientUpdatedAt = LATE,
): ProgressDocument {
  return {
    gameId: "memory",
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    revision,
    data,
    clientUpdatedAt,
    serverUpdatedAt: LATE,
  };
}

function makeApi(overrides: Partial<ProgressApi> = {}): ProgressApi {
  const api: ProgressApi = {
    hasSession: vi.fn(async () => true),
    listPlayers: vi.fn(async () => [PLAYER]),
    createPlayer: vi.fn(async (input) => ({
      id: "created-player",
      slot: input.slot,
      avatar: input.avatar,
      createdAt: NOW,
    })),
    deletePlayer: vi.fn(async () => undefined),
    fetchProgress: vi.fn(async () => []),
    pushProgress: vi.fn(async () => ({ kind: "ok" as const, document: null })),
  };
  return { ...api, ...overrides };
}

/** Seeds a link plus the explicit opt-in for `p1`. */
function seedLink(enable = true): void {
  saveSyncState({
    version: 1,
    players: { p1: { playerId: PLAYER.id, slot: 1, avatar: PLAYER.avatar } },
    progress: {},
    syncEnabled: enable ? { p1: true } : {},
  });
}

/** Writes a local profile store with given profiles (`@entities/profile`). */
function seedProfiles(profiles: ReadonlyArray<{ id: string; name: string; avatar: string }>): void {
  localStorage.setItem(
    "games.profiles.v1",
    JSON.stringify({
      version: 1,
      activeProfileId: profiles[0]?.id ?? "p1",
      nextProfileNumber: profiles.length + 1,
      profiles: profiles.map((profile) => ({ ...profile, createdAt: NOW })),
    }),
  );
}

function entry(
  data: SyncableProgress,
  baseRevision = 0,
  clientUpdatedAt = NOW,
  profileId = "p1",
): OutboxEntry {
  return {
    profileId,
    playerId: profileId === "p1" ? PLAYER.id : PLAYER_TWO.id,
    gameId: "memory",
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    baseRevision,
    clientUpdatedAt,
    data,
  };
}

/** Lets chained promises started by a timer callback finish. */
async function settle(): Promise<void> {
  for (let index = 0; index < 20; index += 1) {
    await Promise.resolve();
  }
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  stopProgressSync();
});

afterEach(() => {
  stopProgressSync();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("sync outbox", () => {
  it("collapses two local changes into one merged snapshot per profile and game", () => {
    enqueueOutbox(entry({ settings: { difficulty: "makkelijk" }, best: { plus: 3 } }, 2, EARLY));
    enqueueOutbox(entry({ settings: { difficulty: "moeilijk" }, best: { plus: 5 } }, 2, LATE));

    const entries = readOutbox();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.baseRevision).toBe(2);
    expect(entries[0]?.clientUpdatedAt).toBe(LATE);
    expect(entries[0]?.data).toEqual({
      settings: { difficulty: "moeilijk" },
      best: { plus: 5 },
    });
  });

  it("ignores corrupt outbox JSON and malformed entries", () => {
    localStorage.setItem("games.sync.outbox.v1", "{nope");
    expect(readOutbox()).toEqual([]);

    localStorage.setItem(
      "games.sync.outbox.v1",
      JSON.stringify({ version: 1, entries: [{ profileId: "p1" }] }),
    );
    expect(readOutbox()).toEqual([]);
  });
});

describe("sync state opt-in", () => {
  it("round-trips the enabled flags through localStorage", () => {
    saveSyncState({
      version: 1,
      players: {},
      progress: {},
      syncEnabled: { p1: true },
    });

    const state = loadSyncState();
    expect(getProfileSyncEnabled(state, "p1")).toBe(true);
    expect(getProfileSyncEnabled(state, "p2")).toBe(false);
  });

  it("accepts an old state without the field and keeps it disabled", () => {
    localStorage.setItem(
      "games.sync.state.v1",
      JSON.stringify({
        version: 1,
        players: { p1: { playerId: PLAYER.id, slot: 1, avatar: PLAYER.avatar } },
        progress: {},
      }),
    );

    const state = loadSyncState();
    expect(getProfileSyncEnabled(state, "p1")).toBe(false);
    expect(isProfileSyncEnabled("p1")).toBe(false);
  });

  it("toggles a flag purely and leaves other profiles alone", () => {
    const base = loadSyncState();
    const enabled = setProfileSyncEnabledState(base, "p1", true);
    expect(getProfileSyncEnabled(enabled, "p1")).toBe(true);
    expect(getProfileSyncEnabled(base, "p1")).toBe(false);

    const doubleEnable = setProfileSyncEnabledState(enabled, "p1", true);
    expect(doubleEnable).toBe(enabled);

    const disabled = setProfileSyncEnabledState(enabled, "p1", false);
    expect(disabled.syncEnabled).toEqual({});
    expect(getProfileSyncEnabled(disabled, "p1")).toBe(false);

    saveSyncState(enabled);
    expect(loadSyncState().syncEnabled).toEqual({ p1: true });
  });
});

describe("sync engine", () => {
  it("syncs nothing by default, even with a session and a pending outbox", async () => {
    const apply = vi.fn();
    registerProgressAdapter("memory", {
      read: () => ({ settings: { difficulty: "makkelijk" } }),
      apply: (_profileId, value) => apply(value),
    });

    const api = makeApi({
      fetchProgress: vi.fn(async () => [documentFor({ settings: { difficulty: "makkelijk" } })]),
    });
    seedLink(false);
    enqueueOutbox(entry({ settings: { difficulty: "makkelijk" } }));

    startProgressSync({ api, now: () => new Date(NOW) });
    await hydrateProgress();
    await flushProgressOutbox();

    expect(api.hasSession).toHaveBeenCalled();
    expect(api.listPlayers).not.toHaveBeenCalled();
    expect(api.createPlayer).not.toHaveBeenCalled();
    expect(api.fetchProgress).not.toHaveBeenCalled();
    expect(api.pushProgress).not.toHaveBeenCalled();
    expect(apply).not.toHaveBeenCalled();

    const outbox = readOutbox();
    expect(outbox).toHaveLength(1);
    expect(outbox[0]?.profileId).toBe("p1");
  });

  it("after enabling p1 touches only p1, not p2", async () => {
    seedProfiles([
      { id: "p1", name: "Speler 1", avatar: "bear" },
      { id: "p2", name: "Speler 2", avatar: "fox" },
    ]);
    const api = makeApi({ listPlayers: vi.fn(async () => []) });
    startProgressSync({ api, now: () => new Date(NOW) });
    await hydrateProgress();
    expect(api.listPlayers).not.toHaveBeenCalled();

    await setProfileSyncEnabled("p1", true);

    expect(getProfileSyncEnabled(loadSyncState(), "p1")).toBe(true);
    expect(api.listPlayers).toHaveBeenCalledTimes(1);
    expect(api.createPlayer).toHaveBeenCalledTimes(1);
    expect(api.createPlayer).toHaveBeenCalledWith({ slot: 1, avatar: "bear" });
    expect(loadSyncState().players.p1?.playerId).toBe("created-player");
    expect(loadSyncState().players.p2).toBeUndefined();
    expect(api.fetchProgress).toHaveBeenCalledTimes(1);
    expect(api.fetchProgress).toHaveBeenCalledWith("created-player");
  });

  it("does not enqueue or upload a local change while the flag is off", async () => {
    const api = makeApi();
    seedLink(false);
    startProgressSync({ api, now: () => new Date(NOW), debounceMs: 1000 });
    await hydrateProgress();

    notifyProgressChanged("memory");
    await vi.advanceTimersByTimeAsync(2000);
    await flushProgressOutbox();

    expect(api.pushProgress).not.toHaveBeenCalled();
    expect(readOutbox()).toEqual([]);
  });

  it("preserves the local timestamp of changes while sync is off", async () => {
    seedLink(false);
    startProgressSync({ api: makeApi(), now: () => new Date(NOW) });
    await hydrateProgress();

    notifyProgressChanged("memory");
    expect(loadSyncState().progress["p1:memory"]?.clientUpdatedAt).toBe(NOW);
  });

  it("uploads a disabled profile only after enabling and stops again on disable", async () => {
    const api = makeApi();
    seedProfiles([{ id: "p1", name: "Speler 1", avatar: "bear" }]);
    startProgressSync({ api, now: () => new Date(NOW), debounceMs: 1000 });
    await hydrateProgress();

    await setProfileSyncEnabled("p1", true);
    expect(api.pushProgress).not.toHaveBeenCalled();

    notifyProgressChanged("memory");
    await vi.advanceTimersByTimeAsync(1000);

    expect(api.pushProgress).toHaveBeenCalledTimes(1);
    expect(readOutbox()).toEqual([]);

    enqueueOutbox(entry({ settings: { difficulty: "moeilijk" } }));
    await setProfileSyncEnabled("p1", false);

    expect(getProfileSyncEnabled(loadSyncState(), "p1")).toBe(false);
    expect(readOutbox()).toEqual([]);

    notifyProgressChanged("memory");
    await vi.advanceTimersByTimeAsync(2000);
    await flushProgressOutbox();
    expect(api.pushProgress).toHaveBeenCalledTimes(1);
  });

  it("drops only the outbox entries of the disabled profile", async () => {
    const api = makeApi();
    saveSyncState({
      version: 1,
      players: {
        p1: { playerId: PLAYER.id, slot: 1, avatar: PLAYER.avatar },
        p2: { playerId: PLAYER_TWO.id, slot: 2, avatar: PLAYER_TWO.avatar },
      },
      progress: {},
      syncEnabled: { p1: true, p2: true },
    });
    enqueueOutbox(entry({ settings: { difficulty: "makkelijk" } }, 0, NOW, "p1"));
    enqueueOutbox(entry({ settings: { difficulty: "moeilijk" } }, 0, NOW, "p2"));

    await setProfileSyncEnabled("p1", false);

    const remaining = readOutbox();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.profileId).toBe("p2");

    startProgressSync({ api, now: () => new Date(NOW) });
    await hydrateProgress();
    await flushProgressOutbox();

    // Only the still-enabled profile uploads after the disable.
    expect(api.pushProgress).toHaveBeenCalledTimes(1);
    const input = vi.mocked(api.pushProgress).mock.calls[0]?.[0];
    expect(input?.profileId).toBe("p2");
    expect(readOutbox()).toEqual([]);
  });

  it("debounces local changes of an enabled profile and uploads the latest snapshot once", async () => {
    let local: SyncableProgress = { settings: { difficulty: "makkelijk" } };
    const apply = vi.fn();
    registerProgressAdapter("memory", {
      read: () => local,
      apply: (_profileId, value) => apply(value),
    });

    const api = makeApi({ listPlayers: vi.fn(async () => [PLAYER]) });
    startProgressSync({
      api,
      now: () => new Date(NOW),
      debounceMs: 1200,
      retryBaseMs: 100,
      retryMaxMs: 1000,
    });
    await setProfileSyncEnabled("p1", true);

    notifyProgressChanged("memory");
    await vi.advanceTimersByTimeAsync(500);
    local = { settings: { difficulty: "moeilijk" } };
    notifyProgressChanged("memory");
    await vi.advanceTimersByTimeAsync(1199);
    expect(api.pushProgress).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await flushProgressOutbox();

    expect(api.pushProgress).toHaveBeenCalledTimes(1);
    const input = vi.mocked(api.pushProgress).mock.calls[0]?.[0];
    expect(input?.gameId).toBe("memory");
    expect(input?.data).toEqual({ settings: { difficulty: "moeilijk" } });
    expect(typeof input?.idempotencyKey).toBe("string");
    expect(readOutbox()).toEqual([]);
  });

  it("retries with backoff and a fresh idempotency key per attempt", async () => {
    registerProgressAdapter("memory", {
      read: () => ({ settings: { difficulty: "makkelijk" } }),
      apply: vi.fn(),
    });
    let attempts = 0;
    const pushProgress = vi.fn(async (_input: Parameters<ProgressApi["pushProgress"]>[0]) => {
      attempts += 1;
      if (attempts <= 2) {
        throw new ProgressApiError(503, "unavailable");
      }
      return { kind: "ok" as const, document: null };
    });
    const api = makeApi({ pushProgress });

    startProgressSync({
      api,
      now: () => new Date(NOW),
      retryBaseMs: 100,
      retryMaxMs: 1000,
    });
    await hydrateProgress();
    seedLink();
    enqueueOutbox(entry({ settings: { difficulty: "makkelijk" } }));

    await flushProgressOutbox();
    expect(pushProgress).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(99);
    expect(pushProgress).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await settle();
    expect(pushProgress).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(200);
    await settle();
    expect(pushProgress).toHaveBeenCalledTimes(3);

    const keys = vi.mocked(pushProgress).mock.calls.map(([input]) => input.idempotencyKey);
    expect(new Set(keys).size).toBe(3);
    expect(readOutbox()).toEqual([]);
  });

  it("merges a 409 conflict document and retries with the new base revision", async () => {
    const apply = vi.fn();
    registerProgressAdapter("memory", {
      read: () => ({ settings: { difficulty: "makkelijk" } }),
      apply: (_profileId, value) => apply(value),
    });
    const pushProgress = vi
      .fn()
      .mockResolvedValueOnce({
        kind: "conflict",
        document: documentFor({ settings: { difficulty: "makkelijk" } }, 4, EARLY),
      })
      .mockResolvedValueOnce({ kind: "ok", document: null });
    const api = makeApi({ pushProgress });

    startProgressSync({ api, now: () => new Date(NOW) });
    await hydrateProgress();
    seedLink();
    enqueueOutbox(entry({ settings: { difficulty: "moeilijk" } }, 1, LATE));

    await flushProgressOutbox();

    expect(pushProgress).toHaveBeenCalledTimes(2);
    const second = vi.mocked(pushProgress).mock.calls[1]?.[0];
    expect(second?.baseRevision).toBe(4);
    expect(second?.data).toEqual({ settings: { difficulty: "moeilijk" } });
    expect(apply).toHaveBeenCalledWith({ settings: { difficulty: "moeilijk" } });
    expect(readOutbox()).toEqual([]);
  });

  it("hydrates the server state of an enabled profile, keeps a newer local setting and pushes the merge", async () => {
    let local: SyncableProgress = { settings: { difficulty: "moeilijk" } };
    const apply = vi.fn((value: SyncableProgress) => {
      local = value;
    });
    registerProgressAdapter("memory", {
      read: () => local,
      apply: (_profileId, value) => apply(value as SyncableProgress),
    });
    saveSyncState({
      version: 1,
      players: { p1: { playerId: PLAYER.id, slot: 1, avatar: PLAYER.avatar } },
      progress: { "p1:memory": { revision: 1, clientUpdatedAt: LATE } },
      syncEnabled: { p1: true },
    });
    const api = makeApi({
      fetchProgress: vi.fn(async () => [
        documentFor({ settings: { difficulty: "makkelijk" }, best: { plus: 4 } }, 2, EARLY),
      ]),
    });

    startProgressSync({ api, now: () => new Date(NOW) });
    await hydrateProgress();
    await flushProgressOutbox();

    expect(apply).toHaveBeenCalledWith({
      settings: { difficulty: "moeilijk" },
      best: { plus: 4 },
    });
    const input = vi.mocked(api.pushProgress).mock.calls[0]?.[0];
    expect(input?.baseRevision).toBe(2);
    expect(input?.data).toEqual({
      settings: { difficulty: "moeilijk" },
      best: { plus: 4 },
    });
  });

  it("does not hydrate another profile while p1 is the only one enabled", async () => {
    const apply = vi.fn();
    registerProgressAdapter("memory", {
      read: () => ({ settings: { difficulty: "makkelijk" } }),
      apply: (_profileId, value) => apply(value),
    });
    saveSyncState({
      version: 1,
      players: {
        p1: { playerId: PLAYER.id, slot: 1, avatar: PLAYER.avatar },
        p2: { playerId: PLAYER_TWO.id, slot: 2, avatar: PLAYER_TWO.avatar },
      },
      progress: {},
      syncEnabled: { p1: true, p2: true },
    });
    seedProfiles([
      { id: "p1", name: "Speler 1", avatar: "bear" },
      { id: "p2", name: "Speler 2", avatar: "fox" },
    ]);
    const fetchProgress = vi.fn(async () => [
      documentFor({ settings: { difficulty: "makkelijk" } }),
    ]);
    const api = makeApi({ fetchProgress });

    startProgressSync({ api, now: () => new Date(NOW) });
    await hydrateProgress();
    await flushProgressOutbox();
    expect(fetchProgress).toHaveBeenCalledTimes(2);

    await setProfileSyncEnabled("p2", false);
    fetchProgress.mockClear();
    await hydrateProgress();

    expect(fetchProgress).toHaveBeenCalledTimes(1);
    expect(fetchProgress).toHaveBeenCalledWith(PLAYER.id);
    expect(fetchProgress).not.toHaveBeenCalledWith(PLAYER_TWO.id);
    expect(apply).not.toHaveBeenCalled();
  });

  it("keeps a local setting changed before enable when the server copy is older", async () => {
    let local: SyncableProgress = { settings: { difficulty: "moeilijk" } };
    const apply = vi.fn((value: SyncableProgress) => {
      local = value;
    });
    registerProgressAdapter("memory", {
      read: () => local,
      apply: (_profileId, value) => apply(value as SyncableProgress),
    });

    const offline = makeApi({ hasSession: vi.fn(async () => false) });
    startProgressSync({ api: offline, now: () => new Date(NOW) });
    await hydrateProgress();
    notifyProgressChanged("memory");
    stopProgressSync();

    const online = makeApi({
      fetchProgress: vi.fn(async () => [
        documentFor({ settings: { difficulty: "makkelijk" } }, 1, EARLY),
      ]),
    });
    startProgressSync({ api: online, now: () => new Date(NOW) });
    await setProfileSyncEnabled("p1", true);
    await flushProgressOutbox();

    expect(local).toEqual({ settings: { difficulty: "moeilijk" } });
    const input = vi.mocked(online.pushProgress).mock.calls[0]?.[0];
    expect(input?.data).toEqual({ settings: { difficulty: "moeilijk" } });
  });

  it("stays local and does not throw when the session check is offline", async () => {
    const apply = vi.fn();
    registerProgressAdapter("memory", {
      read: () => ({ settings: { difficulty: "makkelijk" } }),
      apply: (_profileId, value) => apply(value),
    });
    const api = makeApi({
      hasSession: vi.fn(async () => {
        throw new TypeError("network down");
      }),
    });

    startProgressSync({ api, now: () => new Date(NOW) });
    await expect(hydrateProgress()).resolves.toBeUndefined();

    expect(apply).not.toHaveBeenCalled();
    expect(api.listPlayers).not.toHaveBeenCalled();
    expect(readOutbox()).toEqual([]);
  });

  it("keeps the outbox when there is no session", async () => {
    const api = makeApi({ hasSession: vi.fn(async () => false) });
    seedLink();
    enqueueOutbox(entry({ settings: { difficulty: "makkelijk" } }));

    startProgressSync({ api, now: () => new Date(NOW) });
    await hydrateProgress();
    await flushProgressOutbox();

    expect(api.pushProgress).not.toHaveBeenCalled();
    expect(readOutbox()).toHaveLength(1);
  });

  it("flushes pending local changes of an enabled profile on pagehide", async () => {
    let local: SyncableProgress = { settings: { difficulty: "makkelijk" } };
    registerProgressAdapter("memory", {
      read: () => local,
      apply: vi.fn(),
    });
    const api = makeApi();
    startProgressSync({ api, now: () => new Date(NOW), debounceMs: 5000 });
    await setProfileSyncEnabled("p1", true);

    notifyProgressChanged("memory");
    local = { settings: { difficulty: "gemiddeld" } };
    notifyProgressChanged("memory");
    window.dispatchEvent(new Event("pagehide"));
    await flushProgressOutbox();

    expect(api.pushProgress).toHaveBeenCalledTimes(1);
    const input = vi.mocked(api.pushProgress).mock.calls[0]?.[0];
    expect(input?.data).toEqual({ settings: { difficulty: "gemiddeld" } });
  });

  it("clears an outbox entry that the server rejects as gone", async () => {
    const pushProgress = vi.fn(async () => {
      throw new ProgressApiError(404, "gone");
    });
    const api = makeApi({ pushProgress });
    startProgressSync({ api, now: () => new Date(NOW) });
    await hydrateProgress();
    seedLink();
    enqueueOutbox(entry({ settings: { difficulty: "makkelijk" } }));

    await flushProgressOutbox();

    expect(readOutbox()).toEqual([]);
  });

  it("resolves silently for an unknown profile id", async () => {
    const api = makeApi();
    startProgressSync({ api, now: () => new Date(NOW) });
    await setProfileSyncEnabled("profile-x", true);
    await setProfileSyncEnabled("profile-x", false);

    expect(getProfileSyncEnabled(loadSyncState(), "profile-x")).toBe(false);
    expect(api.listPlayers).not.toHaveBeenCalled();
  });
});
