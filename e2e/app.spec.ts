import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Schaakzetten gaan via slepen en neerzetten. Een tik is alleen kijken, dus
 * elke e2e-zet moet echt gesleept worden.
 */
async function dragPiece(page: Page, board: Locator, from: string, to: string): Promise<void> {
  await board.scrollIntoViewIfNeeded();
  const fromBox = await board.locator(`[data-square="${from}"]`).boundingBox();
  const toBox = await board.locator(`[data-square="${to}"]`).boundingBox();

  if (!fromBox || !toBox) {
    throw new Error(`Missing square ${from} or ${to}`);
  }

  await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
  // dnd-kit vangt de click vlak na een drag nog kort af. Wacht tot die
  // listener weg is voordat de test op een knop klikt.
  await page.waitForTimeout(80);
}

test.describe("op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("speelt een sudoku vanuit het menu", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Spellen" })).toBeVisible();
    await expect(page.getByRole("link", { name: /schaken/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /schaakpuzzels/i })).toHaveCount(0);
    await page.getByRole("link", { name: /sudoku/i }).click();

    await expect(page.getByRole("heading", { name: "Nieuw spel" })).toBeVisible();
    await page.getByRole("button", { name: "Spelen", exact: true }).click();

    const board = page.getByRole("group", { name: /rooster van 4 bij 4/i });
    await expect(board).toBeVisible();
    await expect(board.getByRole("button")).toHaveCount(16);

    await board.getByRole("button", { name: /^leeg/ }).first().click();
    const numberButton = page.locator('button[aria-label^="Kies"]:not([disabled])').first();
    const symbol = ((await numberButton.getAttribute("aria-label")) ?? "").replace("Kies ", "");
    await numberButton.click();
    await expect(
      board.getByRole("button", { name: new RegExp(`^${symbol}, rij`) }).first(),
    ).toBeVisible();

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });

  test("opent een sudoku via een deep link", async ({ page }) => {
    await page.goto("/sudoku");
    await expect(page.getByRole("heading", { name: "Nieuw spel" })).toBeVisible();
  });
});

test.describe("op een tablet", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("toont het bord en de knoppen naast elkaar", async ({ page }) => {
    await page.goto("/sudoku");
    await page.getByRole("button", { name: "Spelen", exact: true }).click();

    await expect(page.getByRole("group", { name: /rooster van 4 bij 4/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hint" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Kies 🐶" })).toBeVisible();
  });
});

test.describe("pijlen op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("start een level en gebruikt de hint", async ({ page }) => {
    await page.goto("/pijlen");
    await expect(page.getByRole("heading", { name: "Hart" })).toBeVisible();
    await page.getByRole("button", { name: "Spelen", exact: true }).click();

    const board = page.getByRole("group", { name: /pijlenpuzzel/i });
    await expect(board).toBeVisible();
    await expect(page.getByRole("progressbar")).toBeVisible();

    await page.getByRole("button", { name: "Hint" }).click();
    await expect(page.locator('[data-hint="true"]')).toHaveCount(1);

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });
});

test.describe("zoeken op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("vindt Wobbel met de hint", async ({ page }) => {
    await page.goto("/zoeken");
    await page.getByRole("button", { name: "Spelen", exact: true }).click();

    await expect(page.getByRole("group", { name: /Zoek de Wobbel met de ster/i })).toBeVisible();

    await page.getByRole("button", { name: "Hint" }).click();
    const hint = page.getByTestId("hint-region");
    await expect(hint).toBeVisible();

    const box = await hint.boundingBox();
    if (!box) {
      throw new Error("Hint region has no bounding box");
    }
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    await expect(page.getByRole("heading", { name: "Gevonden!" })).toBeVisible();
  });
});

