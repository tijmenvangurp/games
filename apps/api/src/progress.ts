import type { Env } from "./env";
import { isProgressGameId } from "./game-ids";
import { isRecord, readJsonRecord } from "./request";
import { invalidField, jsonResponse, methodNotAllowed } from "./response";
import { authorize, resolveSession, type SessionResolver } from "./session";

/** Hard limit for the serialized `data` object (UTF-8 bytes). */
export const MAX_PROGRESS_BYTES = 64 * 1024;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const MAX_PLAYER_ID_LENGTH = 128;

interface ProgressRow {
  readonly playerId: string;
  readonly gameId: string;
  readonly schemaVersion: number;
  readonly revision: number;
  readonly dataJson: string;
  readonly clientUpdatedAt: string;
  readonly serverUpdatedAt: string;
}

interface MutationRow {
  readonly idempotencyKey: string;
  readonly playerId: string;
  readonly gameId: string;
  readonly appliedRevision: number;
}

export interface ProgressView {
  readonly gameId: string;
  readonly schemaVersion: number;
  readonly revision: number;
  readonly data: unknown;
  readonly clientUpdatedAt: string;
  readonly serverUpdatedAt: string;
}

interface MutationKey {
  readonly playerId: string;
  readonly gameId: string;
  readonly idempotencyKey: string;
}

interface MutationRevision {
  readonly schemaVersion: number;
  readonly baseRevision: number;
  readonly clientUpdatedAt: string;
}

interface EncodedData {
  readonly data: Record<string, unknown>;
  readonly dataJson: string;
}

interface MutationInput extends MutationKey, MutationRevision, EncodedData {}

function forbidden(): Response {
  return jsonResponse({ error: "forbidden" }, 403);
}

function conflict(progress: ProgressView | null): Response {
  return jsonResponse({ error: "conflict", progress }, 409);
}

function toView(row: ProgressRow): ProgressView {
  let data: unknown = null;
  try {
    data = JSON.parse(row.dataJson);
  } catch {
    data = null;
  }

  return {
    gameId: row.gameId,
    schemaVersion: row.schemaVersion,
    revision: row.revision,
    data,
    clientUpdatedAt: row.clientUpdatedAt,
    serverUpdatedAt: row.serverUpdatedAt,
  };
}

async function ownsPlayer(env: Env, ownerUserId: string, playerId: string): Promise<boolean> {
  const player = await env.DB.prepare(
    `SELECT "id" FROM "player"
     WHERE "id" = ? AND "ownerUserId" = ? AND "deletedAt" IS NULL`,
  )
    .bind(playerId, ownerUserId)
    .first<{ id: string }>();

  return Boolean(player);
}

async function loadProgress(
  env: Env,
  playerId: string,
  gameId: string,
): Promise<ProgressRow | null> {
  return env.DB.prepare(
    `SELECT "playerId", "gameId", "schemaVersion", "revision", "dataJson",
            "clientUpdatedAt", "serverUpdatedAt"
     FROM "progress"
     WHERE "playerId" = ? AND "gameId" = ? AND "deletedAt" IS NULL`,
  )
    .bind(playerId, gameId)
    .first<ProgressRow>();
}

async function loadMutation(env: Env, idempotencyKey: string): Promise<MutationRow | null> {
  return env.DB.prepare(
    `SELECT "idempotencyKey", "playerId", "gameId", "appliedRevision"
     FROM "progress_mutation" WHERE "idempotencyKey" = ?`,
  )
    .bind(idempotencyKey)
    .first<MutationRow>();
}

async function readProgress(request: Request, env: Env, ownerUserId: string): Promise<Response> {
  const playerId = new URL(request.url).searchParams.get("playerId");
  if (!playerId || playerId.length > MAX_PLAYER_ID_LENGTH) {
    return invalidField("playerId");
  }

  if (!(await ownsPlayer(env, ownerUserId, playerId))) {
    return forbidden();
  }

  const result = await env.DB.prepare(
    `SELECT "playerId", "gameId", "schemaVersion", "revision", "dataJson",
            "clientUpdatedAt", "serverUpdatedAt"
     FROM "progress"
     WHERE "playerId" = ? AND "deletedAt" IS NULL
     ORDER BY "gameId" ASC`,
  )
    .bind(playerId)
    .all<ProgressRow>();

  return jsonResponse({ progress: result.results.map(toView) });
}

function parseMutationKey(body: Record<string, unknown>): MutationKey | Response {
  const { playerId, gameId, idempotencyKey } = body;

  if (typeof playerId !== "string" || !playerId || playerId.length > MAX_PLAYER_ID_LENGTH) {
    return invalidField("playerId");
  }
  if (!isProgressGameId(gameId)) {
    return invalidField("gameId");
  }
  if (typeof idempotencyKey !== "string" || !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    return invalidField("idempotencyKey");
  }

  return { playerId, gameId, idempotencyKey };
}

function parseMutationRevision(body: Record<string, unknown>): MutationRevision | Response {
  const { schemaVersion, baseRevision, clientUpdatedAt } = body;

  if (typeof schemaVersion !== "number" || !Number.isInteger(schemaVersion) || schemaVersion < 1) {
    return invalidField("schemaVersion");
  }
  if (typeof baseRevision !== "number" || !Number.isInteger(baseRevision) || baseRevision < 0) {
    return invalidField("baseRevision");
  }
  if (typeof clientUpdatedAt !== "string" || Number.isNaN(Date.parse(clientUpdatedAt))) {
    return invalidField("clientUpdatedAt");
  }

  return {
    schemaVersion,
    baseRevision,
    clientUpdatedAt: new Date(clientUpdatedAt).toISOString(),
  };
}

