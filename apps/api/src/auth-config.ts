import type { Env } from "./env";

export interface AuthSettings {
  /** Public origin of the app, without a trailing slash. */
  readonly baseURL: string;
  readonly secret: string;
  /** Google is optional; passkey-only accounts work without it. */
  readonly googleClientId: string | null;
  readonly googleClientSecret: string | null;
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
 *
 * `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are required. The Google pair is
 * optional: when either value is missing Google is disabled and passkey stays
 * available. A half-configured Google pair is treated as not configured.
 */
export function readAuthSettings(env: Env): AuthSettings | null {
  if (env.ACCOUNTS_ENABLED !== "true") {
    return null;
  }

  const secret = readValue(env.BETTER_AUTH_SECRET);
  const rawBaseURL = readValue(env.BETTER_AUTH_URL);
  const rawGoogleClientId = readValue(env.GOOGLE_CLIENT_ID);
  const rawGoogleClientSecret = readValue(env.GOOGLE_CLIENT_SECRET);

  if (!secret || secret.length < 32 || !rawBaseURL) {
    return null;
  }

  let baseURL: string;
  try {
    baseURL = new URL(rawBaseURL).origin;
  } catch {
    return null;
  }

  const googleConfigured = Boolean(rawGoogleClientId && rawGoogleClientSecret);

  return {
    baseURL,
    secret,
    googleClientId: googleConfigured ? rawGoogleClientId : null,
    googleClientSecret: googleConfigured ? rawGoogleClientSecret : null,
    rpID: new URL(baseURL).hostname,
  };
}

/** Whether the "Inloggen met Google" button should be available. */
export function isGoogleConfigured(settings: AuthSettings): boolean {
  return Boolean(settings.googleClientId && settings.googleClientSecret);
}

/** The exact callback URL that must be registered in the Google console. */
export function googleCallbackUrl(settings: AuthSettings): string {
  return `${settings.baseURL}/api/auth/callback/google`;
}
