import { expect, test } from "@playwright/test";

async function solveFirstLevel(page: import("@playwright/test").Page): Promise<void> {
  await page.getByRole("button", { name: "Klein tandwiel" }).click();
  await page.locator('[data-hole-id="2,2"]').click();
  await expect(page.locator("[data-draaiwerk-board]")).toHaveAttribute("data-status", "solved");
  await expect(page.getByRole("heading", { name: "Gelukt!" })).toBeVisible();
}

test.describe("draaiwerk op een landschapstablet", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("speelt level 1 en gaat naar level 2", async ({ page }) => {
    await page.goto("/draaiwerk");

    await expect(page.getByRole("heading", { name: "Draaiwerk" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Eerste tand/ })).toBeVisible();
    await expect(page.locator("[data-draaiwerk-board]")).toHaveAttribute("data-status", "playing");

    const metrics = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      innerWidth,
      innerHeight,
    }));
    expect(metrics.width).toBe(metrics.innerWidth);
    expect(metrics.height).toBe(metrics.innerHeight);

    await solveFirstLevel(page);
    await page.getByRole("button", { name: "Volgende level" }).click();

    await expect(page.getByRole("heading", { name: /Twee tussenwielen/ })).toBeVisible();
    await expect(page.locator("[data-draaiwerk-board]")).toHaveAttribute("data-status", "playing");
  });

  test("toont een liggende as met twee uiteinden", async ({ page }) => {
    await page.goto("/draaiwerk");
    await page.evaluate(() => {
      localStorage.setItem(
        "games.draaiwerk.v1",
        JSON.stringify({ state: { unlocked: 10, current: 9 }, version: 1 }),
      );
    });
    await page.reload();

    await expect(page.getByRole("heading", { name: /De liggende as/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Liggende as/ })).toBeVisible();
  });
});

test.describe("draaiwerk op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("past zonder horizontale overflow en is speelbaar", async ({ page }) => {
    await page.goto("/draaiwerk");

    await expect(page.locator("[data-draaiwerk-board]")).toBeVisible();
    await expect(page.getByRole("button", { name: "Klein tandwiel" })).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);

    await solveFirstLevel(page);
  });
});