function encodeData(value: unknown): EncodedData | Response {
  if (!isRecord(value)) {
    return invalidField("data");
  }

  let dataJson: string;
  try {
    dataJson = JSON.stringify(value);
  } catch {
    return invalidField("data");
  }

  if (new TextEncoder().encode(dataJson).byteLength > MAX_PROGRESS_BYTES) {
    return jsonResponse({ error: "payload_too_large", field: "data" }, 413);
  }

  return { data: value, dataJson };
}

function parseMutationInput(body: Record<string, unknown>): MutationInput | Response {
  const key = parseMutationKey(body);
  if (key instanceof Response) {
    return key;
  }

  const revision = parseMutationRevision(body);
  if (revision instanceof Response) {
    return revision;
  }

  const encoded = encodeData(body.data);
  if (encoded instanceof Response) {
    return encoded;
  }

  return { ...key, ...revision, ...encoded };
}

/** Replays a known idempotency key without applying the mutation again. */
async function replayMutation(env: Env, input: MutationInput): Promise<Response | null> {
  const previous = await loadMutation(env, input.idempotencyKey);
  if (!previous) {
    return null;
  }

  if (previous.playerId !== input.playerId || previous.gameId !== input.gameId) {
    return jsonResponse({ error: "idempotency_key_reuse" }, 409);
  }

  const current = await loadProgress(env, input.playerId, input.gameId);
  return current ? jsonResponse({ progress: toView(current) }) : conflict(null);
}

/**
 * Writes the progress upsert and the idempotency row in one D1 batch. Returns
 * the number of changed progress rows, or a ready-made response when the batch
 * failed or a concurrent retry won the race.
 */
async function commitMutation(
  env: Env,
  input: MutationInput,
  revision: number,
  serverUpdatedAt: string,
): Promise<number | Response> {
  const upsert = env.DB.prepare(
    `INSERT INTO "progress"
       ("playerId", "gameId", "schemaVersion", "revision", "dataJson",
        "clientUpdatedAt", "serverUpdatedAt", "deletedAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT ("playerId", "gameId") DO UPDATE SET
       "schemaVersion" = excluded."schemaVersion",
       "revision" = excluded."revision",
       "dataJson" = excluded."dataJson",
       "clientUpdatedAt" = excluded."clientUpdatedAt",
       "serverUpdatedAt" = excluded."serverUpdatedAt",
       "deletedAt" = NULL
     WHERE "progress"."revision" = ?`,
  ).bind(
    input.playerId,
    input.gameId,
    input.schemaVersion,
    revision,
    input.dataJson,
    input.clientUpdatedAt,
    serverUpdatedAt,
    input.baseRevision,
  );

  const mutation = env.DB.prepare(
    `INSERT INTO "progress_mutation"
       ("idempotencyKey", "playerId", "gameId", "appliedRevision", "createdAt")
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(input.idempotencyKey, input.playerId, input.gameId, revision, serverUpdatedAt);

  try {
    const results = await env.DB.batch([upsert, mutation]);
    return results[0]?.meta.changes ?? 0;
  } catch {
    // A concurrent request may have inserted the same idempotency key first.
    const retried = await loadMutation(env, input.idempotencyKey);
    if (retried && retried.playerId === input.playerId && retried.gameId === input.gameId) {
      const latest = await loadProgress(env, input.playerId, input.gameId);
      if (latest) {
        return jsonResponse({ progress: toView(latest) });
      }
    }
    return jsonResponse({ error: "progress_write_failed" }, 500);
  }
}

async function applyMutation(
  env: Env,
  input: MutationInput,
  current: ProgressRow | null,
): Promise<Response> {
  const revision = (current?.revision ?? 0) + 1;
  const serverUpdatedAt = new Date().toISOString();
  const outcome = await commitMutation(env, input, revision, serverUpdatedAt);

  if (outcome instanceof Response) {
    return outcome;
  }

  if (outcome === 0) {
    // The guarded upsert lost a race; return the document the client must merge.
    const latest = await loadProgress(env, input.playerId, input.gameId);
    return conflict(latest ? toView(latest) : null);
  }

  return jsonResponse({
    progress: {
      gameId: input.gameId,
      schemaVersion: input.schemaVersion,
      revision,
      data: input.data,
      clientUpdatedAt: input.clientUpdatedAt,
      serverUpdatedAt,
    } satisfies ProgressView,
  });
}

async function writeProgress(request: Request, env: Env, ownerUserId: string): Promise<Response> {
  const body = await readJsonRecord(request);
  if (body instanceof Response) {
    return body;
  }

  const input = parseMutationInput(body);
  if (input instanceof Response) {
    return input;
  }

  if (!(await ownsPlayer(env, ownerUserId, input.playerId))) {
    return forbidden();
  }

  const replay = await replayMutation(env, input);
  if (replay) {
    return replay;
  }

  const current = await loadProgress(env, input.playerId, input.gameId);
  if (input.baseRevision !== (current?.revision ?? 0)) {
    return conflict(current ? toView(current) : null);
  }

  return applyMutation(env, input, current);
}

/**
 * Handles `/api/progress`: read all synced progress for one of the parent's
 * profiles, or apply an idempotent, revision-guarded write.
 */
export async function handleProgress(
  request: Request,
  env: Env,
  resolve: SessionResolver = resolveSession,
): Promise<Response> {
  const auth = await authorize(request, env, resolve);
  if ("response" in auth) {
    return auth.response;
  }

  if (request.method === "GET") {
    return readProgress(request, env, auth.userId);
  }

  if (request.method === "POST") {
    return writeProgress(request, env, auth.userId);
  }

  return methodNotAllowed("GET, POST");
}
