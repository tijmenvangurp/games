import type { Env } from "./env";
import { jsonResponse } from "./response";

const HEALTH_QUERY = "SELECT 1 AS ok";

/**
 * Verifies that the Worker can reach D1 without exposing query details or
 * database errors in the response.
 */
export async function handleHealth(env: Env): Promise<Response> {
  try {
    const row = await env.DB.prepare(HEALTH_QUERY).first<{ ok: number }>();
    if (row?.ok !== 1) {
      return jsonResponse({ status: "error", database: "unavailable" }, 503);
    }
    return jsonResponse({ status: "ok", database: "ok" });
  } catch {
    return jsonResponse({ status: "error", database: "unavailable" }, 503);
  }
}
