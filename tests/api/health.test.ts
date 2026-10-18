import { describe, expect, it } from "vitest";
import apiWorker from "../../apps/api/src/index";
import type { Env } from "../../apps/api/src/env";

interface HealthRow {
  ok: number;
}

interface FakeDatabase {
  db: D1Database;
  queries: string[];
}

function createDatabase(options: { row?: HealthRow | null; error?: Error } = {}): FakeDatabase {
  const queries: string[] = [];
  const db = {
    prepare(query: string) {
      queries.push(query);
      return {
        first: async (): Promise<HealthRow | null> => {
          if (options.error) {
            throw options.error;
          }
          return options.row === undefined ? { ok: 1 } : options.row;
        },
      };
    },
  } as unknown as D1Database;

  return { db, queries };
}

function createEnv(database: FakeDatabase, accountsEnabled = "false"): Env {
  return { DB: database.db, ACCOUNTS_ENABLED: accountsEnabled };
}

function apiRequest(path: string, method = "GET"): Request {
  return new Request(`https://games.example.invalid${path}`, { method });
}

function expectApiHeaders(response: Response): void {
  expect(response.headers.get("Content-Type")).toBe("application/json");
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  expect(response.headers.get("Content-Security-Policy")).toBe(
    "default-src 'none'; frame-ancestors 'none'",
  );
}

describe("GET /api/health", () => {
  it("returns 200 and checks D1 with SELECT 1", async () => {
    const database = createDatabase();
    const response = await apiWorker.fetch(apiRequest("/api/health"), createEnv(database));

    expect(response.status).toBe(200);
    expectApiHeaders(response);
    expect(await response.json()).toEqual({ status: "ok", database: "ok" });
    expect(database.queries).toEqual(["SELECT 1 AS ok"]);
  });

  it("returns 503 when D1 throws", async () => {
    const database = createDatabase({ error: new Error("D1 unavailable") });
    const response = await apiWorker.fetch(apiRequest("/api/health"), createEnv(database));

    expect(response.status).toBe(503);
    expectApiHeaders(response);
    expect(await response.json()).toEqual({ status: "error", database: "unavailable" });
  });

  it("returns 503 when the query returns an unexpected row", async () => {
    const database = createDatabase({ row: null });
    const response = await apiWorker.fetch(apiRequest("/api/health"), createEnv(database));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "error", database: "unavailable" });
  });

  it("rejects non-GET methods with 405 and an Allow header", async () => {
    const database = createDatabase();
    const response = await apiWorker.fetch(apiRequest("/api/health", "POST"), createEnv(database));

    expect(response.status).toBe(405);
    expectApiHeaders(response);
    expect(response.headers.get("Allow")).toBe("GET");
    expect(await response.json()).toEqual({ error: "method_not_allowed" });
    expect(database.queries).toEqual([]);
  });
});

describe("unknown API routes", () => {
  it("returns a JSON 404 with API headers", async () => {
    const database = createDatabase();
    const response = await apiWorker.fetch(apiRequest("/api/does-not-exist"), createEnv(database));

    expect(response.status).toBe(404);
    expectApiHeaders(response);
    expect(await response.json()).toEqual({ error: "not_found" });
    expect(database.queries).toEqual([]);
  });
});
