import { describe, expect, it } from "vitest";
import apiWorker from "../../apps/api/src/index";
import { googleCallbackUrl, readAuthSettings } from "../../apps/api/src/auth-config";
import { getAuth } from "../../apps/api/src/auth";
import { withApiHeaders } from "../../apps/api/src/response";
import type { Env } from "../../apps/api/src/env";

const configuredEnv = {
  ACCOUNTS_ENABLED: "true",
  BETTER_AUTH_SECRET: "test-secret-with-at-least-32-characters",
  BETTER_AUTH_URL: "https://games.example.invalid",
  GOOGLE_CLIENT_ID: "client-id.example.invalid",
  GOOGLE_CLIENT_SECRET: "client-secret.example.invalid",
} as const;

function createEnv(overrides: Partial<Env> = {}): Env {
  const database = {
    prepare: () => ({
      first: async () => ({ ok: 1 }),
    }),
    batch: async () => [],
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database;

  return { DB: database, ACCOUNTS_ENABLED: "false", ...overrides };
}

function apiRequest(path: string, method = "GET"): Request {
  return new Request(`https://games.example.invalid${path}`, { method });
}

function expectApiHeaders(response: Response): void {
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  expect(response.headers.get("Content-Security-Policy")).toBe(
    "default-src 'none'; frame-ancestors 'none'",
  );
}

describe("readAuthSettings", () => {
  it("returns normalized settings when the flag and every value are present", () => {
    expect(
      readAuthSettings(
        createEnv({ ...configuredEnv, BETTER_AUTH_URL: "https://games.example.invalid/" }),
      ),
    ).toEqual({
      baseURL: "https://games.example.invalid",
      secret: configuredEnv.BETTER_AUTH_SECRET,
      googleClientId: configuredEnv.GOOGLE_CLIENT_ID,
      googleClientSecret: configuredEnv.GOOGLE_CLIENT_SECRET,
      rpID: "games.example.invalid",
    });
  });

  it("returns null while accounts are disabled", () => {
    expect(readAuthSettings(createEnv({ ...configuredEnv, ACCOUNTS_ENABLED: "false" }))).toBeNull();
  });

  it("builds a Better Auth instance only with a complete configuration", () => {
    expect(getAuth(createEnv(configuredEnv))).not.toBeNull();
    expect(getAuth(createEnv())).toBeNull();
  });

  it.each([
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ] as const)("returns null when %s is missing", (key) => {
    expect(readAuthSettings(createEnv({ ...configuredEnv, [key]: "" }))).toBeNull();
  });

  it("returns null for an invalid base URL", () => {
    expect(
      readAuthSettings(createEnv({ ...configuredEnv, BETTER_AUTH_URL: "not a url" })),
    ).toBeNull();
  });

  it("rejects a secret shorter than 32 characters", () => {
    expect(
      readAuthSettings(createEnv({ ...configuredEnv, BETTER_AUTH_SECRET: "kort" })),
    ).toBeNull();
  });

  it("builds the exact Google callback URL", () => {
    const settings = readAuthSettings(createEnv(configuredEnv));
    if (!settings) {
      throw new Error("expected configured settings");
    }
    expect(googleCallbackUrl(settings)).toBe(
      "https://games.example.invalid/api/auth/callback/google",
    );
  });
});

describe("withApiHeaders", () => {
  it("keeps cookies and redirects while adding API security headers", () => {
    const original = new Response(null, {
      status: 302,
      headers: {
        Location: "https://accounts.example.invalid/o/oauth2/auth",
        "Set-Cookie": "spellen.session=test; HttpOnly; SameSite=Lax",
      },
    });

    const response = withApiHeaders(original);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("https://accounts.example.invalid/o/oauth2/auth");
    expect(response.headers.get("Set-Cookie")).toContain("spellen.session=test");
    expectApiHeaders(response);
  });
});

describe("/api/auth routes without configuration", () => {
  it("returns a JSON 503 when accounts are disabled", async () => {
    const response = await apiWorker.fetch(apiRequest("/api/auth/ok"), createEnv());

    expect(response.status).toBe(503);
    expectApiHeaders(response);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
  });

  it("returns a JSON 503 when a secret is missing", async () => {
    const response = await apiWorker.fetch(
      apiRequest("/api/auth/sign-in/social", "POST"),
      createEnv({ ...configuredEnv, GOOGLE_CLIENT_SECRET: "" }),
    );

    expect(response.status).toBe(503);
    expectApiHeaders(response);
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
  });

  it("keeps health available without auth configuration", async () => {
    const response = await apiWorker.fetch(apiRequest("/api/health"), createEnv());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", database: "ok" });
  });

  it("keeps unknown API routes as JSON 404", async () => {
    const response = await apiWorker.fetch(
      apiRequest("/api/does-not-exist"),
      createEnv(configuredEnv),
    );

    expect(response.status).toBe(404);
    expectApiHeaders(response);
    expect(await response.json()).toEqual({ error: "not_found" });
  });
});
