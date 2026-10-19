import { expect, test } from "@playwright/test";

test.describe("mengelmoes op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("combineert water en vuur met twee tikken", async ({ page }) => {
    await page.goto("/mengelmoes");

    await expect(page.getByRole("heading", { name: "Mengelmoes" })).toBeVisible();
    await page.getByRole("button", { name: "Water op de werkbank leggen" }).click();
    await expect(page.getByRole("button", { name: "Water, geselecteerd" })).toBeVisible();

    await page.getByRole("button", { name: "Vuur op de werkbank leggen" }).click();
    await expect(page.getByRole("heading", { name: "Stoom" })).toBeVisible();
    await expect(page.getByText("Water + Vuur")).toBeVisible();

    await page.getByRole("button", { name: "Verder ontdekken" }).click();
    await expect(page.getByRole("button", { name: "Stoom op de werkbank leggen" })).toBeVisible();

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });
});

test.describe("mengelmoes slepen op een tablet", () => {
  test.use({ viewport: { width: 1024, height: 900 } });

  test("sleept een element van het schap naar de werkbank", async ({ page }) => {
    await page.goto("/mengelmoes");

    const board = page.getByRole("group", { name: "Werkbank" });
    const earth = page.getByRole("button", { name: "Aarde op de werkbank leggen" });
    await earth.scrollIntoViewIfNeeded();

    const earthBox = await earth.boundingBox();
    const boardBox = await board.boundingBox();
    if (!earthBox || !boardBox) {
      throw new Error("Geen positie voor slepen");
    }

    await page.mouse.move(earthBox.x + earthBox.width / 2, earthBox.y + earthBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(boardBox.x + boardBox.width / 2, boardBox.y + boardBox.height / 2, {
      steps: 12,
    });
    await page.mouse.up();

    await expect(page.getByRole("button", { name: "Aarde, geselecteerd" })).toBeVisible();
  });

  test("sleept twee elementen op de werkbank op elkaar", async ({ page }) => {
    await page.goto("/mengelmoes");

    await page.getByRole("button", { name: "Water op de werkbank leggen" }).click();
    await page.getByRole("button", { name: "Water, geselecteerd" }).click();
    await page.getByRole("button", { name: "Vuur op de werkbank leggen" }).click();
    await page.getByRole("button", { name: "Vuur, geselecteerd" }).click();

    const water = page.getByRole("button", { name: "Water", exact: true });
    const fire = page.getByRole("button", { name: "Vuur", exact: true });
    const waterBox = await water.boundingBox();
    const fireBox = await fire.boundingBox();
    if (!waterBox || !fireBox) {
      throw new Error("Geen positie voor slepen");
    }

    await page.mouse.move(waterBox.x + waterBox.width / 2, waterBox.y + waterBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(fireBox.x + fireBox.width / 2, fireBox.y + fireBox.height / 2, {
      steps: 12,
    });
    await page.mouse.up();

    await expect(page.getByRole("heading", { name: "Stoom" })).toBeVisible();
  });
});
