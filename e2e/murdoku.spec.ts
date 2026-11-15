import { expect, test, type Page } from "@playwright/test";

const NO_HORIZONTAL_OVERFLOW =
  "document.documentElement.scrollWidth > document.documentElement.clientWidth";

/** Kiest een persoon en tikt daarna op een vakje met die toegankelijke naam. */
async function placeOnBoard(page: Page, person: RegExp, cell: RegExp): Promise<void> {
  await page.getByRole("button", { name: person }).click();
  await page.getByRole("button", { name: cell }).click();
}

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

  test("lost de instapzaak op en ziet de onthulling", async ({ page }) => {
    await page.goto("/mysterie");
    const check = page.getByRole("button", { name: "Controleer" });
    await expect(check).toBeDisabled();

    await placeOnBoard(page, /^Anna\. Anna stond in de keuken/, /^leeg, rij 1, kolom 2/);
    await placeOnBoard(page, /^Bram\. Bram stond op een stoel/, /^leeg, rij 2, kolom 1/);
    await placeOnBoard(page, /^Cato\. Cato stond in de badkamer/, /rij 3, kolom 1/);
    await expect(check).toBeEnabled();

    // Een fout geeft neutrale feedback en laat het bord staan.
    await check.click();
    await expect(page.getByRole("status")).toContainText("Nog niet helemaal");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: /rij 3, kolom 4/ }).click();
    await check.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Opgelost!" })).toBeVisible();
    await expect(dialog.getByText("Cato was als enige bij Vera in de badkamer.")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Vera, rij 4, kolom 3/ })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Controleer" })).toBeDisabled();

    // Na de viering blijft de onthulling staan: de dader, het slachtoffer en haar kamer.
    await dialog.getByRole("button", { name: "Bekijk de plattegrond" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const reveal = page.getByRole("region", { name: "De dader" });
    await expect(reveal).toBeVisible();
    await expect(reveal.getByText("Cato was als enige bij Vera in de badkamer.")).toBeVisible();
    await expect(
      reveal.getByText("Het slachtoffer staat ook op de plattegrond; haar kamer is omlijnd."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^Vera, rij 4, kolom 3/ })).toBeVisible();
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
