export interface AccountUser {
  readonly name: string;
  readonly email: string;
}

export interface AccountSession {
  readonly user: AccountUser;
}

export interface AccountSessionState {
  readonly data: AccountSession | null;
  readonly isPending: boolean;
  readonly error: unknown;
  readonly refetch: () => Promise<void>;
}

export interface AuthActionResult {
  readonly error?: { readonly message?: string } | null;
}

/**
 * Small structural interface for the parts of the Better Auth client that the
 * account screen uses. Tests can pass a fake implementation without a network
 * or a D1 database.
 */
export interface AccountAuthClient {
  useSession(): AccountSessionState;
  readonly signIn: {
    social(input: { provider: "google"; callbackURL: string }): Promise<unknown>;
    passkey(): Promise<AuthActionResult>;
  };
  readonly passkey: {
    addPasskey(input: { name: string }): Promise<AuthActionResult>;
  };
  signOut(): Promise<unknown>;
}
