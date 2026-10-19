/**
 * Bindings and variables available to the Worker.
 *
 * `ACCOUNTS_ENABLED` is a public feature flag; it is not a secret. The auth
 * routes stay unavailable until the flag is `"true"` and every auth value is
 * configured.
 */
export interface Env {
  readonly DB: D1Database;
  readonly ACCOUNTS_ENABLED: string;
  readonly BETTER_AUTH_SECRET?: string;
  readonly BETTER_AUTH_URL?: string;
  readonly GOOGLE_CLIENT_ID?: string;
  readonly GOOGLE_CLIENT_SECRET?: string;
}
