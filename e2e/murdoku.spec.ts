import { expect, test } from "@playwright/test";

const NO_HORIZONTAL_OVERFLOW =
  "document.documentElement.scrollWidth > document.documentElement.clientWidth";

test.describe("Wie was het? op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("opent de zaak vanuit het menu zonder horizontaal scrollen", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /wie was het/i }).click();

    await expect(page.getByRole("heading", { name: "Wie was het?" })).toBeVisible();
    await expect(
      page.getByRole("img", { name: /plattegrond van de verdwenen taart/i }),
    ).toBeVisible();
    await expect(page.getByText("Anna stond in de keuken.")).toBeVisible();
    await expect(page.getByText("Bram stond op een stoel.")).toBeVisible();
    await expect(page.getByText("Cato stond in de badkamer.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Waar mag je staan?" })).toBeVisible();

    const overflows = (await page.evaluate(NO_HORIZONTAL_OVERFLOW)) as boolean;
    expect(overflows).toBe(false);
  });
});

test.describe("Wie was het? op een tablet", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("toont bord, kaarten en legenda", async ({ page }) => {
    await page.goto("/mysterie");

    await expect(page.getByRole("heading", { name: "Wie was het?" })).toBeVisible();
    const board = page.getByRole("img", { name: /plattegrond van de verdwenen taart/i });
    await expect(board).toBeVisible();
    await expect(page.getByRole("heading", { name: "Wie is wie?" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Waar mag je staan?" })).toBeVisible();

    const box = await board.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width ?? 0).toBeLessThanOrEqual(520);

    const overflows = (await page.evaluate(NO_HORIZONTAL_OVERFLOW)) as boolean;
    expect(overflows).toBe(false);
  });
});
