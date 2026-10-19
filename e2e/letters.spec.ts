import { expect, test } from "@playwright/test";

test.describe("letterpret op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("start de letterronde en speelt een losse klank af", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /letterpret/i }).click();

    await expect(page.getByRole("heading", { name: "Kies je les" })).toBeVisible();
    await page.getByRole("button", { name: /letterronde/i }).click();

    await expect(page.getByText("Vraag 1 van 6")).toBeVisible();
    await expect(page.getByRole("button", { name: "Luister" })).toBeVisible();

    // De eerste vraag is Klank & Letter: een losse klank, geen letternaam of woord.
    await expect(page.locator("audio").first()).toHaveAttribute(
      "src",
      /\/audio\/letters\/v2\/sounds\/[a-z]+\.(mp3|wav)$/,
    );

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });

  test("start woordlezen en speelt een woord af", async ({ page }) => {
    await page.goto("/letters");

    await expect(page.getByRole("heading", { name: "Kies je les" })).toBeVisible();
    await page.getByRole("button", { name: /woordlezen/i }).click();

    await expect(page.getByText("Woord 1 van 6")).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Kies het woord" }).getByRole("button"),
    ).toHaveCount(3);

    await expect(page.locator("audio").first()).toHaveAttribute(
      "src",
      /\/audio\/letters\/v2\/words\/[a-z]+\.wav$/,
    );
  });

  test("start woordtrein en speelt een woord af", async ({ page }) => {
    await page.goto("/letters");

    await expect(page.getByRole("heading", { name: "Kies je les" })).toBeVisible();
    await page.getByRole("button", { name: /woordtrein/i }).click();

    await expect(page.getByText("Woord 1 van 6")).toBeVisible();
    await expect(page.getByLabel("Woordvakken")).toBeVisible();

    const tiles = page.getByRole("group", { name: "Kies letters" }).getByRole("button");
    expect(await tiles.count()).toBeGreaterThanOrEqual(3);

    await expect(page.locator("audio").first()).toHaveAttribute(
      "src",
      /\/audio\/letters\/v2\/words\/[a-z]+\.wav$/,
    );
  });

  test("start klankplek en kiest de plek van de klank", async ({ page }) => {
    await page.goto("/letters");

    await expect(page.getByRole("heading", { name: "Kies je les" })).toBeVisible();
    await page.getByRole("button", { name: /klankplek/i }).click();

    await expect(page.getByText("Klank 1 van 6")).toBeVisible();
    const boxes = page.getByRole("group", { name: "Kies het vak" });
    await expect(boxes.getByRole("button")).toHaveCount(3);
    await expect(page.getByRole("button", { name: /^Letter [a-z]$/ })).toBeVisible();

    await expect(page.locator("audio").first()).toHaveAttribute(
      "src",
      /\/audio\/letters\/v2\/words\/[a-z]+\.wav$/,
    );
  });

  test("start zoemlees en leest een woord", async ({ page }) => {
    await page.goto("/letters");

    await expect(page.getByRole("heading", { name: "Kies je les" })).toBeVisible();
    await page.getByRole("button", { name: /zoemlees/i }).click();

    await expect(page.getByText("Woord 1 van 6")).toBeVisible();
    const letters = page.getByRole("group", { name: "Lees het woord" }).getByRole("button");
    expect(await letters.count()).toBeGreaterThanOrEqual(2);

    await letters.first().click();
    await expect(page.locator("audio").first()).toHaveAttribute(
      "src",
      /\/audio\/letters\/v2\/sounds\/[a-z]+\.(mp3|wav)$/,
    );
  });
});
