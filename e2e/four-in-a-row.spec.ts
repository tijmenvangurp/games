import { expect, test } from "@playwright/test";

const NO_HORIZONTAL_OVERFLOW =
  "document.documentElement.scrollWidth > document.documentElement.clientWidth";

test.describe("vier op een rij op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("speelt vier op een rij vanuit het menu", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Spellen" })).toBeVisible();
    await page.getByRole("link", { name: /vier op een rij/i }).click();

    await expect(page.getByRole("heading", { name: "Nieuw spel" })).toBeVisible();
    await page.getByRole("button", { name: /Klein bord/ }).click();
    await page.getByRole("button", { name: "Spelen" }).click();

    await expect(page.getByRole("group", { name: "Speelbord" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Kolom/ })).toHaveCount(6);
    await expect(page.getByText(/Blauw begint/)).toBeVisible();

    for (const column of [1, 2, 1, 2, 1, 2, 1]) {
      await page.getByRole("button", { name: `Kolom ${column}`, exact: true }).click();
    }

    await expect(page.getByText("Blauw heeft vier op een rij!")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Blauw wint!" })).toBeVisible();
    await expect(page.getByText(/De stand is nu Blauw 1 – Bruin 0/)).toBeVisible();

    await page.getByRole("button", { name: "Nog een potje" }).click();
    await expect(page.getByText(/Bruin begint/)).toBeVisible();

    const overflows = (await page.evaluate(NO_HORIZONTAL_OVERFLOW)) as boolean;
    expect(overflows).toBe(false);
  });

  test("houdt elke kolom groot genoeg om te tikken", async ({ page }) => {
    await page.goto("/vier-op-een-rij");
    await page.getByRole("button", { name: "Spelen" }).click();

    const columns = page.getByRole("button", { name: /^Kolom/ });
    await expect(columns).toHaveCount(7);

    for (const column of await columns.all()) {
      const box = await column.boundingBox();
      if (!box) {
        throw new Error("Geen kolom");
      }
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("maakt een zet ongedaan en begint opnieuw", async ({ page }) => {
    await page.goto("/vier-op-een-rij");
    await page.getByRole("button", { name: "Spelen" }).click();

    const undo = page.getByRole("button", { name: "Ongedaan maken" });
    await expect(undo).toBeDisabled();

    await page.getByRole("button", { name: "Kolom 4", exact: true }).click();
    await expect(page.getByText("Bruin is aan de beurt.")).toBeVisible();
    await expect(undo).toBeEnabled();

    await undo.click();
    await expect(page.getByText(/Blauw begint/)).toBeVisible();
    await expect(undo).toBeDisabled();

    await page.getByRole("button", { name: "Opnieuw beginnen" }).click();
    await expect(page.getByText(/Blauw begint/)).toBeVisible();

    const overflows = (await page.evaluate(NO_HORIZONTAL_OVERFLOW)) as boolean;
    expect(overflows).toBe(false);
  });
});

test.describe("vier op een rij op een tablet", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("toont het grote bord met zeven kolommen", async ({ page }) => {
    await page.goto("/vier-op-een-rij");

    await expect(page.getByRole("heading", { name: "Vier op een Rij" })).toBeVisible();
    await expect(page.getByText(/Groot bord 7 × 6/)).toBeVisible();

    await page.getByRole("button", { name: "Spelen" }).click();
    await expect(page.getByRole("button", { name: /^Kolom/ })).toHaveCount(7);

    await page.getByRole("button", { name: "Kolom 7", exact: true }).click();
    await expect(page.getByText("Bruin is aan de beurt.")).toBeVisible();

    const overflows = (await page.evaluate(NO_HORIZONTAL_OVERFLOW)) as boolean;
    expect(overflows).toBe(false);
  });
});
