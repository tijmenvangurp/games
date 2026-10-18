import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";

/**
 * Same-origin client: no baseURL, so the browser talks to the Worker under the
 * current origin. The passkey plugin adds `signIn.passkey` and
 * `passkey.addPasskey`.
 */
export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [passkeyClient()],
});
