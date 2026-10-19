import { expect, test } from "@playwright/test";

const PROMPTS = {
  flag: "Welk land hoort bij deze vlag?",
  name: "Welke vlag hoort bij dit land?",
};

test.describe("vlaggen op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("laadt een lokale vlag en beantwoordt een vraag", async ({ page }) => {
    await page.goto("/vlaggen");
    await expect(page.getByRole("heading", { name: "Nieuw spel" })).toBeVisible();

    await page.getByRole("button", { name: /Afrika/ }).click();
    await page.getByRole("button", { name: /Makkelijk/ }).click();
    await page.getByRole("button", { name: "Spelen" }).click();

    await expect(page.getByText(/Vraag 1 van 10/)).toBeVisible();
    const choices = page
      .getByRole("group", { name: "Kies het juiste antwoord" })
      .getByRole("button");
    await expect(choices).toHaveCount(3);

    const flag = page.locator('img[src^="/flags/"]').first();
    await expect(flag).toBeVisible();
    expect(
      await flag.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    ).toBe(true);

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

  test("speelt een ronde met de Nederlandse provincies en toont de kaart", async ({ page }) => {
    await page.goto("/vlaggen");
    await page.getByRole("button", { name: /Nederland/ }).click();
    await expect(page.getByText("12 provincies")).toBeVisible();
    await page.getByRole("button", { name: "Spelen" }).click();

    await expect(page.getByText(/Vraag 1 van 10/)).toBeVisible();
    await expect(
      page.getByText(/Welke (provincie|vlag) hoort bij deze (vlag|provincie)\?/),
    ).toBeVisible();

    const choices = page
      .getByRole("group", { name: "Kies het juiste antwoord" })
      .getByRole("button");
    for (const choice of await choices.all()) {
      if (await choice.isEnabled()) {
        await choice.click();
      }
      if ((await page.getByRole("button", { name: /Volgende|Klaar/ }).count()) > 0) {
        break;
      }
    }

    // The world map is a separate chunk; answering is what loads it.
    await expect(page.getByTestId("place-map")).toBeVisible();

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });

  test("wisselt beide richtingen af binnen één ronde", async ({ page }) => {
    await page.goto("/vlaggen");
    await page.getByRole("button", { name: /Europa/ }).click();
    await page.getByRole("button", { name: "Spelen" }).click();

    const seen = new Set<string>();

    for (let question = 0; question < 10; question += 1) {
      for (const prompt of Object.values(PROMPTS)) {
        if ((await page.getByText(prompt).count()) > 0) {
          seen.add(prompt);
        }
      }

      const choices = page
        .getByRole("group", { name: "Kies het juiste antwoord" })
        .getByRole("button");
      for (const choice of await choices.all()) {
        if (await choice.isEnabled()) {
          await choice.click();
        }
        const next = page.getByRole("button", { name: /Volgende|Klaar/ });
        if ((await next.count()) > 0) {
          await next.click();
          break;
        }
      }
    }

    expect([...seen].sort()).toEqual([PROMPTS.flag, PROMPTS.name].sort());
  });
});
