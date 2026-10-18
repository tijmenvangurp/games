import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";
import type { AccountAuthClient, AccountSessionState, AuthCapabilities } from "./types";

/**
 * Same-origin client: no baseURL, so the browser talks to the Worker under the
 * current origin. The passkey plugin adds `signIn.passkey` and
 * `passkey.addPasskey`.
 */
const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [passkeyClient()],
});

async function readCapabilities(): Promise<AuthCapabilities> {
  const response = await fetch("/api/auth/capabilities", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("auth_unavailable");
  }

  const body: unknown = await response.json();
  const google =
    typeof body === "object" && body !== null && "google" in body && body.google === true;

  return { passkey: true, google };
}

async function requestPasskeyContext(): Promise<string> {
  const response = await fetch("/api/auth/passkey-first/context", {
    method: "POST",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("passkey_context_unavailable");
  }

  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("context" in body) ||
    typeof body.context !== "string"
  ) {
    throw new Error("passkey_context_invalid");
  }

  return body.context;
}

async function listLinkedProviders(): Promise<readonly string[]> {
  try {
    const result = await authClient.listAccounts();
    if (result.error) {
      return [];
    }
    return (result.data ?? []).map((account) => account.providerId);
  } catch {
    return [];
  }
}

/**
 * Adapter that keeps the account UI independent of Better Auth's generated
 * client types.
 */
export const accountAuthClient: AccountAuthClient = {
  useSession: () => (authClient as unknown as { useSession(): AccountSessionState }).useSession(),
  getCapabilities: readCapabilities,
  createPasskeyContext: requestPasskeyContext,
  listLinkedProviders,
  signIn: authClient.signIn,
  linkSocial: (input) => authClient.linkSocial(input),
  passkey: authClient.passkey,
  signOut: () => authClient.signOut(),
};
