import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AccountScreen,
  type AccountAuthClient,
  type AccountSessionState,
  type AuthCapabilities,
} from "@features/auth";

interface ClientOptions {
  readonly state?: Partial<AccountSessionState>;
  readonly social?: AccountAuthClient["signIn"]["social"];
  readonly passkeySignIn?: AccountAuthClient["signIn"]["passkey"];
  readonly addPasskey?: AccountAuthClient["passkey"]["addPasskey"];
  readonly signOut?: AccountAuthClient["signOut"];
  readonly linkSocial?: AccountAuthClient["linkSocial"];
  readonly capabilities?: AuthCapabilities;
  readonly capabilitiesError?: Error;
  readonly passkeyContext?: string;
  readonly passkeyContextError?: Error;
  readonly linkedProviders?: () => Promise<readonly string[]>;
}

function createClient(options: ClientOptions = {}) {
  const refetch = vi.fn(async () => {});
  const getCapabilities = vi.fn(async () => {
    if (options.capabilitiesError) {
      throw options.capabilitiesError;
    }
    return options.capabilities ?? { passkey: true, google: true };
  });
  const createPasskeyContext = vi.fn(async () => {
    if (options.passkeyContextError) {
      throw options.passkeyContextError;
    }
    return options.passkeyContext ?? "signed-context";
  });
  const listLinkedProviders = vi.fn(
    options.linkedProviders ?? (async () => [] as readonly string[]),
  );
  const client: AccountAuthClient = {
    useSession: () => ({
      data: null,
      isPending: false,
      error: null,
      refetch,
      ...options.state,
    }),
    getCapabilities,
    createPasskeyContext,
    listLinkedProviders,
    signIn: {
      social: options.social ?? vi.fn(async () => ({})),
      passkey: options.passkeySignIn ?? vi.fn(async () => ({})),
    },
    linkSocial: options.linkSocial ?? vi.fn(async () => ({})),
    passkey: {
      addPasskey: options.addPasskey ?? vi.fn(async () => ({})),
    },
    signOut: options.signOut ?? vi.fn(async () => ({})),
  };
  return { client, refetch, getCapabilities, createPasskeyContext, listLinkedProviders };
}

const signedInState: Partial<AccountSessionState> = {
  data: { user: { name: "Ouder Voorbeeld", email: "ouder@example.invalid" } },
};

const passkeyOnlyState: Partial<AccountSessionState> = {
  data: {
    user: {
      name: "Ouder",
      email: "passkey-00000000-0000-0000-0000-000000000000@invalid",
    },
  },
};

