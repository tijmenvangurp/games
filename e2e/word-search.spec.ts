import { expect, test } from "@playwright/test";

test.describe("woordzoeker op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("start een puzzel, toont het bord en kan vergroten", async ({ page }) => {
    await page.goto("/woordzoeker");
    await expect(page.getByRole("heading", { name: "Nieuw spel" })).toBeVisible();

    await page.getByRole("button", { name: "Spelen" }).click();

    const board = page.getByRole("group", { name: /Woordzoeker van 10 bij 10/i });
    await expect(board).toBeVisible();
    await expect(board.getByRole("button")).toHaveCount(100);

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);

    await page.getByRole("button", { name: /Vergroot/ }).click();
    await expect(page.getByRole("button", { name: /Heel bord/ })).toBeVisible();

    const overflowsZoomed = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflowsZoomed).toBe(false);
  });
});
