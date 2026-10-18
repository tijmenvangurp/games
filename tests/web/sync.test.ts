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
  ProgressApiError,
  startProgressSync,
  stopProgressSync,
  type ProgressApi,
} from "@features/sync";
import { enqueueOutbox, readOutbox, type OutboxEntry } from "../../libs/features/sync/model/outbox";
import { loadSyncState, saveSyncState } from "../../libs/features/sync/model/sync-state";
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

function seedLink(): void {
  saveSyncState({
    version: 1,
    players: { p1: { playerId: PLAYER.id, slot: 1, avatar: PLAYER.avatar } },
    progress: {},
  });
}

function entry(data: SyncableProgress, baseRevision = 0, clientUpdatedAt = NOW): OutboxEntry {
  return {
    profileId: "p1",
    playerId: PLAYER.id,
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

describe("sync engine", () => {
  it("debounces local changes and uploads the latest snapshot once", async () => {
    let local: SyncableProgress = { settings: { difficulty: "makkelijk" } };
    const apply = vi.fn();
    registerProgressAdapter("memory", {
      read: () => local,
      apply: (_profileId, value) => apply(value),
    });

    const api = makeApi();
    startProgressSync({
      api,
      now: () => new Date(NOW),
      debounceMs: 1200,
      retryBaseMs: 100,
      retryMaxMs: 1000,
    });
    await hydrateProgress();

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

  it("calls createPlayer for a local profile without a server player", async () => {
    const api = makeApi({ listPlayers: vi.fn(async () => []) });
    startProgressSync({ api, now: () => new Date(NOW) });
    await hydrateProgress();

    expect(api.createPlayer).toHaveBeenCalledWith({ slot: 1, avatar: "bear" });
    expect(loadSyncState().players.p1?.playerId).toBe("created-player");
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

  it("hydrates the server state, keeps a newer local setting and pushes the merge", async () => {
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

  it("keeps a local setting changed before login when the server copy is older", async () => {
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
    await hydrateProgress();
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

  it("flushes pending local changes on pagehide without waiting for the debounce", async () => {
    let local: SyncableProgress = { settings: { difficulty: "makkelijk" } };
    registerProgressAdapter("memory", {
      read: () => local,
      apply: vi.fn(),
    });
    const api = makeApi();
    startProgressSync({ api, now: () => new Date(NOW), debounceMs: 5000 });
    await hydrateProgress();

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
});
