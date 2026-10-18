/**
 * Bindings and variables available to the Worker.
 *
 * `ACCOUNTS_ENABLED` is a public feature flag; it is not a secret. Account
 * routes are added in a later issue and must stay disabled until then.
 */
export interface Env {
  readonly DB: D1Database;
  readonly ACCOUNTS_ENABLED: string;
}
