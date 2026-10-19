import { expect, test, type Page, type Request, type Route } from "@playwright/test";

/**
 * Preview-e2e voor het accountveld, de feature-flag en de CSP-verbindingen
 * (issue #45). Lokaal draaien deze tests tegen de statische Vite-preview met
 * volledig gemockte `/api/*`-antwoorden: geen echte D1, geen echte Google- of
 * passkey-uitwisseling en geen deployment.
 *
 * Flag-regels die hier worden afgedwongen (ADR 0012):
 * - gastmodus werkt volledig zonder login, ook als de API 503 geeft;
 * - zonder sessie toont `/account` alleen de passkey-keuze (Google alleen als
 *   de capabilities dat melden) en geen sync-paneel;
 * - met een gesimuleerde sessie somt het sync-paneel de profielen op en kan
 *   het per profiel aan en uit, zonder consolefouten;
 * - de app benadert nooit een ander origin dan de preview zelf.
 */

interface ApiModeDisabled {
  readonly kind: "disabled";
}

interface ApiModeGuest {
  readonly kind: "guest";
  readonly google: boolean;
}

interface ApiModeSignedIn {
  readonly kind: "signed-in";
  readonly google: boolean;
}

type ApiMode = ApiModeDisabled | ApiModeGuest | ApiModeSignedIn;
type EnabledApiMode = ApiModeGuest | ApiModeSignedIn;

interface Probe {
  /** Non-http or same-origin requests never count as leaked connectivity. */
  readonly crossOriginUrls: readonly string[];
  /** Console errors and uncaught page errors, in order. */
  readonly consoleErrors: readonly string[];
  /** Uncaught exceptions only; intentional 4xx/5xx responses never land here. */
  readonly pageErrors: readonly string[];
  /** Every mocked `/api` request that the page made, as `${method} ${path}`. */
  readonly apiCalls: readonly string[];
  /** Mock-internal helper to record a call; test code only reads `apiCalls`. */
  apiCallsPush(call: string): void;
}

const PREVIEW_ORIGIN = "http://127.0.0.1:4173";

interface SessionPlayerRow {
  readonly id: string;
  readonly slot: number;
  readonly avatar: string;
  readonly createdAt: string;
}

const E2E_PLAYER: SessionPlayerRow = {
  id: "player_e2e",
  slot: 1,
  avatar: "bear",
  createdAt: "2026-10-18T10:00:00.000Z",
};

function attachProbe(page: Page): Probe {
  const crossOriginUrls: string[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const apiCalls: string[] = [];

  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.origin !== PREVIEW_ORIGIN) {
      crossOriginUrls.push(request.url());
    }
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });

  return {
    get crossOriginUrls() {
      return crossOriginUrls;
    },
    get consoleErrors() {
      return consoleErrors;
    },
    get pageErrors() {
      return pageErrors;
    },
    get apiCalls() {
      return apiCalls;
    },
    apiCallsPush(call: string) {
      apiCalls.push(call);
    },
  };
}

