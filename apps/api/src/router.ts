import type { Env } from "./env";
import { getAuth } from "./auth";
import { handleHealth } from "./health";
import { jsonResponse, withApiHeaders } from "./response";

const HEALTH_PATH = "/api/health";
const AUTH_PATH = "/api/auth";

async function handleAuth(request: Request, env: Env): Promise<Response> {
  const auth = getAuth(env);
  if (!auth) {
    return jsonResponse({ error: "auth_unavailable" }, 503);
  }

  try {
    return withApiHeaders(await auth.handler(request));
  } catch {
    return jsonResponse({ error: "auth_error" }, 500);
  }
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (pathname === HEALTH_PATH) {
    if (request.method !== "GET") {
      return jsonResponse({ error: "method_not_allowed" }, 405, { Allow: "GET" });
    }
    return handleHealth(env);
  }

  if (pathname === AUTH_PATH || pathname.startsWith(`${AUTH_PATH}/`)) {
    return handleAuth(request, env);
  }

  return jsonResponse({ error: "not_found" }, 404);
}
