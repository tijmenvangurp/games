import { afterEach, describe, expect, it, vi } from "vitest";
import { PROGRESS_SCHEMA_VERSION } from "@entities/progress";
import { createProgressApi, ProgressApiError } from "@features/sync";

const DOCUMENT = {
  gameId: "math",
  schemaVersion: PROGRESS_SCHEMA_VERSION,
  revision: 2,
  data: { settings: { mode: "keer", level: "makkelijk" }, best: { "keer:makkelijk": 7 } },
  clientUpdatedAt: "2026-10-18T11:00:00.000Z",
  serverUpdatedAt: "2026-10-18T11:00:01.000Z",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("progress API client", () => {
  it("detects a session and lists players on the same origin", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ session: { id: "session-1" }, user: { id: "user-1" } }))
      .mockResolvedValueOnce(
        json({
          players: [
            {
              id: "player-1",
              slot: 1,
              avatar: "bear",
              createdAt: "2026-10-18T10:00:00.000Z",
            },
          ],
        }),
      );
    const api = createProgressApi(fetchImpl);

    await expect(api.hasSession()).resolves.toBe(true);
    await expect(api.listPlayers()).resolves.toHaveLength(1);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("/api/auth/get-session");
    expect(fetchImpl.mock.calls[1]?.[0]).toBe("/api/players");
  });

  it("returns false for a missing session without throwing", async () => {
    const api = createProgressApi(vi.fn().mockResolvedValue(json({ session: null })));
    await expect(api.hasSession()).resolves.toBe(false);
  });

  it("fetches progress for one player", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ progress: [DOCUMENT] }));
    const api = createProgressApi(fetchImpl);

    await expect(api.fetchProgress("player 1")).resolves.toEqual([DOCUMENT]);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("/api/progress?playerId=player+1");
  });

  it("sends the idempotency key and maps a 409 to the conflict document", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ progress: DOCUMENT }, 409));
    const api = createProgressApi(fetchImpl);

    const result = await api.pushProgress({
      playerId: "player-1",
      gameId: "math",
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      baseRevision: 1,
      clientUpdatedAt: "2026-10-18T12:00:00.000Z",
      data: { settings: { mode: "keer", level: "makkelijk" } },
      idempotencyKey: "key-123",
    });

    expect(result).toEqual({ kind: "conflict", document: DOCUMENT });
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("same-origin");
    expect(JSON.parse(String(init.body))).toMatchObject({
      playerId: "player-1",
      baseRevision: 1,
      idempotencyKey: "key-123",
    });
  });

  it("accepts a bare document on a successful write", async () => {
    const api = createProgressApi(vi.fn().mockResolvedValue(json(DOCUMENT)));
    const result = await api.pushProgress({
      playerId: "player-1",
      gameId: "math",
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      baseRevision: 1,
      clientUpdatedAt: "2026-10-18T12:00:00.000Z",
      data: {},
      idempotencyKey: "key-123",
    });

    expect(result).toEqual({ kind: "ok", document: DOCUMENT });
  });

  it("throws a typed error for a server failure", async () => {
    const api = createProgressApi(vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    await expect(api.listPlayers()).rejects.toBeInstanceOf(ProgressApiError);
  });
});
