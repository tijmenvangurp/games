import { describe, expect, it } from "vitest";
import { isAPIError } from "better-auth/api";
import {
  PASSKEY_CONTEXT_TTL_MS,
  createPasskeyContext,
  createPasskeyFirstUser,
  resolvePasskeyFirstUser,
  verifyPasskeyContext,
  type PasskeyFirstUserStore,
} from "../../apps/api/src/passkey-context";

const SECRET = "test-secret-with-at-least-32-characters";
const OTHER_SECRET = "another-test-secret-with-32-plus-characters";

function createStore(): {
  readonly store: PasskeyFirstUserStore;
  readonly created: Array<{ id: string; email: string; name: string; emailVerified: boolean }>;
} {
  const users = new Map<string, unknown>();
  const created: Array<{ id: string; email: string; name: string; emailVerified: boolean }> = [];

  return {
    created,
    store: {
      findUserById: async (userId) => users.get(userId) ?? null,
      createUser: async (user) => {
        users.set(user.id, user);
        created.push(user);
        return user;
      },
    },
  };
}

async function expectApiError(task: Promise<unknown>, code: string): Promise<void> {
  try {
    await task;
    throw new Error("expected an APIError");
  } catch (error) {
    expect(isAPIError(error)).toBe(true);
    if (isAPIError(error)) {
      expect(error.body?.code).toBe(code);
    }
  }
}

describe("passkey context", () => {
  it("round-trips a signed context", async () => {
    const { token, payload } = await createPasskeyContext(SECRET, 1_000);

    await expect(verifyPasskeyContext(SECRET, token, 1_000)).resolves.toEqual(payload);
    expect(payload.exp).toBe(1_000 + PASSKEY_CONTEXT_TTL_MS);
    expect(payload.userId).toMatch(/^parent_[0-9a-f-]{36}$/);
  });

  it("rejects a tampered payload or signature", async () => {
    const { token } = await createPasskeyContext(SECRET, 1_000);
    const [payload, signature] = token.split(".");
    const tamperedPayload = `${payload?.slice(0, -1)}${payload?.endsWith("A") ? "B" : "A"}`;

    await expect(
      verifyPasskeyContext(SECRET, `${tamperedPayload}.${signature}`, 1_000),
    ).resolves.toBeNull();
    await expect(
      verifyPasskeyContext(SECRET, `${payload}.${signature}x`, 1_000),
    ).resolves.toBeNull();
    await expect(verifyPasskeyContext(SECRET, "not-a-token", 1_000)).resolves.toBeNull();
    await expect(verifyPasskeyContext(SECRET, null, 1_000)).resolves.toBeNull();
  });

  it("rejects a context signed with another secret", async () => {
    const { token } = await createPasskeyContext(SECRET, 1_000);

    await expect(verifyPasskeyContext(OTHER_SECRET, token, 1_000)).resolves.toBeNull();
  });

  it("rejects an expired context", async () => {
    const { token } = await createPasskeyContext(SECRET, 1_000);

    await expect(
      verifyPasskeyContext(SECRET, token, 1_000 + PASSKEY_CONTEXT_TTL_MS),
    ).resolves.toBeNull();
  });

  it("resolves the synthetic parent without creating a user", async () => {
    const { token, payload } = await createPasskeyContext(SECRET, 1_000);

    await expect(resolvePasskeyFirstUser(SECRET, token, 1_000)).resolves.toEqual({
      id: payload.userId,
      name: "Ouder",
      displayName: "Ouder",
    });
    await expectApiError(resolvePasskeyFirstUser(SECRET, null, 1_000), "INVALID_PASSKEY_CONTEXT");
  });
});

describe("passkey-first user creation", () => {
  it("creates the parent only after verification, with a synthetic email", async () => {
    const { store, created } = createStore();
    const { token, payload } = await createPasskeyContext(SECRET, 1_000);

    const user = await createPasskeyFirstUser(store, SECRET, token, payload.userId, 1_000);

    expect(user.id).toBe(payload.userId);
    expect(user.email).toMatch(/^passkey-[0-9a-f-]{36}@invalid$/);
    expect(created).toEqual([
      {
        id: payload.userId,
        email: user.email,
        name: "Ouder",
        emailVerified: false,
      },
    ]);
  });

  it("rejects an invalid or expired context", async () => {
    const { store, created } = createStore();

    await expectApiError(
      createPasskeyFirstUser(
        store,
        SECRET,
        "invalid",
        "parent_00000000-0000-0000-0000-000000000000",
      ),
      "INVALID_PASSKEY_CONTEXT",
    );

    const { token, payload } = await createPasskeyContext(SECRET, 1_000);
    await expectApiError(
      createPasskeyFirstUser(store, SECRET, token, payload.userId, 1_000 + PASSKEY_CONTEXT_TTL_MS),
      "INVALID_PASSKEY_CONTEXT",
    );

    expect(created).toEqual([]);
  });

  it("rejects a context that belongs to another user", async () => {
    const { store, created } = createStore();
    const { token } = await createPasskeyContext(SECRET, 1_000);

    await expectApiError(
      createPasskeyFirstUser(
        store,
        SECRET,
        token,
        "parent_00000000-0000-0000-0000-000000000000",
        1_000,
      ),
      "INVALID_PASSKEY_CONTEXT",
    );
    expect(created).toEqual([]);
  });

  it("rejects a second registration with the same context", async () => {
    const { store, created } = createStore();
    const { token, payload } = await createPasskeyContext(SECRET, 1_000);

    await createPasskeyFirstUser(store, SECRET, token, payload.userId, 1_000);

    await expectApiError(
      createPasskeyFirstUser(store, SECRET, token, payload.userId, 1_000),
      "PASSKEY_CONTEXT_ALREADY_USED",
    );
    expect(created).toHaveLength(1);
  });
});
