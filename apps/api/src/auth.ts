import { passkey } from "@better-auth/passkey";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { APIError, getSessionFromCtx } from "better-auth/api";
import { isGoogleConfigured, readAuthSettings, type AuthSettings } from "./auth-config";
import type { Env } from "./env";
import {
  createPasskeyFirstUser,
  resolvePasskeyFirstUser,
  type PasskeyFirstUserStore,
} from "./passkey-context";

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
    settings.googleClientId ?? "",
    settings.googleClientSecret ?? "",
  ].join("\n");
}

/**
 * Better Auth configuration shared by the Worker and the tests. Google is only
 * registered when both credentials exist; passkey works either way.
 */
export function createAuthOptions(
  settings: AuthSettings,
  database: BetterAuthOptions["database"],
): BetterAuthOptions {
  const googleConfigured = isGoogleConfigured(settings);

  return {
    appName: RP_NAME,
    baseURL: settings.baseURL,
    basePath: "/api/auth",
    secret: settings.secret,
    database,
    trustedOrigins: [settings.baseURL],
    socialProviders: googleConfigured
      ? {
          google: {
            clientId: settings.googleClientId ?? "",
            clientSecret: settings.googleClientSecret ?? "",
          },
        }
      : {},
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
        // A passkey-first parent has a synthetic @invalid address. Linking an
        // explicitly authenticated Google account must still work; the parent
        // already proved possession of the passkey.
        allowDifferentEmails: true,
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
        registration: {
          // Passkey-first: a parent can create an account without Google.
          requireSession: false,
          resolveUser: ({ context }) => resolvePasskeyFirstUser(settings.secret, context),
          afterVerification: async ({ ctx, user, context }) => {
            const session = await getSessionFromCtx(ctx);

            // Adding a passkey from an existing (Google or passkey) session.
            if (session?.user?.id) {
              if (session.user.id !== user.id) {
                throw APIError.from("UNAUTHORIZED", {
                  code: "PASSKEY_USER_MISMATCH",
                  message: "This passkey belongs to a different account.",
                });
              }
              return;
            }

            // First registration: create the parent only after the ceremony.
            await createPasskeyFirstUser(
              ctx.context.internalAdapter as unknown as PasskeyFirstUserStore,
              settings.secret,
              context,
              user.id,
            );
          },
        },
      }),
    ],
    telemetry: { enabled: false },
  };
}

function createAuth(env: Env, settings: AuthSettings) {
  return betterAuth(createAuthOptions(settings, env.DB));
}

type Auth = ReturnType<typeof createAuth>;

/**
 * Returns a Better Auth instance for this environment, or `null` when the
 * feature flag or one of the required secrets is missing. The instance is
 * cached per D1 binding so schema validation does not run on every request.
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
