import { afterEach, beforeEach, describe, expect, it } from "vitest";
import apiWorker from "../../apps/api/src/index";
import type { Env } from "../../apps/api/src/env";
import { handlePlayerDelete, handlePlayers, type PlayerView } from "../../apps/api/src/players";
import { handleProgress } from "../../apps/api/src/progress";
import type { SessionLookup, SessionResolver } from "../../apps/api/src/session";
import { createFakeD1, type FakeD1 } from "./fake-d1";

const BASE_URL = "https://games.example.invalid";
const OWNER = "parent_owner";
const OTHER_PARENT = "parent_other";

const SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex",
} as const;

function expectSecurityHeaders(response: Response): void {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    expect(response.headers.get(name), `${name} on a ${response.status} response`).toBe(value);
  }
}

/** Every response is additive: security headers plus a JSON content type. */
function expectApiHeaders(response: Response): void {
  expectSecurityHeaders(response);
  expect(response.headers.get("Content-Type"), `${response.status} response`).toBe(
    "application/json",
  );
}

const resolveAs =
  (lookup: Promise<SessionLookup> | SessionLookup): SessionResolver =>
  async () =>
    lookup instanceof Promise ? await lookup : lookup;

const authenticated = (userId: string): SessionLookup => ({
  status: "authenticated",
  userId,
});
const unauthenticated: SessionLookup = { status: "unauthenticated" };

