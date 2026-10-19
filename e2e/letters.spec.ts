import { expect, test } from "@playwright/test";

test.describe("letterpret op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("start de letterronde en speelt een losse klank af", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /letterpret/i }).click();

    await expect(
      page.getByRole("heading", { name: "Hoor de klank. Kies de letter." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Start de letterronde" }).click();

    await expect(page.getByText("Vraag 1 van 6")).toBeVisible();
    await expect(page.getByRole("button", { name: "Luister" })).toBeVisible();

    // De eerste vraag is Klank & Letter: een losse klank, geen letternaam of woord.
    await expect(page.locator("audio").first()).toHaveAttribute(
      "src",
      /\/audio\/letters\/v1\/sounds\/[a-z]\.wav$/,
    );

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });
});
