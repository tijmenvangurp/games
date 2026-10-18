import { APIError } from "better-auth/api";

/**
 * Passkey-first registration needs a context that the client cannot forge.
 * The Worker issues a short-lived HMAC token with a server-generated user id;
 * the passkey plugin only creates the user after a successful WebAuthn
 * ceremony. Without the signature a client could claim any user id.
 */
export const PASSKEY_CONTEXT_TTL_MS = 5 * 60 * 1000;

const TOKEN_VERSION = 1;
const USER_ID_PATTERN = /^parent_[0-9a-f-]{36}$/;
const encoder = new TextEncoder();

const keyCache = new Map<string, Promise<CryptoKey>>();

interface PasskeyContextPayload {
  readonly v: number;
  readonly userId: string;
  readonly nonce: string;
  readonly exp: number;
}

export interface PasskeyContext {
  readonly token: string;
  readonly payload: PasskeyContextPayload;
}

/** Minimal surface of Better Auth's internal user adapter used by the flow. */
export interface PasskeyFirstUserStore {
  findUserById(userId: string): Promise<unknown | null>;
  createUser(
    user: {
      readonly id: string;
      readonly email: string;
      readonly name: string;
      readonly emailVerified: boolean;
    },
    source: { readonly method: string },
  ): Promise<unknown>;
}

function importKey(secret: string): Promise<CryptoKey> {
  const cached = keyCache.get(secret);
  if (cached) {
    return cached;
  }

  const key = crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  keyCache.set(secret, key);
  return key;
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }

  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

function isPayload(value: unknown): value is PasskeyContextPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    payload.v === TOKEN_VERSION &&
    typeof payload.userId === "string" &&
    USER_ID_PATTERN.test(payload.userId) &&
    typeof payload.nonce === "string" &&
    payload.nonce.length > 0 &&
    typeof payload.exp === "number" &&
    Number.isFinite(payload.exp)
  );
}

/** Creates a signed context for exactly one passkey-first registration. */
export async function createPasskeyContext(
  secret: string,
  now = Date.now(),
): Promise<PasskeyContext> {
  const payload: PasskeyContextPayload = {
    v: TOKEN_VERSION,
    userId: `parent_${crypto.randomUUID()}`,
    nonce: crypto.randomUUID(),
    exp: now + PASSKEY_CONTEXT_TTL_MS,
  };

  const encodedPayload = encodeBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importKey(secret),
    encoder.encode(encodedPayload),
  );

  return {
    token: `${encodedPayload}.${encodeBase64Url(new Uint8Array(signature))}`,
    payload,
  };
}

/**
 * Verifies signature and expiry. Returns `null` for anything that is not a
 * context this Worker issued, so callers can answer with a generic 400.
 */
export async function verifyPasskeyContext(
  secret: string,
  token: string | null | undefined,
  now = Date.now(),
): Promise<PasskeyContextPayload | null> {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, encodedSignature] = parts;
  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  const signature = decodeBase64Url(encodedSignature);
  if (!signature) {
    return null;
  }

  const valid = await crypto.subtle.verify(
    "HMAC",
    await importKey(secret),
    signature,
    encoder.encode(encodedPayload),
  );
  if (!valid) {
    return null;
  }

  const decoded = decodeBase64Url(encodedPayload);
  if (!decoded) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(decoded));
  } catch {
    return null;
  }

  if (!isPayload(parsed) || parsed.exp <= now) {
    return null;
  }

  return parsed;
}

function contextError(code: string, message: string): APIError {
  return APIError.from("BAD_REQUEST", { code, message });
}

/**
 * Resolves the synthetic parent for the WebAuthn registration options. No
 * database row is created here: the user only exists after verification.
 */
export async function resolvePasskeyFirstUser(
  secret: string,
  context: string | null | undefined,
  now = Date.now(),
): Promise<{ id: string; name: string; displayName: string }> {
  const payload = await verifyPasskeyContext(secret, context, now);
  if (!payload) {
    throw contextError("INVALID_PASSKEY_CONTEXT", "The passkey context is invalid or expired.");
  }

  return { id: payload.userId, name: "Ouder", displayName: "Ouder" };
}

/**
 * Creates the parent only after the WebAuthn ceremony succeeded. A context can
 * be used once: a second registration for the same user id is rejected.
 */
export async function createPasskeyFirstUser(
  store: PasskeyFirstUserStore,
  secret: string,
  context: string | null | undefined,
  userId: string,
  now = Date.now(),
): Promise<{ id: string; email: string }> {
  const payload = await verifyPasskeyContext(secret, context, now);
  if (!payload) {
    throw contextError("INVALID_PASSKEY_CONTEXT", "The passkey context is invalid or expired.");
  }

  if (payload.userId !== userId) {
    throw contextError("INVALID_PASSKEY_CONTEXT", "The passkey context does not match this user.");
  }

  const existing = await store.findUserById(userId);
  if (existing) {
    throw contextError(
      "PASSKEY_CONTEXT_ALREADY_USED",
      "This passkey context was already used for an account.",
    );
  }

  const email = `passkey-${crypto.randomUUID()}@invalid`;
  await store.createUser(
    { id: userId, email, name: "Ouder", emailVerified: false },
    {
      method: "passkey",
    },
  );

  return { id: userId, email };
}
