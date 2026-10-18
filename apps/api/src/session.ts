import { getAuth } from "./auth";
import type { Env } from "./env";
import { jsonResponse } from "./response";

export type SessionLookup =
  | { readonly status: "authenticated"; readonly userId: string }
  | { readonly status: "unauthenticated" }
  | { readonly status: "unavailable" };

/**
 * Resolves the parent session for a request. `unavailable` means auth is turned
 * off or not configured (503); `unauthenticated` means there is no valid
 * session (401).
 */
export type SessionResolver = (request: Request, env: Env) => Promise<SessionLookup>;

export const resolveSession: SessionResolver = async (request, env) => {
  const auth = getAuth(env);
  if (!auth) {
    return { status: "unavailable" };
  }

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    return userId ? { status: "authenticated", userId } : { status: "unauthenticated" };
  } catch {
    return { status: "unavailable" };
  }
};

export type Authorization = { readonly userId: string } | { readonly response: Response };

/** Turns a session lookup into either a user id or the matching 401/503 response. */
export async function authorize(
  request: Request,
  env: Env,
  resolve: SessionResolver = resolveSession,
): Promise<Authorization> {
  const session = await resolve(request, env);

  if (session.status === "unavailable") {
    return { response: jsonResponse({ error: "auth_unavailable" }, 503) };
  }

  if (session.status === "unauthenticated") {
    return { response: jsonResponse({ error: "unauthorized" }, 401) };
  }

  return { userId: session.userId };
}
