import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Env } from "../../apps/api/src/env";
import {
  MAX_PLAYERS,
  handlePlayerDelete,
  handlePlayers,
  type PlayerView,
} from "../../apps/api/src/players";
import type { SessionResolver } from "../../apps/api/src/session";
import { createFakeD1, type FakeD1 } from "./fake-d1";

const OWNER = "parent_owner";
const OTHER_PARENT = "parent_other";
const BASE_URL = "https://games.example.invalid";

const resolveAs =
  (userId: string): SessionResolver =>
  async () => ({ status: "authenticated", userId });

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

async function postPlayer(slot: number, avatar = "bear", owner = OWNER): Promise<Response> {
  return handlePlayers(
    jsonRequest("/api/players", "POST", { slot, avatar }),
    env,
    resolveAs(owner),
  );
}

async function createPlayer(slot: number, avatar = "bear", owner = OWNER): Promise<PlayerView> {
  const response = await postPlayer(slot, avatar, owner);
  expect(response.status).toBe(201);
  const body = (await response.json()) as { player: PlayerView };
  return body.player;
}

describe("GET /api/players", () => {
  it("lists only the parent's active profiles, ordered by slot", async () => {
    await createPlayer(3, "fox");
    await createPlayer(1, "bear");
    await createPlayer(2, "panda", OTHER_PARENT);

    const response = await handlePlayers(apiRequest("/api/players"), env, resolveAs(OWNER));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      players: [
        {
          id: expect.stringMatching(/^player_/),
          slot: 1,
          avatar: "bear",
          createdAt: expect.any(String),
        },
        {
          id: expect.stringMatching(/^player_/),
          slot: 3,
          avatar: "fox",
          createdAt: expect.any(String),
        },
      ],
    });
  });

  it("returns an empty list for a new parent", async () => {
    const response = await handlePlayers(apiRequest("/api/players"), env, resolveAs(OWNER));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ players: [] });
  });

  it("rejects other methods with 405", async () => {
    const response = await handlePlayers(
      apiRequest("/api/players", { method: "PUT" }),
      env,
      resolveAs(OWNER),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, POST");
  });
});

