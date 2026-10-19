import type { Env } from "./env";
import { readJsonRecord } from "./request";
import { emptyResponse, invalidField, jsonResponse, methodNotAllowed } from "./response";
import { authorize, resolveSession, type SessionResolver } from "./session";

/** Maximum number of child profiles below one parent account. */
export const MAX_PLAYERS = 4;
const SLOT_MIN = 1;
const SLOT_MAX = 4;
const AVATAR_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/;
const MAX_PLAYER_ID_LENGTH = 128;

export interface PlayerView {
  readonly id: string;
  readonly slot: number;
  readonly avatar: string;
  readonly createdAt: string;
}

interface PlayerRow {
  readonly id: string;
  readonly slot: number;
  readonly avatar: string;
  readonly createdAt: string;
}

function toView(row: PlayerRow): PlayerView {
  return {
    id: row.id,
    slot: row.slot,
    avatar: row.avatar,
    createdAt: row.createdAt,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed/i.test(error.message);
}

async function findActivePlayer(env: Env, ownerUserId: string, playerId: string) {
  return env.DB.prepare(
    `SELECT "id" FROM "player"
     WHERE "id" = ? AND "ownerUserId" = ? AND "deletedAt" IS NULL`,
  )
    .bind(playerId, ownerUserId)
    .first<{ id: string }>();
}

async function listPlayers(env: Env, ownerUserId: string): Promise<Response> {
  const result = await env.DB.prepare(
    `SELECT "id", "slot", "avatar", "createdAt" FROM "player"
     WHERE "ownerUserId" = ? AND "deletedAt" IS NULL
     ORDER BY "slot" ASC`,
  )
    .bind(ownerUserId)
    .all<PlayerRow>();

  return jsonResponse({ players: result.results.map(toView) });
}

interface PlayerInput {
  readonly slot: number;
  readonly avatar: string;
}

function parsePlayerInput(body: Record<string, unknown>): PlayerInput | Response {
  const { slot, avatar } = body;

  if (typeof slot !== "number" || !Number.isInteger(slot) || slot < SLOT_MIN || slot > SLOT_MAX) {
    return invalidField("slot");
  }
  if (typeof avatar !== "string" || !AVATAR_PATTERN.test(avatar)) {
    return invalidField("avatar");
  }

  return { slot, avatar };
}

async function insertPlayer(env: Env, ownerUserId: string, input: PlayerInput): Promise<Response> {
  const existingSlot = await env.DB.prepare(
    `SELECT "id" FROM "player"
     WHERE "ownerUserId" = ? AND "slot" = ? AND "deletedAt" IS NULL`,
  )
    .bind(ownerUserId, input.slot)
    .first<{ id: string }>();

  if (existingSlot) {
    return jsonResponse({ error: "player_slot_taken", field: "slot" }, 409);
  }

  const id = `player_${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();

  try {
    const result = await env.DB.prepare(
      `INSERT INTO "player" ("id", "ownerUserId", "slot", "avatar", "createdAt", "deletedAt")
       SELECT ?, ?, ?, ?, ?, NULL
       WHERE (
         SELECT COUNT(*) FROM "player"
         WHERE "ownerUserId" = ? AND "deletedAt" IS NULL
       ) < ?`,
    )
      .bind(id, ownerUserId, input.slot, input.avatar, createdAt, ownerUserId, MAX_PLAYERS)
      .run();

    if (result.meta.changes === 0) {
      return jsonResponse({ error: "player_limit_reached" }, 409);
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return jsonResponse({ error: "player_slot_taken", field: "slot" }, 409);
    }
    return jsonResponse({ error: "player_create_failed" }, 500);
  }

  return jsonResponse({ player: { id, slot: input.slot, avatar: input.avatar, createdAt } }, 201);
}

async function createPlayer(request: Request, env: Env, ownerUserId: string): Promise<Response> {
  const body = await readJsonRecord(request);
  if (body instanceof Response) {
    return body;
  }

  const input = parsePlayerInput(body);
  if (input instanceof Response) {
    return input;
  }

  return insertPlayer(env, ownerUserId, input);
}

/**
 * Handles `/api/players`: list or create a child profile for the signed-in
 * parent. A profile has only a slot and an avatar; the server never stores a
 * child's name or e-mail.
 */
export async function handlePlayers(
  request: Request,
  env: Env,
  resolve: SessionResolver = resolveSession,
): Promise<Response> {
  const auth = await authorize(request, env, resolve);
  if ("response" in auth) {
    return auth.response;
  }

  if (request.method === "GET") {
    return listPlayers(env, auth.userId);
  }

  if (request.method === "POST") {
    return createPlayer(request, env, auth.userId);
  }

  return methodNotAllowed("GET, POST");
}

/**
 * Handles `DELETE /api/players/:id`. Soft-deletes the profile and its progress
 * in one D1 batch. Another parent's profile is reported as not found so the
 * endpoint does not confirm that it exists.
 */
export async function handlePlayerDelete(
  request: Request,
  env: Env,
  playerId: string,
  resolve: SessionResolver = resolveSession,
): Promise<Response> {
  if (request.method !== "DELETE") {
    return methodNotAllowed("DELETE");
  }

  const auth = await authorize(request, env, resolve);
  if ("response" in auth) {
    return auth.response;
  }

  if (!playerId || playerId.length > MAX_PLAYER_ID_LENGTH) {
    return jsonResponse({ error: "player_not_found" }, 404);
  }

  const player = await findActivePlayer(env, auth.userId, playerId);
  if (!player) {
    return jsonResponse({ error: "player_not_found" }, 404);
  }

  const deletedAt = new Date().toISOString();

  try {
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE "player" SET "deletedAt" = ?
         WHERE "id" = ? AND "ownerUserId" = ? AND "deletedAt" IS NULL`,
      ).bind(deletedAt, playerId, auth.userId),
      env.DB.prepare(
        `UPDATE "progress" SET "deletedAt" = ?
         WHERE "playerId" = ? AND "deletedAt" IS NULL`,
      ).bind(deletedAt, playerId),
    ]);
  } catch {
    return jsonResponse({ error: "player_delete_failed" }, 500);
  }

  return emptyResponse(204);
}
