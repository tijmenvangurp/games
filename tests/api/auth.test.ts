import { describe, expect, it } from "vitest";
import apiWorker from "../../apps/api/src/index";
import {
  googleCallbackUrl,
  isGoogleConfigured,
  readAuthSettings,
} from "../../apps/api/src/auth-config";
import { getAuth } from "../../apps/api/src/auth";
import { verifyPasskeyContext } from "../../apps/api/src/passkey-context";
import { withApiHeaders } from "../../apps/api/src/response";
import type { Env } from "../../apps/api/src/env";

const passkeyOnlyEnv = {
  ACCOUNTS_ENABLED: "true",
  BETTER_AUTH_SECRET: "test-secret-with-at-least-32-characters",
  BETTER_AUTH_URL: "https://games.example.invalid",
} as const;

const configuredEnv = {
  ...passkeyOnlyEnv,
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

  it("supports passkey-only configuration without Google", () => {
    const settings = readAuthSettings(createEnv(passkeyOnlyEnv));

    expect(settings).toEqual({
      baseURL: "https://games.example.invalid",
      secret: passkeyOnlyEnv.BETTER_AUTH_SECRET,
      googleClientId: null,
      googleClientSecret: null,
      rpID: "games.example.invalid",
    });
    expect(settings && isGoogleConfigured(settings)).toBe(false);
  });

  it.each([
    ["GOOGLE_CLIENT_ID", { GOOGLE_CLIENT_ID: "" }],
    ["GOOGLE_CLIENT_SECRET", { GOOGLE_CLIENT_SECRET: "" }],
  ] as const)("disables Google when %s is missing", (_key, override) => {
    const settings = readAuthSettings(createEnv({ ...configuredEnv, ...override }));

    expect(settings).not.toBeNull();
    expect(settings && isGoogleConfigured(settings)).toBe(false);
    expect(settings?.googleClientId).toBeNull();
    expect(settings?.googleClientSecret).toBeNull();
  });

  it("returns null while accounts are disabled", () => {
    expect(readAuthSettings(createEnv({ ...configuredEnv, ACCOUNTS_ENABLED: "false" }))).toBeNull();
  });

  it("builds a Better Auth instance with and without Google", () => {
    expect(getAuth(createEnv(configuredEnv))).not.toBeNull();
    expect(getAuth(createEnv(passkeyOnlyEnv))).not.toBeNull();
    expect(getAuth(createEnv())).toBeNull();
  });

  it("keeps the Google flow when Google is configured", () => {
    const auth = getAuth(createEnv(configuredEnv));
    expect(auth?.options.socialProviders).toHaveProperty("google");
  });

  it("omits socialProviders.google when Google is not configured", () => {
    const auth = getAuth(createEnv(passkeyOnlyEnv));
    expect(auth).not.toBeNull();
    expect(auth?.options.socialProviders?.google).toBeUndefined();
    expect(auth?.options.account?.accountLinking).toMatchObject({
      enabled: true,
      trustedProviders: ["google"],
      allowDifferentEmails: true,
    });
  });

  it.each(["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"] as const)(
    "returns null when required %s is missing",
    (key) => {
      expect(readAuthSettings(createEnv({ ...configuredEnv, [key]: "" }))).toBeNull();
    },
  );

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

describe("/api/auth/capabilities", () => {
  it("reports Google when it is configured", async () => {
    const response = await apiWorker.fetch(
      apiRequest("/api/auth/capabilities"),
      createEnv(configuredEnv),
    );

    expect(response.status).toBe(200);
    expectApiHeaders(response);
    expect(await response.json()).toEqual({ passkey: true, google: true });
  });

  it("reports passkey-only auth when Google is missing", async () => {
    const response = await apiWorker.fetch(
      apiRequest("/api/auth/capabilities"),
      createEnv(passkeyOnlyEnv),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ passkey: true, google: false });
  });

  it("returns 503 when auth is disabled", async () => {
    const response = await apiWorker.fetch(apiRequest("/api/auth/capabilities"), createEnv());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
  });

  it("rejects other methods", async () => {
    const response = await apiWorker.fetch(
      apiRequest("/api/auth/capabilities", "POST"),
      createEnv(passkeyOnlyEnv),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET");
  });
});

describe("/api/auth/passkey-first/context", () => {
  it("issues a signed, short-lived context", async () => {
    const env = createEnv(passkeyOnlyEnv);
    const response = await apiWorker.fetch(
      apiRequest("/api/auth/passkey-first/context", "POST"),
      env,
    );

    expect(response.status).toBe(200);
    expectApiHeaders(response);

    const body = (await response.json()) as { context: string; expiresAt: string };
    expect(body.context).toContain(".");
    expect(Number.isNaN(Date.parse(body.expiresAt))).toBe(false);

    const payload = await verifyPasskeyContext(passkeyOnlyEnv.BETTER_AUTH_SECRET, body.context);
    expect(payload?.userId).toMatch(/^parent_/);
    expect(payload?.exp).toBe(Date.parse(body.expiresAt));
  });

  it("returns 503 when auth is disabled", async () => {
    const response = await apiWorker.fetch(
      apiRequest("/api/auth/passkey-first/context", "POST"),
      createEnv(),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "auth_unavailable" });
  });

  it("rejects other methods", async () => {
    const response = await apiWorker.fetch(
      apiRequest("/api/auth/passkey-first/context"),
      createEnv(passkeyOnlyEnv),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
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

  it("returns a JSON 503 when the auth secret is missing", async () => {
    const response = await apiWorker.fetch(
      apiRequest("/api/auth/sign-in/social", "POST"),
      createEnv({ ...configuredEnv, BETTER_AUTH_SECRET: "" }),
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
