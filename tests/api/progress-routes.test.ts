import { afterEach, beforeEach, describe, expect, it } from "vitest";
import apiWorker from "../../apps/api/src/index";
import type { Env } from "../../apps/api/src/env";
import { handlePlayers } from "../../apps/api/src/players";
import { handleProgress } from "../../apps/api/src/progress";
import type { SessionResolver } from "../../apps/api/src/session";
import { createFakeD1, type FakeD1 } from "./fake-d1";

let fake: FakeD1;

beforeEach(() => {
  fake = createFakeD1();
});

afterEach(() => {
  fake.close();
});

function createEnv(): Env {
  return { DB: fake.db, ACCOUNTS_ENABLED: "false" };
}

function apiRequest(path: string, method = "GET"): Request {
  return new Request(`https://games.example.invalid${path}`, { method });
}

function expectApiHeaders(response: Response): void {
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("Content-Type")).toBe("application/json");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  expect(response.headers.get("Content-Security-Policy")).toBe(
    "default-src 'none'; frame-ancestors 'none'",
  );
}

const unauthenticated: SessionResolver = async () => ({ status: "unauthenticated" });

describe("player and progress routes without auth", () => {
  it.each([
    ["/api/players", "GET"],
    ["/api/players", "POST"],
    ["/api/players/player_example", "DELETE"],
    ["/api/progress?playerId=player_example", "GET"],
    ["/api/progress", "POST"],
  ])("returns 503 for %s %s while accounts are disabled", async (path, method) => {
    const response = await apiWorker.fetch(apiRequest(path, method), createEnv());

    expect(response.status).toBe(503);
    expectApiHeaders(response);
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
  });

  it("returns 401 on players without a session", async () => {
    const response = await handlePlayers(apiRequest("/api/players"), createEnv(), unauthenticated);

    expect(response.status).toBe(401);
    expectApiHeaders(response);
    expect(await response.json()).toEqual({ error: "unauthorized" });
  });

  it("returns 401 on progress without a session", async () => {
    const response = await handleProgress(
      apiRequest("/api/progress?playerId=player_example"),
      createEnv(),
      unauthenticated,
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
  });

  it("keeps the routes out of the auth catch-all", async () => {
    const response = await apiWorker.fetch(
      apiRequest("/api/players/player_example", "POST"),
      createEnv(),
    );

    // 405 from the player route, not a 404 or a Better Auth handler response.
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("DELETE");
    expect(await response.json()).toEqual({ error: "method_not_allowed" });
  });
});
