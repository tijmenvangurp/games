import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountScreen, type AccountAuthClient, type AccountSessionState } from "@features/auth";

interface ClientOptions {
  readonly state?: Partial<AccountSessionState>;
  readonly social?: AccountAuthClient["signIn"]["social"];
  readonly passkeySignIn?: AccountAuthClient["signIn"]["passkey"];
  readonly addPasskey?: AccountAuthClient["passkey"]["addPasskey"];
  readonly signOut?: AccountAuthClient["signOut"];
}

function createClient(options: ClientOptions = {}) {
  const refetch = vi.fn(async () => {});
  const client: AccountAuthClient = {
    useSession: () => ({
      data: null,
      isPending: false,
      error: null,
      refetch,
      ...options.state,
    }),
    signIn: {
      social: options.social ?? vi.fn(async () => ({})),
      passkey: options.passkeySignIn ?? vi.fn(async () => ({})),
    },
    passkey: {
      addPasskey: options.addPasskey ?? vi.fn(async () => ({})),
    },
    signOut: options.signOut ?? vi.fn(async () => ({})),
  };
  return { client, refetch };
}

const signedInState: Partial<AccountSessionState> = {
  data: { user: { name: "Ouder Voorbeeld", email: "ouder@example.invalid" } },
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
  it("offers Google and passkey sign-in with large touch targets", () => {
    const { client } = createClient();
    render(<AccountScreen client={client} />);

    const google = screen.getByRole("button", { name: "Inloggen met Google" });
    const passkey = screen.getByRole("button", { name: "Inloggen met passkey" });
    expect(google.className).toContain("h-14");
    expect(passkey.className).toContain("h-14");
    expect(screen.queryByRole("button", { name: "Uitloggen" })).toBeNull();
  });

  it("starts the Google flow on the same origin", () => {
    const social = vi.fn(async () => ({}));
    const { client } = createClient({ social });
    render(<AccountScreen client={client} />);

    fireEvent.click(screen.getByRole("button", { name: "Inloggen met Google" }));

    expect(social).toHaveBeenCalledWith({ provider: "google", callbackURL: "/account" });
  });

  it("signs in with a passkey", () => {
    const passkeySignIn = vi.fn(async () => ({}));
    const { client } = createClient({ passkeySignIn });
    render(<AccountScreen client={client} />);

    fireEvent.click(screen.getByRole("button", { name: "Inloggen met passkey" }));

    expect(passkeySignIn).toHaveBeenCalledTimes(1);
  });

  it("shows the signed-in parent and registers an extra passkey", async () => {
    const addPasskey = vi.fn(async () => ({}));
    const { client } = createClient({ state: signedInState, addPasskey });
    render(<AccountScreen client={client} />);

    expect(screen.getByText("Ouder Voorbeeld")).toBeTruthy();
    expect(screen.getByText("ouder@example.invalid")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Inloggen met Google" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Passkey toevoegen" }));

    expect(addPasskey).toHaveBeenCalledWith({ name: "Ouderpasskey" });
    expect(await screen.findByText(/Passkey toegevoegd/)).toBeTruthy();
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

  it("disables passkeys when the browser does not support them", () => {
    Reflect.deleteProperty(window, "PublicKeyCredential");
    const { client } = createClient();
    render(<AccountScreen client={client} />);

    const passkey = screen.getByRole("button", { name: "Inloggen met passkey" });
    expect(passkey.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Deze browser ondersteunt geen passkeys.")).toBeTruthy();
  });
});
