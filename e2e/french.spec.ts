import { expect, test } from "@playwright/test";

test.describe("Frans sorteren op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("sleept een woord naar een categorie", async ({ page }) => {
    await page.goto("/frans/sorteren");
    await expect(page.getByText("Voortgang")).toBeVisible();

    const word = page.locator("[data-sort-word]").first();
    const category = page.locator("[data-sort-category]").first();
    const wordText = (await word.textContent())?.trim() ?? "";
    const wordBox = await word.boundingBox();
    const categoryBox = await category.boundingBox();
    if (!wordBox || !categoryBox) {
      throw new Error("Geen drag-coördinaten");
    }

    await page.mouse.move(wordBox.x + wordBox.width / 2, wordBox.y + wordBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(wordBox.x + wordBox.width / 2 + 12, wordBox.y + wordBox.height / 2 + 12, {
      steps: 4,
    });
    await page.mouse.move(
      categoryBox.x + categoryBox.width / 2,
      categoryBox.y + categoryBox.height / 2,
      { steps: 12 },
    );
    await page.mouse.up();

    await expect(page.getByRole("button", { name: `Verwijder ${wordText}` })).toBeVisible();
    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });
});
