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

export interface AuthCapabilities {
  readonly passkey: boolean;
  readonly google: boolean;
}

/**
 * Small structural interface for the parts of the Better Auth client that the
 * account screen uses. Tests can pass a fake implementation without a network
 * or a D1 database.
 */
export interface AccountAuthClient {
  useSession(): AccountSessionState;
  getCapabilities(): Promise<AuthCapabilities>;
  createPasskeyContext(): Promise<string>;
  listLinkedProviders(): Promise<readonly string[]>;
  readonly signIn: {
    social(input: { provider: "google"; callbackURL: string }): Promise<unknown>;
    passkey(): Promise<AuthActionResult>;
  };
  linkSocial(input: { provider: "google"; callbackURL: string }): Promise<unknown>;
  readonly passkey: {
    addPasskey(input: {
      name: string;
      context?: string;
      createSession?: boolean;
    }): Promise<AuthActionResult>;
  };
  signOut(): Promise<unknown>;
}
