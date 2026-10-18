import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Env } from "../../apps/api/src/env";
import { gameCatalog } from "@entities/game";
import { PROGRESS_GAME_IDS } from "../../apps/api/src/game-ids";
import { handlePlayerDelete, handlePlayers, type PlayerView } from "../../apps/api/src/players";
import { MAX_PROGRESS_BYTES, handleProgress, type ProgressView } from "../../apps/api/src/progress";
import type { SessionResolver } from "../../apps/api/src/session";
import { createFakeD1, type FakeD1 } from "./fake-d1";

const OWNER = "parent_owner";
const OTHER_PARENT = "parent_other";
const BASE_URL = "https://games.example.invalid";

const resolveAs =
  (userId: string): SessionResolver =>
  async () => ({ status: "authenticated", userId });

const FIRST_WRITE = {
  gameId: "sudoku",
  schemaVersion: 1,
  baseRevision: 0,
  clientUpdatedAt: "2026-10-18T10:00:00.000Z",
  data: { settings: { theme: "dark", difficulty: "easy" }, best: { "4x4": 3 } },
  idempotencyKey: "mutation-1",
};

let fake: FakeD1;
let env: Env;

beforeEach(() => {
  fake = createFakeD1();
  fake.seedUser(OWNER);
  fake.seedUser(OTHER_PARENT);
  env = { DB: fake.db, ACCOUNTS_ENABLED: "true" };
});

afterEach(() => {
  fake.close();
});

function apiRequest(path: string, init?: RequestInit): Request {
  return new Request(`${BASE_URL}${path}`, init);
}

function jsonRequest(path: string, method: string, body: unknown): Request {
  return apiRequest(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function createPlayer(owner = OWNER): Promise<PlayerView> {
  const response = await handlePlayers(
    jsonRequest("/api/players", "POST", { slot: 1, avatar: "bear" }),
    env,
    resolveAs(owner),
  );
  const body = (await response.json()) as { player: PlayerView };
  return body.player;
}

async function write(
  playerId: string,
  overrides: Record<string, unknown> = {},
  owner = OWNER,
): Promise<Response> {
  return handleProgress(
    jsonRequest("/api/progress", "POST", {
      ...FIRST_WRITE,
      playerId,
      ...overrides,
    }),
    env,
    resolveAs(owner),
  );
}

describe("game id allowlist", () => {
  it("stays in sync with the client game catalog", () => {
    expect([...PROGRESS_GAME_IDS]).toEqual(gameCatalog.map((game) => game.id));
  });
});

describe("GET /api/progress", () => {
  it("returns an empty list for a new profile", async () => {
    const player = await createPlayer();

    const response = await handleProgress(
      apiRequest(`/api/progress?playerId=${player.id}`),
      env,
      resolveAs(OWNER),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ progress: [] });
  });

  it("returns the stored envelopes", async () => {
    const player = await createPlayer();
    await write(player.id);

    const response = await handleProgress(
      apiRequest(`/api/progress?playerId=${player.id}`),
      env,
      resolveAs(OWNER),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      progress: [
        {
          gameId: "sudoku",
          schemaVersion: 1,
          revision: 1,
          data: FIRST_WRITE.data,
          clientUpdatedAt: FIRST_WRITE.clientUpdatedAt,
          serverUpdatedAt: expect.any(String),
        },
      ],
    });
  });

  it("requires a playerId", async () => {
    const response = await handleProgress(apiRequest("/api/progress"), env, resolveAs(OWNER));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request", field: "playerId" });
  });

  it("returns 403 for another parent's profile", async () => {
    const player = await createPlayer(OTHER_PARENT);

    const response = await handleProgress(
      apiRequest(`/api/progress?playerId=${player.id}`),
      env,
      resolveAs(OWNER),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "forbidden" });
  });

  it("returns 403 after the profile is deleted", async () => {
    const player = await createPlayer();
    await handlePlayerDelete(
      apiRequest(`/api/players/${player.id}`, { method: "DELETE" }),
      env,
      player.id,
      resolveAs(OWNER),
    );

    const response = await handleProgress(
      apiRequest(`/api/progress?playerId=${player.id}`),
      env,
      resolveAs(OWNER),
    );

    expect(response.status).toBe(403);
  });

  it("rejects other methods with 405", async () => {
    const response = await handleProgress(
      apiRequest("/api/progress", { method: "DELETE" }),
      env,
      resolveAs(OWNER),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, POST");
  });
});

