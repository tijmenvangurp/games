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
