import { describe, expect, it } from "vitest";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { linkOAuthAccount } from "better-auth/oauth2";
import { createAuthOptions } from "../../apps/api/src/auth";
import { readAuthSettings } from "../../apps/api/src/auth-config";
import type { Env } from "../../apps/api/src/env";

const env = {
  ACCOUNTS_ENABLED: "true",
  BETTER_AUTH_SECRET: "test-secret-with-at-least-32-characters",
  BETTER_AUTH_URL: "https://games.example.invalid",
  DB: {} as D1Database,
} satisfies Env;

function createMemoryAuth() {
  const db: Record<string, unknown[]> = {
    user: [],
    account: [],
    session: [],
    verification: [],
    passkey: [],
    rateLimit: [],
  };

  const settings = readAuthSettings(env);
  if (!settings) {
    throw new Error("expected configured auth settings");
  }

  return betterAuth({
    ...createAuthOptions(settings, memoryAdapter(db)),
    rateLimit: { enabled: false },
  });
}

describe("passkey and Google account linking", () => {
  it("links Google to the existing passkey user without creating a new user", async () => {
    const auth = createMemoryAuth();
    const context = await auth.$context;
    const user = await context.internalAdapter.createUser(
      {
        email: "passkey-00000000-0000-0000-0000-000000000000@invalid",
        name: "Ouder",
        emailVerified: false,
      },
      { method: "passkey" },
    );

    const result = await linkOAuthAccount({ context } as never, {
      link: { userId: user.id, email: user.email },
      userInfo: {
        email: "ouder@example.invalid",
        emailVerified: true,
        name: "Ouder",
      } as never,
      account: {
        providerId: "google",
        accountId: "google-subject.example.invalid",
        accessToken: "test-access-token",
      } as never,
      profile: {},
      scopes: ["openid", "email", "profile"],
    });

    expect(result).toEqual({ linked: true });

    const after = await context.internalAdapter.findUserById(user.id);
    expect(after?.id).toBe(user.id);
    expect(after?.email).toBe(user.email);
    expect(await context.internalAdapter.countTotalUsers()).toBe(1);

    const providers = (await context.internalAdapter.findAccounts(user.id)).map(
      (account) => account.providerId,
    );
    expect(providers).toEqual(["google"]);
  });

  it("keeps the Google provider configured when credentials exist", () => {
    const settings = readAuthSettings({
      ...env,
      GOOGLE_CLIENT_ID: "client-id.example.invalid",
      GOOGLE_CLIENT_SECRET: "client-secret.example.invalid",
    });
    expect(settings?.googleClientId).toBe("client-id.example.invalid");
    expect(settings?.googleClientSecret).toBe("client-secret.example.invalid");
  });
});
