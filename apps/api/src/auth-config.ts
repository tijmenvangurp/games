import type { Env } from "./env";

export interface AuthSettings {
  /** Public origin of the app, without a trailing slash. */
  readonly baseURL: string;
  readonly secret: string;
  readonly googleClientId: string;
  readonly googleClientSecret: string;
  /** WebAuthn relying party ID: the public hostname without a port. */
  readonly rpID: string;
}

function readValue(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Reads and validates the auth configuration. Returning `null` means the auth
 * routes must answer with a JSON 503 instead of touching Better Auth, so a
 * missing secret or a disabled flag never crashes the Worker.
 */
export function readAuthSettings(env: Env): AuthSettings | null {
  if (env.ACCOUNTS_ENABLED !== "true") {
    return null;
  }

  const secret = readValue(env.BETTER_AUTH_SECRET);
  const rawBaseURL = readValue(env.BETTER_AUTH_URL);
  const googleClientId = readValue(env.GOOGLE_CLIENT_ID);
  const googleClientSecret = readValue(env.GOOGLE_CLIENT_SECRET);

  if (!secret || secret.length < 32 || !rawBaseURL || !googleClientId || !googleClientSecret) {
    return null;
  }

  let baseURL: string;
  try {
    baseURL = new URL(rawBaseURL).origin;
  } catch {
    return null;
  }

  return {
    baseURL,
    secret,
    googleClientId,
    googleClientSecret,
    rpID: new URL(baseURL).hostname,
  };
}

/** The exact callback URL that must be registered in the Google console. */
export function googleCallbackUrl(settings: AuthSettings): string {
  return `${settings.baseURL}/api/auth/callback/google`;
}