test.describe("memory op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("draait kaartjes om", async ({ page }) => {
    await page.goto("/memory");
    await page.getByRole("button", { name: "Spelen", exact: true }).click();

    const cards = page.locator("[data-card-index]");
    await expect(cards).toHaveCount(16);

    await cards.nth(0).click();
    await cards.nth(1).click();

    await expect(cards.nth(0)).toHaveAttribute("aria-pressed", "true");
    await expect(cards.nth(1)).toHaveAttribute("aria-pressed", "true");

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });
});

test.describe("schaaktutorial op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("sleept de toren naar de ster", async ({ page }) => {
    await page.goto("/schaken/les");

    const board = page.getByRole("group", { name: /coördinaten/i });

    await dragPiece(page, board, "h1", "e1");
    await expect(page.getByText("Goed! Nog één zet naar de ster.")).toBeVisible();

    await dragPiece(page, board, "e1", "e5");
    await expect(page.getByText("Ster! De toren rijdt recht.")).toBeVisible();
  });

  test("tikt op de ster zonder meteen een zet te doen", async ({ page }) => {
    await page.goto("/schaken/les");

    const board = page.getByRole("group", { name: /coördinaten/i });
    await board.locator('[data-square="e5"]').click();

    await expect(
      page.getByText("Kijk! Zo rijdt de toren. Tik op het stuk om te kijken."),
    ).toBeVisible();
    await expect(page.getByText("Ster! De toren rijdt recht.")).toHaveCount(0);
    await expect(page.getByText("Die mag niet. Sleep naar een groene stip.")).toHaveCount(0);
  });

  test("tikt om te kijken en sleept om te zetten", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /schaken/i }).click();

    await expect(page.getByRole("heading", { name: "Schaken" })).toBeVisible();
    await page.getByRole("link", { name: /Schaakles/ }).click();

    await expect(page.getByRole("heading", { name: "Schaakles" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "De Toren-trein" })).toBeVisible();
    await expect(
      page.getByText("Kijk! Zo rijdt de toren. Tik op het stuk om te kijken."),
    ).toBeVisible();

    const kijk = page.getByRole("button", { name: "Kijk" });
    await expect(kijk).toHaveAttribute("aria-pressed", "true");
    await kijk.click();
    await expect(page.getByText("Rijd met de toren naar de ster.")).toBeVisible();

    const board = page.getByRole("group", { name: /coördinaten/i });
    await expect(board).toBeVisible();
    await expect(board.getByText("a", { exact: true })).toBeVisible();
    await expect(board.getByText("1", { exact: true })).toBeVisible();

    await board.locator('[data-square="h1"]').click();
    await expect(page.getByText("Sleep naar een groene stip.")).toBeVisible();

    // Een tweede tik speelt nog steeds geen zet.
    await board.locator('[data-square="e1"]').click();
    await expect(page.getByText("Rijd met de toren naar de ster.")).toBeVisible();
    await expect(page.getByText("Goed! Nog één zet naar de ster.")).toHaveCount(0);

    await dragPiece(page, board, "h1", "e1");
    await expect(page.getByText("Goed! Nog één zet naar de ster.")).toBeVisible();

    await dragPiece(page, board, "e1", "e5");
    await expect(page.getByText("Ster! De toren rijdt recht.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Volgende les" })).toBeEnabled();

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });

  test("speelt de rokade", async ({ page }) => {
    await page.goto("/schaken/les");
    await page.getByText("Kies een les").click();
    await page.getByRole("button", { name: "Les 7: Rokade" }).click();
    await expect(page.getByRole("heading", { name: "Rokade" })).toBeVisible();
    // De stukken animeren naar hun nieuwe plek; sleep pas daarna.
    await page.waitForTimeout(200);

    const board = page.getByRole("group", { name: /coördinaten/i });
    await dragPiece(page, board, "e1", "g1");

    await expect(page.getByText("Rokade! Koning en toren zijn veilig.")).toBeVisible();
  });

  test("zet de koning schaak", async ({ page }) => {
    await page.goto("/schaken/les");
    await page.getByText("Kies een les").click();
    await page.getByRole("button", { name: "Les 8: Schaak zetten" }).click();
    await expect(page.getByRole("heading", { name: "Schaak zetten" })).toBeVisible();
    // De stukken animeren naar hun nieuwe plek; sleep pas daarna.
    await page.waitForTimeout(200);

    const board = page.getByRole("group", { name: /coördinaten/i });
    await dragPiece(page, board, "a1", "a8");

    await expect(page.getByText("Schaak! De koning wordt aangevallen.")).toBeVisible();
  });

  test("zet schaakmat met de dame", async ({ page }) => {
    await page.goto("/schaken/les");
    await page.getByText("Kies een les").click();
    await page.getByRole("button", { name: "Les 9: Schaakmat" }).click();
    await expect(page.getByRole("heading", { name: "Schaakmat", exact: true })).toBeVisible();
    // De stukken animeren naar hun nieuwe plek; sleep pas daarna.
    await page.waitForTimeout(200);

    const board = page.getByRole("group", { name: /coördinaten/i });
    await dragPiece(page, board, "g6", "g7");

    await expect(page.getByText("Schaakmat! De koning kan nergens meer heen.")).toBeVisible();
  });
});

