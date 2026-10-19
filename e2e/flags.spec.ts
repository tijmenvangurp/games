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

  test("speelt de kaartpuzzel met slepen en tikken", async ({ page }) => {
    await page.goto("/vlaggen");
    await page.getByRole("button", { name: /Kaartpuzzel/ }).click();
    await page.getByRole("button", { name: "Spelen" }).click();

    await expect(page.getByTestId("puzzle-map")).toBeVisible();
    await expect(page.getByText(/van 8 geplaatst/)).toBeVisible();

    const pieces = page.getByRole("button", { name: /\(stuk\)$/ });
    await expect(pieces).toHaveCount(8);

    const targets = page.locator('[data-country][role="button"]');
    await expect(targets).toHaveCount(8);

    // Slepen: het eerste stuk naar het eerste lege vlak.
    const source = await pieces.first().boundingBox();
    const destination = await targets.first().boundingBox();
    if (!source || !destination) {
      throw new Error("Geen stuk of doelvlak");
    }
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      destination.x + destination.width / 2,
      destination.y + destination.height / 2,
      { steps: 8 },
    );
    await page.mouse.up();

    await expect(page.getByText(/Goed!|Dat is|Hier hoort/)).toBeVisible();

    // Tikken: stuk kiezen en daarna een vlak aantikken.
    await page.waitForTimeout(500);
    await pieces.nth(2).click();
    await targets.nth(1).click();

    await expect(page.getByText(/Goed!|Dat is|Hier hoort/)).toBeVisible();

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
