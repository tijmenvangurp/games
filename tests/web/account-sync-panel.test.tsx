import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type AccountAuthClient, type AccountSessionState } from "@features/auth";
import { SyncConsentPanel } from "../../libs/pages/account/ui/sync-consent-panel";
import { loadSyncState } from "../../libs/features/sync/model/sync-state";

type FetchCalls = Array<{ url: string }>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function urlOf(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return String((input as Request).url);
}

/** Same state-injection pattern as `account-screen.test.tsx`. */
function createSessionClient(state: Partial<AccountSessionState>): AccountAuthClient {
  return {
    useSession: () => ({
      data: null,
      isPending: false,
      error: null,
      refetch: vi.fn(async () => {}),
      ...state,
    }),
    getCapabilities: vi.fn(async () => ({ passkey: true, google: false })),
    createPasskeyContext: vi.fn(async () => "context"),
    listLinkedProviders: vi.fn(async () => []),
    signIn: {
      social: vi.fn(async () => ({})),
      passkey: vi.fn(async () => ({})),
    },
    linkSocial: vi.fn(async () => ({})),
    passkey: { addPasskey: vi.fn(async () => ({})) },
    signOut: vi.fn(async () => ({})),
  };
}

const signedIn = createSessionClient({
  data: { user: { name: "Ouder", email: "ouder@example.invalid" } },
});

/** The persisted session atom keeps state between tests; only proche tests
 rely on the real singleton, and they run first. */
describe("account sync consent panel", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders nothing while the session still loads", () => {
    render(<SyncConsentPanel client={createSessionClient({ isPending: true })} />);

    expect(screen.queryByRole("heading", { name: "Voortgang synchroniseren" })).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders nothing for a signed-out parent", () => {
    render(<SyncConsentPanel client={createSessionClient({})} />);

    expect(screen.queryByRole("heading", { name: "Voortgang synchroniseren" })).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders for a signed-in parent with the exact ADR copy and sync off by default", () => {
    render(<SyncConsentPanel client={signedIn} />);

    const heading = screen.getByRole("heading", { name: "Voortgang synchroniseren" });
    expect(heading.tagName).toBe("H2");

    expect(
      screen.getByText(/Je account begint leeg; je lokale voortgang blijft op dit toestel\./),
    ).not.toBeNull();

    const toggle = screen.getByRole("button", { name: "Synchroniseren: uit" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("Speler 1")).not.toBeNull();
    expect(screen.getByText("Alles blijft lokaal op dit toestel")).not.toBeNull();
  });

  it("enabling a profile creates the server player and persists the opt-in", async () => {
    const calls: FetchCalls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: unknown) => {
        const entry = { url: urlOf(input) };
        calls.push(entry);
        if (entry.url.includes("/api/auth/get-session")) {
          return json({ session: { id: "session-1" }, user: { id: "user-1" } });
        }
        if (entry.url.includes("/api/players")) {
          return json({ players: [] });
        }
        if (entry.url.includes("/api/progress")) {
          return json({ progress: [] });
        }
        return json({});
      }),
    );

    render(<SyncConsentPanel client={signedIn} />);
    const toggle = screen.getByRole("button", { name: "Synchroniseren: uit" });
    expect(calls.some(({ url }) => url.includes("/api/players"))).toBe(false);

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Synchroniseren: aan" }).getAttribute("aria-pressed"),
      ).toBe("true");
    });
    expect(screen.getByText("Voortgang wordt gesynchroniseerd")).not.toBeNull();

    expect(calls.some(({ url }) => url.includes("/api/players"))).toBe(true);
    expect(loadSyncState().syncEnabled).toEqual({ p1: true });
    expect(localStorage.getItem("games.sync.outbox.v1")).toBeNull();
  });

  it("disabling again removes the opt-in and cleans the outbox", async () => {
    localStorage.setItem(
      "games.sync.state.v1",
      JSON.stringify({ version: 1, players: {}, progress: {}, syncEnabled: { p1: true } }),
    );
    render(<SyncConsentPanel client={signedIn} />);
    const enabled = screen.getByRole("button", { name: "Synchroniseren: aan" });
    expect(screen.getByText("Voortgang wordt gesynchroniseerd")).not.toBeNull();

    fireEvent.click(enabled);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Synchroniseren: uit" }).getAttribute("aria-pressed"),
      ).toBe("false");
    });
    expect(screen.getByText("Alles blijft lokaal op dit toestel")).not.toBeNull();
    expect(loadSyncState().syncEnabled).toEqual({});
  });

  it("shows a status update once the opt-in is persisted", async () => {
    const calls: FetchCalls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: unknown) => {
        const entry = { url: urlOf(input) };
        calls.push(entry);
        if (entry.url.includes("/api/auth/get-session")) {
          return json({ session: null });
        }
        if (entry.url.includes("/api/players")) {
          return json({ players: [] });
        }
        if (entry.url.includes("/api/progress")) {
          return json({ progress: [] });
        }
        return json({});
      }),
    );

    render(<SyncConsentPanel client={signedIn} />);

    fireEvent.click(screen.getByRole("button", { name: "Synchroniseren: uit" }));

    await screen.findByText("Voortgang van dit profiel wordt nu gesynchroniseerd.");
    expect(screen.getByRole("status")).not.toBeNull();
    expect(calls.some(({ url }) => url.includes("/api/auth/get-session"))).toBe(true);
  });
});
