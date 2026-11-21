import { expect, test, type Page } from "@playwright/test";

const NO_HORIZONTAL_OVERFLOW =
  "document.documentElement.scrollWidth > document.documentElement.clientWidth";

async function startRound(page: Page, theme: RegExp, level: RegExp): Promise<void> {
  await page.goto("/geheime-code");
  await expect(page.getByRole("heading", { name: "Kies je code" })).toBeVisible();
  await page.getByRole("button", { name: theme }).click();
  await page.getByRole("button", { name: level }).click();
  await page.getByRole("button", { name: "Spelen" }).click();
  await expect(page.getByRole("region", { name: "Code", exact: true })).toBeVisible();
}

test.describe("geheime code op een tablet", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("leest de code en vult de eerste letter in", async ({ page }) => {
    await startRound(page, /Tuin/, /Kijk & schrijf/);

    const active = page.locator('[aria-current="step"]');
    await expect(active).toBeVisible();
    const label = (await active.getAttribute("aria-label")) ?? "";
    const symbol = label.split(",")[0];
    const tableLabel =
      (await page.locator(`[aria-label^="${symbol}: letter "]`).getAttribute("aria-label")) ?? "";
    const letter = tableLabel.split("letter ")[1];
    expect(letter).toBeTruthy();

    await page.getByRole("button", { name: letter!.toUpperCase(), exact: true }).click();
    await expect(
      page.getByRole("button", { name: new RegExp(`^${symbol}, letter ${letter}`) }),
    ).toBeVisible();

    const overflows = (await page.evaluate(NO_HORIZONTAL_OVERFLOW)) as boolean;
    expect(overflows).toBe(false);
  });
});

test.describe("geheime code op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("past op het scherm en houdt de toetsen groot genoeg", async ({ page }) => {
    await startRound(page, /Sinterklaas/, /Zoek & schrijf/);

    const key = page.getByRole("button", { name: "A", exact: true });
    const box = await key.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    const overflows = (await page.evaluate(NO_HORIZONTAL_OVERFLOW)) as boolean;
    expect(overflows).toBe(false);
  });
});
