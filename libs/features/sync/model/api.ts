import {
  parsePlayerResponse,
  parsePlayersResponse,
  parseProgressListResponse,
  parseProgressWriteResponse,
  type PlayerRecord,
  type ProgressDocument,
  type SyncGameId,
} from "@entities/progress";

const JSON_HEADERS = { Accept: "application/json" } as const;

export class ProgressApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ProgressApiError";
    this.status = status;
  }
}

export interface CreatePlayerInput {
  readonly slot: number;
  readonly avatar: string;
}

export interface PushProgressInput {
  readonly playerId: string;
  readonly gameId: SyncGameId;
  readonly schemaVersion: number;
  readonly baseRevision: number;
  readonly clientUpdatedAt: string;
  readonly data: unknown;
  readonly idempotencyKey: string;
}

export type PushProgressResult =
  | { readonly kind: "ok"; readonly document: ProgressDocument | null }
  | { readonly kind: "conflict"; readonly document: ProgressDocument };

export interface ProgressApi {
  hasSession(): Promise<boolean>;
  listPlayers(): Promise<readonly PlayerRecord[]>;
  createPlayer(input: CreatePlayerInput): Promise<PlayerRecord | null>;
  deletePlayer(playerId: string): Promise<void>;
  fetchProgress(playerId: string): Promise<readonly ProgressDocument[]>;
  pushProgress(
    input: PushProgressInput,
    options?: { readonly keepalive?: boolean },
  ): Promise<PushProgressResult>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

async function request(
  fetchImpl: typeof fetch,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetchImpl(path, {
    ...init,
    // Same origin only: the Worker serves both the app and the API.
    credentials: "same-origin",
    headers: { ...JSON_HEADERS, ...(init.headers ?? {}) },
  });
}

function assertOk(response: Response): void {
  if (!response.ok) {
    throw new ProgressApiError(response.status, `progress_api_${response.status}`);
  }
}

/**
 * Same-origin API client for players and progress. No base URL and no CORS:
 * the Worker runs on the same origin as the static app.
 */
export function createProgressApi(
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): ProgressApi {
  return {
    async hasSession() {
      const response = await request(fetchImpl, "/api/auth/get-session", { method: "GET" });
      if (!response.ok) {
        return false;
      }
      const body = await readJson(response);
      if (!isRecord(body)) {
        return false;
      }
      return body.session != null || body.user != null;
    },

    async listPlayers() {
      const response = await request(fetchImpl, "/api/players", { method: "GET" });
      assertOk(response);
      const parsed = parsePlayersResponse(await readJson(response));
      if (!parsed) {
        throw new ProgressApiError(response.status, "players_invalid");
      }
      return parsed.players;
    },

    async createPlayer(input) {
      const response = await request(fetchImpl, "/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: input.slot, avatar: input.avatar }),
      });
      if (!response.ok) {
        return null;
      }
      return parsePlayerResponse(await readJson(response));
    },

    async deletePlayer(playerId) {
      const response = await request(fetchImpl, `/api/players/${encodeURIComponent(playerId)}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 404) {
        throw new ProgressApiError(response.status, `delete_player_${response.status}`);
      }
    },

    async fetchProgress(playerId) {
      const query = new URLSearchParams({ playerId });
      const response = await request(fetchImpl, `/api/progress?${query.toString()}`, {
        method: "GET",
      });
      assertOk(response);
      const parsed = parseProgressListResponse(await readJson(response));
      if (!parsed) {
        throw new ProgressApiError(response.status, "progress_invalid");
      }
      return parsed.progress;
    },

    async pushProgress(input, options = {}) {
      const response = await request(fetchImpl, "/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: input.playerId,
          gameId: input.gameId,
          schemaVersion: input.schemaVersion,
          baseRevision: input.baseRevision,
          clientUpdatedAt: input.clientUpdatedAt,
          data: input.data,
          idempotencyKey: input.idempotencyKey,
        }),
        ...(options.keepalive ? { keepalive: true } : {}),
      });

      if (response.status === 409) {
        const document = parseProgressWriteResponse(await readJson(response));
        if (!document) {
          throw new ProgressApiError(409, "conflict_document_invalid");
        }
        return { kind: "conflict", document };
      }
      assertOk(response);

      const raw = await readJson(response);
      const document = raw === null ? null : parseProgressWriteResponse(raw);
      if (raw !== null && !document) {
        throw new ProgressApiError(response.status, "progress_write_invalid");
      }
      return { kind: "ok", document };
    },
  };
}
