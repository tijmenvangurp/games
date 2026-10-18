import type { Env } from "./env";
import { handleHealth } from "./health";
import { jsonResponse } from "./response";

const HEALTH_PATH = "/api/health";

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (pathname === HEALTH_PATH) {
    if (request.method !== "GET") {
      return jsonResponse({ error: "method_not_allowed" }, 405, { Allow: "GET" });
    }
    return handleHealth(env);
  }

  return jsonResponse({ error: "not_found" }, 404);
}
