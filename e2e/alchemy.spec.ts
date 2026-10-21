import { expect, test, type Locator, type Page } from "@playwright/test";
import { ELEMENTS } from "../libs/entities/alchemy/model/elements";

async function touchDrag(page: Page, from: Locator, to: Locator): Promise<void> {
  const fromBox = await from.boundingBox();
  const toBox = await to.boundingBox();
  if (!fromBox || !toBox) {
    throw new Error("Geen positie voor aanraaksleep");
  }

  const client = await page.context().newCDPSession(page);
  const start = { x: fromBox.x + fromBox.width / 2, y: fromBox.y + fromBox.height / 2 };
  const end = { x: toBox.x + toBox.width / 2, y: toBox.y + toBox.height / 2 };

  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: start.x, y: start.y }],
  });
  await page.waitForTimeout(220);

  for (let step = 1; step <= 12; step += 1) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: start.x + ((end.x - start.x) * step) / 12,
          y: start.y + ((end.y - start.y) * step) / 12,
        },
      ],
    });
    await page.waitForTimeout(16);
  }

  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(100);
}

test.describe("mengelmoes op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("maakt de eerste opdracht en gaat verder", async ({ page }) => {
    await page.goto("/mengelmoes");
    const mission = page.getByTestId("alchemy-mission");
    await expect(mission).toContainText("Maak modder.");

    await page.getByRole("button", { name: "Water op de werkbank leggen" }).click();
    await page.getByRole("button", { name: "Aarde op de werkbank leggen" }).click();
    await page.getByRole("button", { name: "Verder ontdekken" }).click();

    await expect(mission).toContainText("Gelukt!");
    await page.getByRole("button", { name: "Volgende opdracht" }).click();
    await expect(mission).toContainText("Maak stoom.");

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });

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

    const board = page.getByRole("group", { name: "Werkbank" });
    const water = board.getByRole("button", { name: "Water", exact: true });
    const fire = board.getByRole("button", { name: "Vuur", exact: true });
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

test.describe("mengelmoes op een tablet in landschap", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("houdt het spel binnen één scherm en laat alleen het schap scrollen", async ({ page }) => {
    await page.addInitScript(
      (ids) => {
        localStorage.setItem("games.mengelmoes.v1", JSON.stringify({ discovered: ids, board: [] }));
      },
      ELEMENTS.map((element) => element.id),
    );

    await page.goto("/mengelmoes");
    await expect(page.getByRole("heading", { name: "Mengelmoes" })).toBeVisible();

    const pageFits = await page.evaluate(() => ({
      vertical: document.documentElement.scrollHeight <= window.innerHeight + 1,
      horizontal: document.documentElement.scrollWidth <= window.innerWidth,
    }));
    expect(pageFits).toEqual({ vertical: true, horizontal: true });

    const shelf = page.getByRole("region", { name: "Mijn elementen" });
    await expect(shelf).toBeVisible();
    const shelfScrolls = await shelf.evaluate((element) => {
      const scroller = element.querySelector("[data-alchemy-shelf-scroll]");
      return scroller ? scroller.scrollHeight > scroller.clientHeight : false;
    });
    expect(shelfScrolls).toBe(true);
  });
});

test.describe("mengelmoes slepen met een vinger", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("sleept een element van het schap naar de werkbank", async ({ page }) => {
    await page.goto("/mengelmoes");

    await touchDrag(
      page,
      page.getByRole("button", { name: "Water op de werkbank leggen" }),
      page.getByRole("group", { name: "Werkbank" }),
    );

    await expect(page.getByRole("button", { name: "Water, geselecteerd" })).toBeVisible();

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);
  });
});