describe("POST /api/players", () => {
  it("creates a profile with only a slot and an avatar", async () => {
    const response = await postPlayer(2, "unicorn");
    const { player } = (await response.json()) as { player: PlayerView };

    expect(response.status).toBe(201);
    expect(player).toEqual({
      id: expect.stringMatching(/^player_[0-9a-f-]{36}$/),
      slot: 2,
      avatar: "unicorn",
      createdAt: expect.any(String),
    });
    expect(
      fake.count(`SELECT COUNT(*) AS count FROM "player" WHERE "ownerUserId" = ?`, OWNER),
    ).toBe(1);

    const row = fake.rows<Record<string, unknown>>(`SELECT * FROM "player"`)[0];
    expect(Object.keys(row).sort()).toEqual(
      ["avatar", "createdAt", "deletedAt", "id", "ownerUserId", "slot"].sort(),
    );
  });

  it("allows four profiles and rejects the fifth", async () => {
    for (let slot = 1; slot <= MAX_PLAYERS; slot += 1) {
      const response = await postPlayer(slot, "bear");
      expect(response.status).toBe(201);
    }

    const response = await postPlayer(MAX_PLAYERS, "fox");

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "player_slot_taken", field: "slot" });
    expect(fake.count(`SELECT COUNT(*) AS count FROM "player" WHERE "deletedAt" IS NULL`)).toBe(4);
  });

  it("enforces the profile limit even if rows already exceed the slots", async () => {
    for (const slot of [5, 6, 7, 8]) {
      fake.sqlite
        .prepare(
          `INSERT INTO "player" ("id", "ownerUserId", "slot", "avatar", "createdAt")
           VALUES (?, ?, ?, 'bear', '2026-10-18T10:00:00.000Z')`,
        )
        .run(`player_extra_${slot}`, OWNER, slot);
    }

    const response = await postPlayer(1);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "player_limit_reached" });
  });

  it("rejects a slot that is already in use", async () => {
    await createPlayer(1);

    const response = await postPlayer(1, "fox");

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "player_slot_taken", field: "slot" });
  });

  it("lets another parent use the same slot", async () => {
    const first = await postPlayer(1, "bear", OWNER);
    const second = await postPlayer(1, "fox", OTHER_PARENT);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
  });

  it.each([
    ["a missing slot", {}, "slot"],
    ["slot 0", { slot: 0, avatar: "bear" }, "slot"],
    ["slot 5", { slot: 5, avatar: "bear" }, "slot"],
    ["a fractional slot", { slot: 1.5, avatar: "bear" }, "slot"],
    ["a non-numeric slot", { slot: "1", avatar: "bear" }, "slot"],
    ["a missing avatar", { slot: 1 }, "avatar"],
    ["an empty avatar", { slot: 1, avatar: "" }, "avatar"],
    ["an avatar with unsafe characters", { slot: 1, avatar: "Beer!" }, "avatar"],
  ])("rejects %s", async (_label, body, field) => {
    const response = await handlePlayers(
      jsonRequest("/api/players", "POST", body),
      env,
      resolveAs(OWNER),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request", field });
  });

  it("rejects a body that is not a JSON object", async () => {
    const response = await handlePlayers(
      apiRequest("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
      env,
      resolveAs(OWNER),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_json" });
  });
});

describe("DELETE /api/players/:id", () => {
  it("soft-deletes the profile and its progress in one batch", async () => {
    const player = await createPlayer(1);
    fake.sqlite
      .prepare(
        `INSERT INTO "progress"
           ("playerId", "gameId", "schemaVersion", "revision", "dataJson",
            "clientUpdatedAt", "serverUpdatedAt")
         VALUES (?, 'sudoku', 1, 1, '{}', '2026-10-18T10:00:00.000Z', '2026-10-18T10:00:00.000Z')`,
      )
      .run(player.id);

    const response = await handlePlayerDelete(
      apiRequest(`/api/players/${player.id}`, { method: "DELETE" }),
      env,
      player.id,
      resolveAs(OWNER),
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const players = fake.rows<{ deletedAt: string | null }>(
      `SELECT "deletedAt" FROM "player" WHERE "id" = ?`,
      player.id,
    );
    expect(players[0]?.deletedAt).toEqual(expect.any(String));

    const progress = fake.rows<{ deletedAt: string | null }>(
      `SELECT "deletedAt" FROM "progress" WHERE "playerId" = ?`,
      player.id,
    );
    expect(progress).toHaveLength(1);
    expect(progress[0]?.deletedAt).toEqual(expect.any(String));

    const list = await handlePlayers(apiRequest("/api/players"), env, resolveAs(OWNER));
    expect(await list.json()).toEqual({ players: [] });
  });

  it("frees the slot for a new profile", async () => {
    const player = await createPlayer(1);

    await handlePlayerDelete(
      apiRequest(`/api/players/${player.id}`, { method: "DELETE" }),
      env,
      player.id,
      resolveAs(OWNER),
    );

    const response = await postPlayer(1, "fox");
    expect(response.status).toBe(201);
  });

  it("does not delete another parent's profile", async () => {
    const player = await createPlayer(1, "bear", OTHER_PARENT);

    const response = await handlePlayerDelete(
      apiRequest(`/api/players/${player.id}`, { method: "DELETE" }),
      env,
      player.id,
      resolveAs(OWNER),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "player_not_found" });
    expect(
      fake.count(
        `SELECT COUNT(*) AS count FROM "player" WHERE "id" = ? AND "deletedAt" IS NULL`,
        player.id,
      ),
    ).toBe(1);
  });

  it("returns 404 for an unknown profile", async () => {
    const response = await handlePlayerDelete(
      apiRequest("/api/players/player_missing", { method: "DELETE" }),
      env,
      "player_missing",
      resolveAs(OWNER),
    );

    expect(response.status).toBe(404);
  });

  it("rejects other methods with 405", async () => {
    const response = await handlePlayerDelete(
      apiRequest("/api/players/player_x"),
      env,
      "player_x",
      resolveAs(OWNER),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("DELETE");
  });
});
