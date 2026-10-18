import { expect, test } from "@playwright/test";

test.describe("kruiswoordpuzzel op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("start het Pokémon-kruiswoord en typt een woord", async ({ page }) => {
    await page.goto("/kruiswoord");
    await expect(page.getByRole("heading", { name: "Nieuw spel" })).toBeVisible();

    await page.getByRole("button", { name: "Spelen" }).click();

    const board = page.getByRole("group", { name: "Kruiswoordpuzzel" });
    await expect(board).toBeVisible();
    await expect(board.getByRole("button")).toHaveCount(35);

    await page.getByRole("button", { name: /IJsvogel-legende/ }).click();
    for (const letter of "ARTICUNO") {
      await page.getByRole("button", { name: `Letter ${letter}` }).click();
    }

    const firstCell = board.getByRole("button", { name: /Rij 2, kolom 1/ });
    await expect(firstCell).toContainText("A");

    await page.getByRole("button", { name: "Controleer" }).click();
    await expect(page.getByText("Nog niet alle vakjes zijn gevuld.")).toBeVisible();

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });
});
