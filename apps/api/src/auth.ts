import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { readAuthSettings, type AuthSettings } from "./auth-config";
import type { Env } from "./env";

const SESSION_SECONDS = 60 * 60 * 24 * 7;
const SESSION_UPDATE_SECONDS = 60 * 60 * 24;
const RP_NAME = "Spellen";

interface CachedAuth {
  readonly key: string;
  readonly auth: Auth;
}

const authCache = new WeakMap<D1Database, CachedAuth>();

function configKey(settings: AuthSettings): string {
  return [
    settings.baseURL,
    settings.secret,
    settings.googleClientId,
    settings.googleClientSecret,
  ].join("\n");
}

function createAuth(env: Env, settings: AuthSettings) {
  return betterAuth({
    appName: RP_NAME,
    baseURL: settings.baseURL,
    basePath: "/api/auth",
    secret: settings.secret,
    database: env.DB,
    trustedOrigins: [settings.baseURL],
    socialProviders: {
      google: {
        clientId: settings.googleClientId,
        clientSecret: settings.googleClientSecret,
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
      },
    },
    session: {
      expiresIn: SESSION_SECONDS,
      updateAge: SESSION_UPDATE_SECONDS,
      cookieCache: { enabled: false },
    },
    rateLimit: { storage: "database" },
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      cookiePrefix: "spellen",
      useSecureCookies: settings.baseURL.startsWith("https://"),
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      },
    },
    plugins: [
      passkey({
        rpID: settings.rpID,
        rpName: RP_NAME,
        origin: settings.baseURL,
      }),
    ],
    telemetry: { enabled: false },
  });
}

type Auth = ReturnType<typeof createAuth>;

/**
 * Returns a Better Auth instance for this environment, or `null` when the
 * feature flag or one of the secrets is missing. The instance is cached per D1
 * binding so schema validation does not run on every request.
 */
export function getAuth(env: Env): Auth | null {
  const settings = readAuthSettings(env);
  if (!settings) {
    return null;
  }

  const key = configKey(settings);
  const cached = authCache.get(env.DB);
  if (cached?.key === key) {
    return cached.auth;
  }

  const auth = createAuth(env, settings);
  authCache.set(env.DB, { key, auth });
  return auth;
}
