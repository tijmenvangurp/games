import { expect, test } from "@playwright/test";

test.describe("rekenen op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("start een ronde en beantwoordt een som", async ({ page }) => {
    await page.goto("/rekenen");
    await expect(page.getByRole("heading", { name: "Nieuw spel" })).toBeVisible();

    await page.getByRole("button", { name: /Keer/ }).click();
    await page.getByRole("button", { name: /Makkelijk/ }).click();
    await page.getByRole("button", { name: "Spelen" }).click();

    await expect(page.getByText(/Som 1 van 10/)).toBeVisible();
    const choices = page
      .getByRole("group", { name: "Kies het juiste antwoord" })
      .getByRole("button");
    await expect(choices).toHaveCount(3);

    for (const choice of await choices.all()) {
      if (await choice.isEnabled()) {
        await choice.click();
      }
      if ((await page.getByRole("button", { name: "Volgende" }).count()) > 0) {
        break;
      }
    }

    await expect(page.getByRole("button", { name: "Volgende" })).toBeVisible();

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });
});