async function fulfillProjection(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function handleAuthRoute(route: Route, path: string, mode: EnabledApiMode): Promise<boolean> {
  if (path === "/api/auth/get-session") {
    if (mode.kind === "signed-in") {
      await fulfillProjection(route, 200, {
        session: { id: "session_e2e", userId: "user_e2e", expiresAt: "2027-01-01T00:00:00.000Z" },
        user: { id: "user_e2e", name: "Ouder", email: "ouder@example.invalid" },
      });
    } else {
      // Better Auth answers without a session with `null`.
      await fulfillProjection(route, 200, null);
    }
    return true;
  }

  if (path === "/api/auth/capabilities") {
    await fulfillProjection(route, 200, { passkey: true, google: mode.google });
    return true;
  }

  if (path === "/api/auth/list-accounts") {
    await fulfillProjection(route, 200, []);
    return true;
  }

  return false;
}

async function handlePlayersRoute(
  route: Route,
  request: Request,
  path: string,
  method: string,
): Promise<boolean> {
  if (path === "/api/players" && method === "GET") {
    await fulfillProjection(route, 200, { players: [] });
    return true;
  }

  if (path === "/api/players" && method === "POST") {
    const body = (await request.postDataJSON()) as { slot: number; avatar: string };
    await fulfillProjection(route, 201, {
      player: {
        id: E2E_PLAYER.id,
        slot: body.slot,
        avatar: body.avatar,
        createdAt: E2E_PLAYER.createdAt,
      },
    });
    return true;
  }

  if (path === "/api/players/player_e2e" && method === "DELETE") {
    await fulfillProjection(route, 204, null);
    return true;
  }

  return false;
}

async function handleProgressRoute(
  route: Route,
  request: Request,
  path: string,
  method: string,
): Promise<boolean> {
  if (path !== "/api/progress") {
    return false;
  }

  if (method === "GET") {
    await fulfillProjection(route, 200, { progress: [] });
    return true;
  }

  const body = (await request.postDataJSON()) as Record<string, unknown>;
  await fulfillProjection(route, 200, {
    progress: {
      gameId: body.gameId,
      schemaVersion: body.schemaVersion,
      revision: 1,
      data: body.data,
      clientUpdatedAt: body.clientUpdatedAt,
      serverUpdatedAt: E2E_PLAYER.createdAt,
    },
  });
  return true;
}

async function handleApiRoute(route: Route, mode: ApiMode, probe: Probe): Promise<void> {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  const method = request.method();
  probe.apiCallsPush(`${method} ${path}`);

  if (mode.kind === "disabled") {
    // Every route answers the flag-off 503, exactly as the Worker does.
    await fulfillProjection(route, 503, { error: "auth_unavailable" });
    return;
  }

  if (await handleAuthRoute(route, path, mode)) {
    return;
  }
  if (await handlePlayersRoute(route, request, path, method)) {
    return;
  }
  if (await handleProgressRoute(route, request, path, method)) {
    return;
  }

  await fulfillProjection(route, 404, { error: "not_found" });
}

async function installApiMocks(page: Page, mode: ApiMode, probe: Probe): Promise<void> {
  await page.route("**/api/**", (route) => handleApiRoute(route, mode, probe));
}

test.describe("accountveld en feature-flag op de preview", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("gastmodus blijft spelen terwijl de API 503 geeft", async ({ page }) => {
    const probe = attachProbe(page);
    await installApiMocks(page, { kind: "disabled" }, probe);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Spellen" })).toBeVisible();

    await page.getByRole("link", { name: /sudoku/i }).click();
    await expect(page.getByRole("heading", { name: "Nieuw spel" })).toBeVisible();
    await page.getByRole("button", { name: "Spelen" }).click();
    await expect(page.getByRole("group", { name: /rooster van 4 bij 4/i })).toBeVisible();

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);

    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "Ouderaccount" })).toBeVisible();
    await expect(page.getByText("Inloggen is nu niet beschikbaar.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Voortgang synchroniseren" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Inloggen met Google/i })).toHaveCount(0);

    expect(probe.crossOriginUrls).toEqual([]);
    expect(probe.pageErrors).toEqual([]);
    // The flag-off API intentionally answers 503; Chromium logs those resource
    // loads. No other console error is allowed.
    expect(
      probe.consoleErrors.every((message) => message.includes("503 (Service Unavailable)")),
    ).toBe(true);
  });

  test("zonder sessie toont de accountpagina alleen de passkey-keuze", async ({ page }) => {
    const probe = attachProbe(page);
    await installApiMocks(page, { kind: "guest", google: false }, probe);

    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "Ouderaccount" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Account aanmaken met passkey" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Inloggen met passkey" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Inloggen met Google/i })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Voortgang synchroniseren" })).toHaveCount(0);

    expect(probe.crossOriginUrls).toEqual([]);
    expect(probe.consoleErrors).toEqual([]);
  });

  test("de Google-knop verschijnt alleen als de capabilities dat melden", async ({ page }) => {
    const probe = attachProbe(page);
    await installApiMocks(page, { kind: "guest", google: true }, probe);

    await page.goto("/account");
    await expect(page.getByRole("button", { name: "Account aanmaken met passkey" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Inloggen met Google" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Voortgang synchroniseren" })).toHaveCount(0);

    expect(probe.crossOriginUrls).toEqual([]);
    expect(probe.consoleErrors).toEqual([]);
  });

  test("met een gesimuleerde sessie somt het sync-paneel profielen op en kan per profiel aan en uit", async ({
    page,
  }) => {
    const probe = attachProbe(page);
    await installApiMocks(page, { kind: "signed-in", google: false }, probe);

    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "Ouderaccount" })).toBeVisible();
    await expect(page.getByText("Ouder", { exact: true })).toBeVisible();

    const syncPanel = page.getByRole("heading", { name: "Voortgang synchroniseren" });
    await expect(syncPanel).toBeVisible();
    await expect(page.getByText("Speler 1")).toBeVisible();

    const toggle = page.getByRole("button", { name: "Synchroniseren: uit" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await toggle.click();
    const enabled = page.getByRole("button", { name: "Synchroniseren: aan" });
    await expect(enabled).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Voortgang wordt gesynchroniseerd")).toBeVisible();

    // Sync aan: the server player is created (drives hydrate/list/create).
    await expect
      .poll(
        () =>
          probe.apiCalls.includes("POST /api/players") &&
          probe.apiCalls.includes("GET /api/progress"),
      )
      .toBe(true);

    await enabled.click();
    const disabled = page.getByRole("button", { name: "Synchroniseren: uit" });
    await expect(disabled).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByText("Synchronisatie staat uit; alles blijft lokaal.")).toBeVisible();

    expect(probe.crossOriginUrls).toEqual([]);
    expect(probe.consoleErrors).toEqual([]);
  });
});