describe("every /api/* response carries the API security headers", () => {
  let fake: FakeD1;
  let disabledEnv: Env;

  beforeEach(() => {
    fake = createFakeD1();
    fake.seedUser(OWNER);
    fake.seedUser(OTHER_PARENT);
    disabledEnv = { DB: fake.db, ACCOUNTS_ENABLED: "false" };
  });

  afterEach(() => {
    fake.close();
  });

  function request(path: string, method = "GET", body?: unknown): Request {
    return new Request(`${BASE_URL}${path}`, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" } }),
    });
  }

  function authRequest(path: string, method: string, body?: unknown): Request {
    return request(path, method, body);
  }

  async function createPlayer(
    env: Env,
    owner: string,
    slot: number,
    avatar = "bear",
  ): Promise<PlayerView> {
    const response = await handlePlayers(
      authRequest("/api/players", "POST", { slot, avatar }),
      env,
      resolveAs(authenticated(owner)),
    );
    expect(response.status).toBe(201);
    const body = (await response.json()) as { player: PlayerView };
    return body.player;
  }

  it.each([
    ["GET", "/api/players", 503],
    ["POST", "/api/players", 503],
    ["DELETE", "/api/players/player_example", 503],
    ["GET", "/api/progress?playerId=player_example", 503],
    ["POST", "/api/progress", 503],
    ["GET", "/api/auth/capabilities", 503],
    ["POST", "/api/auth/passkey-first/context", 503],
    ["GET", "/api/auth/get-session", 503],
    ["GET", "/api/does-not-exist", 404],
  ] as const)(
    "answers %s %s with %i and the API headers while accounts are disabled",
    async (method, path, status) => {
      const response = await apiWorker.fetch(request(path, method), disabledEnv);

      expect(response.status).toBe(status);
      expectApiHeaders(response);
      if (status !== 404) {
        expect(await response.json()).toEqual({ error: "auth_unavailable" });
      } else {
        expect(await response.json()).toEqual({ error: "not_found" });
      }
    },
  );

  it.each([
    ["PUT", "/api/players/player_example", "DELETE"],
    ["POST", "/api/auth/capabilities", "GET"],
  ] as const)(
    "answers %s %s with 405, the API headers and an Allow hint",
    async (method, path, allow) => {
      const response = await apiWorker.fetch(request(path, method), disabledEnv);

      expect(response.status).toBe(405);
      expect(response.headers.get("Allow")).toBe(allow);
      expectApiHeaders(response);
    },
  );

  it("answers unauthorized players and progress requests with the API headers", async () => {
    const players = await handlePlayers(
      request("/api/players"),
      disabledEnv,
      resolveAs(unauthenticated),
    );
    expect(players.status).toBe(401);
    expectApiHeaders(players);

    const progress = await handleProgress(
      request("/api/progress", "POST", { playerId: "player_example" }),
      disabledEnv,
      resolveAs(unauthenticated),
    );
    expect(progress.status).toBe(401);
    expectApiHeaders(progress);
  });

  it("answers validation failures (400) on players and progress with the API headers", async () => {
    const env: Env = { DB: fake.db, ACCOUNTS_ENABLED: "true" };

    const badSlot = await handlePlayers(
      authRequest("/api/players", "POST", { slot: 9, avatar: "bear" }),
      env,
      resolveAs(authenticated(OWNER)),
    );
    expect(badSlot.status).toBe(400);
    expectApiHeaders(badSlot);

    const badGame = await handleProgress(
      authRequest("/api/progress", "POST", {
        playerId: "player_x",
        gameId: "not-a-game",
        schemaVersion: 1,
        baseRevision: 0,
        clientUpdatedAt: "2026-10-18T10:00:00.000Z",
        data: {},
        idempotencyKey: "key-1",
      }),
      env,
      resolveAs(authenticated(OWNER)),
    );
    expect(badGame.status).toBe(400);
    expectApiHeaders(badGame);
  });

  it("answers forbidden cross-parent access (403) with the API headers", async () => {
    const env: Env = { DB: fake.db, ACCOUNTS_ENABLED: "true" };
    const mine = await createPlayer(env, OWNER, 1);

    const read = await handleProgress(
      request(`/api/progress?playerId=${mine.id}`),
      env,
      resolveAs(authenticated(OTHER_PARENT)),
    );
    expect(read.status).toBe(403);
    expectApiHeaders(read);

    const write = await handleProgress(
      authRequest("/api/progress", "POST", {
        playerId: mine.id,
        gameId: "sudoku",
        schemaVersion: 1,
        baseRevision: 0,
        clientUpdatedAt: "2026-10-18T10:00:00.000Z",
        data: {},
        idempotencyKey: "key-1",
      }),
      env,
      resolveAs(authenticated(OTHER_PARENT)),
    );
    expect(write.status).toBe(403);
    expectApiHeaders(write);
  });

  it("answers a taken slot (409) and a foreign player delete (404) with the API headers", async () => {
    const env: Env = { DB: fake.db, ACCOUNTS_ENABLED: "true" };
    await createPlayer(env, OWNER, 1);
    const theirs = await createPlayer(env, OTHER_PARENT, 2);

    const taken = await handlePlayers(
      authRequest("/api/players", "POST", { slot: 1, avatar: "fox" }),
      env,
      resolveAs(authenticated(OWNER)),
    );
    expect(taken.status).toBe(409);
    expectApiHeaders(taken);

    // 404 by design: the endpoint must not confirm profiles of another parent.
    const foreign = await handlePlayerDelete(
      request(`/api/players/${theirs.id}`, "DELETE"),
      env,
      theirs.id,
      resolveAs(authenticated(OWNER)),
    );
    expect(foreign.status).toBe(404);
    expectApiHeaders(foreign);
  });

  it("answers oversized payloads (413) with the API headers", async () => {
    const env: Env = { DB: fake.db, ACCOUNTS_ENABLED: "true" };
    const player = await createPlayer(env, OWNER, 1);

    const tooLarge = await handleProgress(
      authRequest("/api/progress", "POST", {
        playerId: player.id,
        gameId: "sudoku",
        schemaVersion: 1,
        baseRevision: 0,
        clientUpdatedAt: "2026-10-18T10:00:00.000Z",
        data: { blob: "x".repeat(64 * 1024) },
        idempotencyKey: "key-1",
      }),
      env,
      resolveAs(authenticated(OWNER)),
    );

    expect(tooLarge.status).toBe(413);
    expectApiHeaders(tooLarge);
  });

  it("answers a failed D1 batch (500) with the API headers", async () => {
    const env: Env = { DB: fake.db, ACCOUNTS_ENABLED: "true" };
    const player = await createPlayer(env, OWNER, 1);
    const failingBatch = {
      ...fake.db,
      batch: async (): Promise<never> => {
        throw new Error("d1 is down");
      },
    } as unknown as D1Database;

    const response = await handleProgress(
      authRequest("/api/progress", "POST", {
        playerId: player.id,
        gameId: "sudoku",
        schemaVersion: 1,
        baseRevision: 0,
        clientUpdatedAt: "2026-10-18T10:00:00.000Z",
        data: { settings: {} },
        idempotencyKey: "key-1",
      }),
      { DB: failingBatch, ACCOUNTS_ENABLED: "true" },
      resolveAs(authenticated(OWNER)),
    );

    expect(response.status).toBe(500);
    expectApiHeaders(response);
    expect(await response.json()).toEqual({ error: "progress_write_failed" });
  });

  it("keeps the API headers on success responses and the body-less 204 delete", async () => {
    const env: Env = { DB: fake.db, ACCOUNTS_ENABLED: "true" };
    const player = await createPlayer(env, OWNER, 1);

    const list = await handlePlayers(request("/api/players"), env, resolveAs(authenticated(OWNER)));
    expect(list.status).toBe(200);
    expectApiHeaders(list);

    const written = await handleProgress(
      authRequest("/api/progress", "POST", {
        playerId: player.id,
        gameId: "sudoku",
        schemaVersion: 1,
        baseRevision: 0,
        clientUpdatedAt: "2026-10-18T10:00:00.000Z",
        data: { settings: { theme: "dark" } },
        idempotencyKey: "key-1",
      }),
      env,
      resolveAs(authenticated(OWNER)),
    );
    expect(written.status).toBe(200);
    expectApiHeaders(written);

    const deleted = await handlePlayerDelete(
      request(`/api/players/${player.id}`, "DELETE"),
      env,
      player.id,
      resolveAs(authenticated(OWNER)),
    );
    expect(deleted.status).toBe(204);
    expectSecurityHeaders(deleted);
  });
});
