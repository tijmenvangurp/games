import { expect, test, type Page } from "@playwright/test";

const NO_HORIZONTAL_OVERFLOW =
  "document.documentElement.scrollWidth > document.documentElement.clientWidth";

async function waitForTurn(page: Page, name: RegExp): Promise<void> {
  const target = page.getByText(name);
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await target.isVisible().catch(() => false)) {
      return;
    }
    const verder = page.getByRole("button", { name: "Verder" });
    if (await verder.isVisible().catch(() => false)) {
      await verder.click();
    }
    await page.waitForTimeout(250);
  }
  await expect(target).toBeVisible();
}

test.describe("ganzenbord op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("speelt een beurt vanuit het menu", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Spellen" })).toBeVisible();
    await page.getByRole("link", { name: /ganzenbord/i }).click();

    await expect(page.getByRole("heading", { name: "Nieuw spel" })).toBeVisible();
    await page.getByRole("button", { name: "Spelen", exact: true }).click();

    await expect(page.getByRole("img", { name: /Ganzenbord met 63 vakjes/ })).toBeVisible();
    await expect(page.getByText("Speler 1", { exact: true })).toBeVisible();
    await expect(page.getByText("Speler 2", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Gooi met de dobbelstenen" }).click();
    await waitForTurn(page, /Speler 2 is aan de beurt/);

    const overflows = (await page.evaluate(NO_HORIZONTAL_OVERFLOW)) as boolean;
    expect(overflows).toBe(false);
  });
});

test.describe("ganzenbord op een tablet", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("toont het grote bord en vier spelers", async ({ page }) => {
    await page.goto("/ganzenbord");

    await expect(page.getByRole("heading", { name: "Ganzenbord" })).toBeVisible();
    await page.getByRole("button", { name: "4 spelers" }).click();
    await page.getByRole("button", { name: "Speler 3: computer" }).click();
    await page.getByRole("button", { name: "Speler 4: computer" }).click();
    await page.getByRole("button", { name: "Spelen", exact: true }).click();

    await expect(page.getByRole("img", { name: /Ganzenbord met 63 vakjes/ })).toBeVisible();
    await expect(page.getByLabel("Spelers").getByRole("listitem")).toHaveCount(4);
    await expect(page.getByText("CPU 3")).toBeVisible();
    await expect(page.getByText("CPU 4")).toBeVisible();

    const board = page.getByRole("img", { name: /Ganzenbord met 63 vakjes/ });
    const box = await board.boundingBox();
    if (!box) {
      throw new Error("Geen bord");
    }
    expect(box.width).toBeGreaterThan(500);

    const overflows = (await page.evaluate(NO_HORIZONTAL_OVERFLOW)) as boolean;
    expect(overflows).toBe(false);
  });
});