describe("POST /api/progress", () => {
  it("stores the first revision and echoes the envelope", async () => {
    const player = await createPlayer();

    const response = await write(player.id);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      progress: {
        gameId: "sudoku",
        schemaVersion: 1,
        revision: 1,
        data: FIRST_WRITE.data,
        clientUpdatedAt: FIRST_WRITE.clientUpdatedAt,
        serverUpdatedAt: expect.any(String),
      },
    });
    expect(
      fake.count(
        `SELECT COUNT(*) AS count FROM "progress_mutation" WHERE "playerId" = ?`,
        player.id,
      ),
    ).toBe(1);
  });

  it("increments the revision when the base revision matches", async () => {
    const player = await createPlayer();
    await write(player.id);

    const response = await write(player.id, {
      baseRevision: 1,
      schemaVersion: 2,
      data: { settings: { theme: "light" } },
      idempotencyKey: "mutation-2",
      clientUpdatedAt: "2026-10-18T11:00:00.000Z",
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { progress: ProgressView };
    expect(body.progress).toEqual({
      gameId: "sudoku",
      schemaVersion: 2,
      revision: 2,
      data: { settings: { theme: "light" } },
      clientUpdatedAt: "2026-10-18T11:00:00.000Z",
      serverUpdatedAt: expect.any(String),
    });
  });

  it("returns the current document for a retried idempotency key", async () => {
    const player = await createPlayer();
    await write(player.id);

    const retry = await write(player.id, { data: { settings: { theme: "lost" } } });

    expect(retry.status).toBe(200);
    expect(await retry.json()).toEqual({
      progress: {
        gameId: "sudoku",
        schemaVersion: 1,
        revision: 1,
        data: FIRST_WRITE.data,
        clientUpdatedAt: FIRST_WRITE.clientUpdatedAt,
        serverUpdatedAt: expect.any(String),
      },
    });
    expect(
      fake.count(
        `SELECT COUNT(*) AS count FROM "progress_mutation" WHERE "playerId" = ?`,
        player.id,
      ),
    ).toBe(1);
  });

  it("applies the mutation only once across retries with the same key", async () => {
    const player = await createPlayer();
    await write(player.id);
    await write(player.id, {
      baseRevision: 1,
      data: { settings: { theme: "second" } },
      idempotencyKey: "mutation-2",
    });

    const retry = await write(player.id, {
      baseRevision: 1,
      data: { settings: { theme: "second" } },
      idempotencyKey: "mutation-2",
    });

    const body = (await retry.json()) as { progress: ProgressView };
    expect(body.progress.revision).toBe(2);
    expect(
      fake.count(
        `SELECT COUNT(*) AS count FROM "progress_mutation" WHERE "playerId" = ?`,
        player.id,
      ),
    ).toBe(2);
  });

  it("rejects an idempotency key that was already used for another game", async () => {
    const player = await createPlayer();
    await write(player.id);

    const response = await write(player.id, { gameId: "memory", baseRevision: 0 });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "idempotency_key_reuse" });
  });

  it("returns 409 with the current document when the base revision is stale", async () => {
    const player = await createPlayer();
    await write(player.id);
    await write(player.id, {
      baseRevision: 1,
      data: { settings: { theme: "second" } },
      idempotencyKey: "mutation-2",
    });

    const response = await write(player.id, {
      baseRevision: 0,
      data: { settings: { theme: "stale" } },
      idempotencyKey: "mutation-3",
    });

    expect(response.status).toBe(409);
    const body = (await response.json()) as { error: string; progress: ProgressView };
    expect(body.error).toBe("conflict");
    expect(body.progress).toMatchObject({
      gameId: "sudoku",
      revision: 2,
      data: { settings: { theme: "second" } },
    });
    expect(
      fake.count(
        `SELECT COUNT(*) AS count FROM "progress_mutation" WHERE "playerId" = ?`,
        player.id,
      ),
    ).toBe(2);
  });

  it("lets the client merge and retry after a conflict", async () => {
    const player = await createPlayer();
    await write(player.id);
    await write(player.id, {
      baseRevision: 1,
      data: { settings: { theme: "second" } },
      idempotencyKey: "mutation-2",
    });

    const response = await write(player.id, {
      baseRevision: 2,
      data: { settings: { theme: "merged" } },
      idempotencyKey: "mutation-3",
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { progress: ProgressView };
    expect(body.progress.revision).toBe(3);
    expect(body.progress.data).toEqual({ settings: { theme: "merged" } });
  });

  it("treats a future base revision as a conflict", async () => {
    const player = await createPlayer();

    const response = await write(player.id, { baseRevision: 7 });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "conflict", progress: null });
  });

  it("returns 403 for another parent's profile", async () => {
    const player = await createPlayer(OTHER_PARENT);

    const response = await write(player.id);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "forbidden" });
  });

  it("returns 403 after the profile is deleted", async () => {
    const player = await createPlayer();
    await handlePlayerDelete(
      apiRequest(`/api/players/${player.id}`, { method: "DELETE" }),
      env,
      player.id,
      resolveAs(OWNER),
    );

    const response = await write(player.id);

    expect(response.status).toBe(403);
  });

  it.each([
    ["an unknown game", { gameId: "minecraft" }, "gameId"],
    ["a missing game", { gameId: undefined }, "gameId"],
    ["schema version 0", { schemaVersion: 0 }, "schemaVersion"],
    ["a fractional schema version", { schemaVersion: 1.5 }, "schemaVersion"],
    ["a negative base revision", { baseRevision: -1 }, "baseRevision"],
    ["a fractional base revision", { baseRevision: 0.5 }, "baseRevision"],
    ["an invalid client timestamp", { clientUpdatedAt: "yesterday" }, "clientUpdatedAt"],
    ["an array as data", { data: [1, 2, 3] }, "data"],
    ["null as data", { data: null }, "data"],
    ["a missing idempotency key", { idempotencyKey: undefined }, "idempotencyKey"],
    ["an empty idempotency key", { idempotencyKey: "" }, "idempotencyKey"],
    ["a key with unsafe characters", { idempotencyKey: "key with spaces" }, "idempotencyKey"],
    ["a missing player", { playerId: undefined }, "playerId"],
  ])("rejects %s", async (_label, override, field) => {
    const player = await createPlayer();

    const response = await write(player.id, override);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request", field });
  });

  it("rejects data above 64 KB", async () => {
    const player = await createPlayer();

    const response = await write(player.id, {
      data: { blob: "x".repeat(MAX_PROGRESS_BYTES) },
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "payload_too_large", field: "data" });
  });

  it("accepts data just below 64 KB", async () => {
    const player = await createPlayer();

    const response = await write(player.id, {
      data: { blob: "x".repeat(MAX_PROGRESS_BYTES - 100) },
    });

    expect(response.status).toBe(200);
  });

  it("rejects invalid JSON", async () => {
    const player = await createPlayer();

    const response = await handleProgress(
      apiRequest("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
      env,
      resolveAs(OWNER),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_json" });
  });
});
