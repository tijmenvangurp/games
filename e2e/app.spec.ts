import { expect, test } from "@playwright/test";

test.describe("op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("speelt een sudoku vanuit het menu", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Spellen" })).toBeVisible();
    await page.getByRole("link", { name: /sudoku/i }).click();

    await expect(page.getByRole("heading", { name: "Nieuw spel" })).toBeVisible();
    await page.getByRole("button", { name: "Spelen" }).click();

    const board = page.getByRole("group", { name: /rooster van 4 bij 4/i });
    await expect(board).toBeVisible();
    await expect(board.getByRole("button")).toHaveCount(16);

    await board.getByRole("button", { name: /^leeg/ }).first().click();
    await page.getByRole("button", { name: "Kies 🐱" }).click();
    await expect(board.getByRole("button", { name: /^🐱, rij/ }).first()).toBeVisible();

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
    await page.getByRole("button", { name: "Spelen" }).click();

    await expect(page.getByRole("group", { name: /rooster van 4 bij 4/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hint" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Kies 🐶" })).toBeVisible();
  });
});

test.describe("zoeken op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("vindt Wobbel met de hint", async ({ page }) => {
    await page.goto("/zoeken");
    await page.getByRole("button", { name: "Spelen" }).click();

    await expect(page.getByRole("img", { name: /Zoek de Wobbel met de ster/i })).toBeVisible();

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
    await page.getByRole("button", { name: "Spelen" }).click();

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