beforeEach(() => {
  cleanup();
  Object.defineProperty(window, "PublicKeyCredential", {
    configurable: true,
    value: class PublicKeyCredential {},
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, "PublicKeyCredential");
  vi.restoreAllMocks();
});

describe("account screen", () => {
  it("offers account creation, passkey sign-in and Google with large touch targets", async () => {
    const { client } = createClient();
    render(<AccountScreen client={client} />);

    const create = screen.getByRole("button", { name: "Account aanmaken met passkey" });
    const passkey = screen.getByRole("button", { name: "Inloggen met passkey" });
    const google = await screen.findByRole("button", { name: "Inloggen met Google" });

    expect(create.className).toContain("h-14");
    expect(passkey.className).toContain("h-14");
    expect(google.className).toContain("h-14");
    expect(screen.queryByRole("button", { name: "Uitloggen" })).toBeNull();
  });

  it("creates a passkey-first account with a signed context and refreshes the session", async () => {
    const addPasskey = vi.fn(async () => ({}));
    const { client, refetch, createPasskeyContext } = createClient({ addPasskey });
    render(<AccountScreen client={client} />);

    fireEvent.click(screen.getByRole("button", { name: "Account aanmaken met passkey" }));

    await waitFor(() =>
      expect(addPasskey).toHaveBeenCalledWith({
        name: "Ouderpasskey",
        context: "signed-context",
        createSession: true,
      }),
    );
    expect(createPasskeyContext).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Je account is aangemaakt/)).toBeTruthy();
  });

  it("shows a friendly message when no passkey context can be issued", async () => {
    const addPasskey = vi.fn(async () => ({}));
    const { client } = createClient({
      addPasskey,
      passkeyContextError: new Error("503"),
    });
    render(<AccountScreen client={client} />);

    fireEvent.click(screen.getByRole("button", { name: "Account aanmaken met passkey" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Probeer het opnieuw");
    expect(addPasskey).not.toHaveBeenCalled();
  });

  it("starts the Google flow on the same origin", async () => {
    const social = vi.fn(async () => ({}));
    const { client } = createClient({ social });
    render(<AccountScreen client={client} />);

    fireEvent.click(await screen.findByRole("button", { name: "Inloggen met Google" }));

    expect(social).toHaveBeenCalledWith({ provider: "google", callbackURL: "/account" });
  });

  it("signs in with an existing passkey", () => {
    const passkeySignIn = vi.fn(async () => ({}));
    const { client } = createClient({ passkeySignIn });
    render(<AccountScreen client={client} />);

    fireEvent.click(screen.getByRole("button", { name: "Inloggen met passkey" }));

    expect(passkeySignIn).toHaveBeenCalledTimes(1);
  });

  it("hides Google and explains passkey-only accounts when Google is not configured", async () => {
    const { client } = createClient({ capabilities: { passkey: true, google: false } });
    render(<AccountScreen client={client} />);

    expect(await screen.findByText(/Inloggen met Google is niet ingesteld/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Inloggen met Google" })).toBeNull();
    expect(screen.getByRole("button", { name: "Account aanmaken met passkey" })).toBeTruthy();
  });

  it("keeps passkey sign-in available when the capabilities request fails", async () => {
    const { client } = createClient({ capabilitiesError: new Error("offline") });
    render(<AccountScreen client={client} />);

    expect(await screen.findByText(/Inloggen met Google is niet ingesteld/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Account aanmaken met passkey" })).toBeTruthy();
  });

  it("shows the signed-in parent and registers an extra passkey", async () => {
    const addPasskey = vi.fn(async () => ({}));
    const { client } = createClient({ state: signedInState, addPasskey });
    render(<AccountScreen client={client} />);

    expect(screen.getByText("Ouder Voorbeeld")).toBeTruthy();
    expect(screen.getByText("ouder@example.invalid")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Inloggen met Google" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Nog een passkey toevoegen" }));

    expect(addPasskey).toHaveBeenCalledWith({ name: "Ouderpasskey" });
    expect(await screen.findByText(/Passkey toegevoegd/)).toBeTruthy();
  });

  it("hides the synthetic passkey email and explains recovery", () => {
    const { client } = createClient({ state: passkeyOnlyState });
    render(<AccountScreen client={client} />);

    expect(screen.getByText("Passkey-account zonder e-mail")).toBeTruthy();
    expect(screen.queryByText(/passkey-0000/)).toBeNull();
    expect(screen.getByText(/geen e-mailherstel/)).toBeTruthy();
  });

  it("links Google to a passkey-only account", async () => {
    let providers: readonly string[] = [];
    const linkSocial = vi.fn(async () => {
      providers = ["google"];
      return {};
    });
    const { client } = createClient({
      state: passkeyOnlyState,
      linkSocial,
      linkedProviders: async () => providers,
    });
    render(<AccountScreen client={client} />);

    fireEvent.click(await screen.findByRole("button", { name: "Google koppelen" }));

    expect(linkSocial).toHaveBeenCalledWith({ provider: "google", callbackURL: "/account" });
    expect(await screen.findByText("Google is gekoppeld aan je account.")).toBeTruthy();
    expect(screen.getByText("Google is aan dit account gekoppeld.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Google koppelen" })).toBeNull();
  });

  it("hides the link button when Google is already linked", async () => {
    const { client } = createClient({
      state: passkeyOnlyState,
      linkedProviders: async () => ["google"],
    });
    render(<AccountScreen client={client} />);

    expect(await screen.findByText("Google is aan dit account gekoppeld.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Google koppelen" })).toBeNull();
    expect(screen.getByText(/inloggen met je passkey en met Google/)).toBeTruthy();
  });

  it("hides the link button when Google is not configured", async () => {
    const { client } = createClient({
      state: passkeyOnlyState,
      capabilities: { passkey: true, google: false },
      linkedProviders: async () => [],
    });
    render(<AccountScreen client={client} />);

    expect(await screen.findByText(/Google koppelen is niet ingesteld/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Google koppelen" })).toBeNull();
  });

  it("signs out and refreshes the session", async () => {
    const signOut = vi.fn(async () => ({}));
    const { client, refetch } = createClient({ state: signedInState, signOut });
    render(<AccountScreen client={client} />);

    fireEvent.click(screen.getByRole("button", { name: "Uitloggen" }));

    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("shows a friendly message when the auth API is unavailable", () => {
    const { client } = createClient({ state: { error: new Error("503") } });
    render(<AccountScreen client={client} />);

    expect(screen.getByRole("alert").textContent).toContain("Inloggen is nu niet beschikbaar");
    expect(screen.getByRole("button", { name: "Opnieuw proberen" })).toBeTruthy();
  });

  it("shows a friendly message when a passkey is rejected", async () => {
    const passkeySignIn = vi.fn(async () => ({ error: { message: "cancelled" } }));
    const { client } = createClient({ passkeySignIn });
    render(<AccountScreen client={client} />);

    fireEvent.click(screen.getByRole("button", { name: "Inloggen met passkey" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Probeer het opnieuw");
  });

  it("shows a loading state while the session is fetched", () => {
    const { client } = createClient({ state: { isPending: true } });
    render(<AccountScreen client={client} />);

    expect(screen.getByRole("status").textContent).toContain("Bezig met laden");
  });

  it("disables passkeys when the browser does not support them", async () => {
    Reflect.deleteProperty(window, "PublicKeyCredential");
    const { client } = createClient();
    render(<AccountScreen client={client} />);

    const create = screen.getByRole("button", { name: "Account aanmaken met passkey" });
    const passkey = screen.getByRole("button", { name: "Inloggen met passkey" });
    expect(create.hasAttribute("disabled")).toBe(true);
    expect(passkey.hasAttribute("disabled")).toBe(true);
    expect(await screen.findByText(/Deze browser ondersteunt geen passkeys/)).toBeTruthy();
  });
});
