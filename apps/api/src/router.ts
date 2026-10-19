import type { Env } from "./env";
import { getAuth } from "./auth";
import { isGoogleConfigured, readAuthSettings } from "./auth-config";
import { handleHealth } from "./health";
import { createPasskeyContext } from "./passkey-context";
import { handlePlayerDelete, handlePlayers } from "./players";
import { handleProgress } from "./progress";
import { jsonResponse, withApiHeaders } from "./response";

const HEALTH_PATH = "/api/health";
const AUTH_PATH = "/api/auth";
const CAPABILITIES_PATH = "/api/auth/capabilities";
const PASSKEY_CONTEXT_PATH = "/api/auth/passkey-first/context";
const PLAYERS_PATH = "/api/players";
const PROGRESS_PATH = "/api/progress";

async function handleCapabilities(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") {
    return jsonResponse({ error: "method_not_allowed" }, 405, { Allow: "GET" });
  }

  const settings = readAuthSettings(env);
  if (!settings) {
    return jsonResponse({ error: "auth_unavailable" }, 503);
  }

  return jsonResponse({ passkey: true, google: isGoogleConfigured(settings) });
}

async function handlePasskeyContext(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405, { Allow: "POST" });
  }

  const settings = readAuthSettings(env);
  if (!settings) {
    return jsonResponse({ error: "auth_unavailable" }, 503);
  }

  const { token, payload } = await createPasskeyContext(settings.secret);
  return jsonResponse({
    context: token,
    expiresAt: new Date(payload.exp).toISOString(),
  });
}

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

  if (pathname === CAPABILITIES_PATH) {
    return handleCapabilities(request, env);
  }

  if (pathname === PASSKEY_CONTEXT_PATH) {
    return handlePasskeyContext(request, env);
  }

  if (pathname === PLAYERS_PATH) {
    return handlePlayers(request, env);
  }

  if (pathname.startsWith(`${PLAYERS_PATH}/`)) {
    let playerId: string;
    try {
      playerId = decodeURIComponent(pathname.slice(PLAYERS_PATH.length + 1));
    } catch {
      return jsonResponse({ error: "not_found" }, 404);
    }
    return handlePlayerDelete(request, env, playerId);
  }

  if (pathname === PROGRESS_PATH) {
    return handleProgress(request, env);
  }

  if (pathname === AUTH_PATH || pathname.startsWith(`${AUTH_PATH}/`)) {
    return handleAuth(request, env);
  }

  return jsonResponse({ error: "not_found" }, 404);
}