test.describe("schaaktutorial op een tablet", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("toont het bord, de coördinaten en de navigatie", async ({ page }) => {
    await page.goto("/schaken/les");

    const board = page.getByRole("group", { name: /coördinaten/i });
    await expect(board).toBeVisible();
    await expect(board.getByText("a", { exact: true })).toBeVisible();
    await expect(board.getByText("8", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Kijk" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Toon zet" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Opnieuw" })).toBeVisible();
    await expect(page.getByText("Kies een les")).toBeVisible();
  });
});

test.describe("schaakpartij op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("speelt samen een zet en draait die terug", async ({ page }) => {
    await page.goto("/schaken/partij");

    await expect(page.getByRole("heading", { name: "Nieuwe partij" })).toBeVisible();
    await page.getByRole("button", { name: "Spelen", exact: true }).click();

    await expect(page.getByText("Wit is aan zet.")).toBeVisible();
    const board = page.getByRole("group", { name: /coördinaten/i });
    await expect(board).toBeVisible();

    await board.locator('[data-square="e2"]').click();
    await board.locator('[data-square="e4"]').click();

    await expect(page.getByText("Zwart is aan zet.")).toBeVisible();
    await expect(page.getByText("Zetten (1)")).toBeVisible();

    await page.getByRole("button", { name: "Ongedaan" }).click();
    await expect(page.getByText("Wit is aan zet.")).toBeVisible();

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });

  test("geeft een hint in twee stappen", async ({ page }) => {
    await page.goto("/schaken/partij");
    await page.getByRole("button", { name: "Spelen", exact: true }).click();

    const hintedSquares = () =>
      page.evaluate(
        () =>
          Array.from(document.querySelectorAll("[data-square]"))
            .map((square) => square.lastElementChild)
            .filter((square): square is HTMLElement => square instanceof HTMLElement)
            .filter((square) => getComputedStyle(square).boxShadow.includes("245, 158, 11")).length,
      );

    await page.getByRole("button", { name: "Hint" }).click();
    await expect(page.getByRole("button", { name: "Toon zet" })).toBeVisible({ timeout: 25_000 });
    await expect.poll(hintedSquares).toBe(1);

    await page.getByRole("button", { name: "Toon zet" }).click();
    await expect(page.getByRole("button", { name: "Wis hint" })).toBeVisible();
    await expect.poll(hintedSquares).toBe(2);

    await page.getByRole("button", { name: "Wis hint" }).click();
    await expect(page.getByRole("button", { name: "Hint" })).toBeVisible();
    await expect.poll(hintedSquares).toBe(0);
  });

  test("bewaart de partij als je de instellingen opent", async ({ page }) => {
    await page.goto("/schaken/partij");
    await page.getByRole("button", { name: "Spelen", exact: true }).click();

    const board = page.getByRole("group", { name: /coördinaten/i });
    await board.locator('[data-square="e2"]').click();
    await board.locator('[data-square="e4"]').click();
    await expect(page.getByText("Zetten (1)")).toBeVisible();

    await page.getByRole("button", { name: "Instellingen" }).click();
    await expect(page.getByText("Je partij is bewaard")).toBeVisible();
    await expect(page.getByRole("button", { name: "Nieuwe partij" })).toBeVisible();

    await page.reload();
    await expect(page.getByText("Je partij is bewaard")).toBeVisible();
    await page.getByRole("button", { name: /Doorgaan/ }).click();

    await expect(page.getByText("Zetten (1)")).toBeVisible();
    await expect(page.getByText("Zwart is aan zet.")).toBeVisible();
  });

  test("kiest een avatar en een naam voor de partij", async ({ page }) => {
    await page.goto("/schaken/partij");

    await page.getByRole("button", { name: "Avatar 🦁" }).first().click();
    await page.getByLabel("Naam voor wit").fill("Noa");
    await expect(page.getByRole("button", { name: "Avatar 🦁" }).first()).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByRole("button", { name: "Spelen", exact: true }).click();

    await expect(page.getByText("Noa is aan zet.")).toBeVisible();
  });

  test("laat de computer met zwart openen", async ({ page }) => {
    await page.goto("/schaken/partij");

    await page.getByRole("button", { name: "Computer" }).click();
    await page.getByRole("button", { name: /Zwart/ }).click();

    const stockfishLoaded = page.waitForRequest(
      (request) => request.url().includes("/stockfish/stockfish.wasm.js"),
      { timeout: 20_000 },
    );
    const wasmLoaded = page.waitForRequest(
      (request) => request.url().endsWith("/stockfish/stockfish.wasm"),
      { timeout: 20_000 },
    );
    await page.getByRole("button", { name: "Spelen", exact: true }).click();

    await Promise.all([stockfishLoaded, wasmLoaded]);
    await expect(page.getByText("Zetten (1)")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Zwart is aan zet.")).toBeVisible();
  });
});

test.describe("schaken op een tablet", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("toont de hub met les, partij en puzzels", async ({ page }) => {
    await page.goto("/schaken");

    await expect(page.getByRole("heading", { name: "Schaken" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Schaakles/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Schaakpartij/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Schaakpuzzels/ })).toBeVisible();
  });
});

test.describe("schaakpuzzels op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("lost een schaakmatpuzzel op en gaat verder", async ({ page }) => {
    await page.goto("/puzzels");

    await expect(page.getByRole("heading", { name: "Schaakpuzzels" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Kies een puzzel" })).toBeVisible();
    await expect(page.getByText(/0 van 42 opgelost/)).toBeVisible();

    await page.getByRole("button", { name: /^Puzzel 1,/ }).click();
    await expect(page.getByRole("heading", { name: "Zet schaakmat!" })).toBeVisible();
    await expect(page.getByText(/Puzzel 1 van 42/)).toBeVisible();

    const board = page.getByRole("group", { name: /coördinaten/i });
    await expect(board.getByText("a", { exact: true })).toBeVisible();
    await dragPiece(page, board, "a1", "a8");

    await expect(page.getByText("Schaakmat! Knap gedaan.")).toBeVisible();
    const next = page.getByRole("button", { name: "Volgende puzzel" });
    await expect(next).toBeEnabled();
    await next.click();

    await expect(page.getByText(/Puzzel 2 van 42/)).toBeVisible();

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });

  test("onthoudt welke puzzel je al hebt opgelost", async ({ page }) => {
    await page.goto("/puzzels");
    await page.getByRole("button", { name: /^Puzzel 1,/ }).click();

    const board = page.getByRole("group", { name: /coördinaten/i });
    await dragPiece(page, board, "a1", "a8");
    await expect(page.getByText("Schaakmat! Knap gedaan.")).toBeVisible();

    await page.getByRole("button", { name: "Overzicht" }).click();
    await expect(page.getByText(/1 van 42 opgelost/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Puzzel 1, opgelost" })).toBeVisible();

    await page.reload();
    await expect(page.getByText(/1 van 42 opgelost/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Puzzel 1, opgelost" })).toBeVisible();
  });

  test("wisselt van moeilijkheidsgraad en lost een lastige puzzel op", async ({ page }) => {
    await page.goto("/puzzels");

    const medium = page.getByRole("button", { name: /Lastig/ });
    await medium.click();
    await expect(medium).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /^Puzzel 1,/ }).click();
    await expect(page.getByText(/Puzzel 1 van 42/)).toBeVisible();

    const board = page.getByRole("group", { name: /coördinaten/i });
    await dragPiece(page, board, "h7", "h8");

    await expect(page.getByText("Schaakmat! Knap gedaan.")).toBeVisible();

    await page.getByRole("button", { name: "Overzicht" }).click();
    const hard = page.getByRole("button", { name: /Uitdagend/ });
    await hard.click();
    await expect(hard).toHaveAttribute("aria-pressed", "true");
  });

  test("geeft feedback op een verkeerde zet en laat opnieuw proberen", async ({ page }) => {
    await page.goto("/puzzels");
    await page.getByRole("button", { name: /^Puzzel 1,/ }).click();

    const board = page.getByRole("group", { name: /coördinaten/i });
    await dragPiece(page, board, "a1", "a2");

    await expect(page.getByText(/Die zet is niet de beste/)).toBeVisible();

    await dragPiece(page, board, "a1", "a8");
    await expect(page.getByText("Schaakmat! Knap gedaan.")).toBeVisible();
  });

  test("tikt om te kijken en speelt daarmee geen zet", async ({ page }) => {
    await page.goto("/puzzels");
    await page.getByRole("button", { name: /^Puzzel 1,/ }).click();

    const board = page.getByRole("group", { name: /coördinaten/i });

    // Tik het eigen stuk en daarna het doelveld aan: dat is alleen kijken.
    await board.locator('[data-square="a1"]').click();
    await board.locator('[data-square="a8"]').click();

    await expect(page.getByText("Schaakmat! Knap gedaan.")).toHaveCount(0);
    await expect(page.getByText(/Die zet is niet de beste/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Volgende puzzel" })).toBeDisabled();

    // Ook een stuk van de tegenstander mag je aantikken om te kijken.
    await board.locator('[data-square="d8"]').click();

    await expect(
      page.getByText("Kijk! Dit stuk is van de tegenstander. Sleep je eigen stuk om te zetten."),
    ).toBeVisible();
    await expect(page.getByText(/Die zet is niet de beste/)).toHaveCount(0);
    await expect(page.getByText("Schaakmat! Knap gedaan.")).toHaveCount(0);
  });
});

test.describe("schaakpuzzels op een tablet", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("toont het bord, de hint en de navigatie", async ({ page }) => {
    await page.goto("/puzzels");
    await page.getByRole("button", { name: /^Puzzel 1,/ }).click();

    await expect(page.getByRole("group", { name: /coördinaten/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hint" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Opnieuw" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Overzicht" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Volgende puzzel" })).toBeVisible();
  });
});

test.describe("pokémon quiz op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("kiest een naam en krijgt feedback", async ({ page }) => {
    await page.goto("/raad");
    await page.getByRole("button", { name: "Spelen", exact: true }).click();

    const options = page.getByRole("group", { name: "Kies de juiste naam" });
    await expect(options.getByRole("button")).toHaveCount(4);

    await options.getByRole("button").first().click();
    await expect(page.getByRole("button", { name: /Volgende Pokémon/ })).toBeVisible();
    await expect(page.locator('[data-answer-state="correct"]')).toHaveCount(1);
    await expect(
      page.locator('[data-answer-state="wrong"], [data-answer-state="muted"]'),
    ).toHaveCount(3);

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });
});
