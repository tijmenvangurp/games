import { expect, test } from "@playwright/test";

async function solveFirstLevel(page: import("@playwright/test").Page): Promise<void> {
  await page.getByRole("button", { name: "Klein tandwiel" }).click();
  await page.locator('[data-hole-id="2,2"]').click();
  await expect(page.locator("[data-draaiwerk-board]")).toHaveAttribute("data-status", "solved");
  await expect(page.getByRole("heading", { name: "Gelukt!" })).toBeVisible();
}

async function dragOnto(page: import("@playwright/test").Page, fromId: string, toId: string) {
  const from = page.locator(fromId);
  const to = page.locator(toId);
  const start = await from.boundingBox();
  const end = await to.boundingBox();
  if (!start || !end) {
    throw new Error("Geen positie voor slepen");
  }

  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 12, start.y + start.height / 2 + 12, {
    steps: 4,
  });
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 16 });
  await page.mouse.up();
}

async function touchDragOnto(page: import("@playwright/test").Page, fromId: string, toId: string) {
  const start = await page.locator(fromId).boundingBox();
  const end = await page.locator(toId).boundingBox();
  if (!start || !end) {
    throw new Error("Geen positie voor aanraaksleep");
  }

  const client = await page.context().newCDPSession(page);
  const from = { x: start.x + start.width / 2, y: start.y + start.height / 2 };
  const to = { x: end.x + end.width / 2, y: end.y + end.height / 2 };

  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] });
  await page.waitForTimeout(180);
  for (let step = 1; step <= 14; step += 1) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: from.x + ((to.x - from.x) * step) / 14,
          y: from.y + ((to.y - from.y) * step) / 14,
        },
      ],
    });
    await page.waitForTimeout(16);
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(400);
}

test.describe("draaiwerk op een landschapstablet", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("speelt level 1 en gaat naar level 2", async ({ page }) => {
    await page.goto("/draaiwerk");

    await expect(page.getByRole("heading", { name: "Draaiwerk" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Eerste tand/ })).toBeVisible();
    await expect(page.locator("[data-draaiwerk-board]")).toHaveAttribute("data-status", "playing");

    const metrics = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      innerWidth,
      innerHeight,
    }));
    expect(metrics.width).toBe(metrics.innerWidth);
    expect(metrics.height).toBe(metrics.innerHeight);

    await solveFirstLevel(page);
    await page.getByRole("button", { name: "Volgende level" }).click();

    await expect(page.getByRole("heading", { name: /Twee tussenwielen/ })).toBeVisible();
    await expect(page.locator("[data-draaiwerk-board]")).toHaveAttribute("data-status", "playing");
  });

  test("toont een liggende as met twee uiteinden", async ({ page }) => {
    await page.goto("/draaiwerk");
    await page.evaluate(() => {
      localStorage.setItem(
        "games.draaiwerk.v1",
        JSON.stringify({ state: { unlocked: 10, current: 9 }, version: 1 }),
      );
    });
    await page.reload();

    await expect(page.getByRole("heading", { name: /De liggende as/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Liggende as/ })).toBeVisible();
  });

  test("sleept een tandwiel van de la naar het bord", async ({ page }) => {
    await page.goto("/draaiwerk");

    await dragOnto(page, "[data-tray-id]", '[data-hole-id="2,2"]');

    await expect(page.locator("[data-draaiwerk-board]")).toHaveAttribute("data-status", "solved");
    await expect(page.getByRole("heading", { name: "Gelukt!" })).toBeVisible();
  });

  test("verplaatst een verkeerd geplaatst tandwiel", async ({ page }) => {
    await page.goto("/draaiwerk");

    await page.locator("[data-tray-id]").first().click();
    await page.locator('[data-hole-id="1,0"]').click();
    await expect(page.locator('[data-placed-key="gear:1,0"]')).toBeVisible();

    await dragOnto(page, '[data-placed-key="gear:1,0"]', '[data-hole-id="2,2"]');

    await expect(page.locator("[data-draaiwerk-board]")).toHaveAttribute("data-status", "solved");
  });

  test("haalt een geplaatst tandwiel terug naar de la", async ({ page }) => {
    await page.goto("/draaiwerk");

    await page.locator("[data-tray-id]").first().click();
    await page.locator('[data-hole-id="1,0"]').click();
    await expect(page.locator('[data-placed-key="gear:1,0"]')).toBeVisible();

    await dragOnto(page, '[data-placed-key="gear:1,0"]', "[data-tray-drop]");

    await expect(page.locator("[data-placed-key]")).toHaveCount(0);
    await expect(page.locator("[data-tray-id]").first()).toHaveAttribute("data-used", "false");
  });

  test("haalt een geplaatste riem terug naar de la", async ({ page }) => {
    await page.goto("/draaiwerk");
    await page.evaluate(() => {
      localStorage.setItem(
        "games.draaiwerk.v1",
        JSON.stringify({ state: { unlocked: 16, current: 12 }, version: 1 }),
      );
    });
    await page.reload();

    await page.locator("[data-tray-id]").first().click();
    await page.locator('[data-gear-key="motor"]').click();
    await page.locator('[data-gear-key="output:generator-1"]').click();
    await expect(page.locator('[data-placed-key^="belt:"]')).toBeVisible();

    await dragOnto(page, '[data-placed-key^="belt:"]', "[data-tray-drop]");

    await expect(page.locator('[data-placed-key^="belt:"]')).toHaveCount(0);
    await expect(page.locator("[data-tray-id]").first()).toHaveAttribute("data-used", "false");
  });
});

test.describe("draaiwerk op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("past zonder horizontale overflow en is speelbaar", async ({ page }) => {
    await page.goto("/draaiwerk");

    await expect(page.locator("[data-draaiwerk-board]")).toBeVisible();
    await expect(page.getByRole("button", { name: "Klein tandwiel" })).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);

    await solveFirstLevel(page);
  });

  test("sleept een tandwiel met een vinger naar het bord", async ({ page }) => {
    await page.goto("/draaiwerk");

    await touchDragOnto(page, "[data-tray-id]", '[data-hole-id="2,2"]');

    await expect(page.locator("[data-draaiwerk-board]")).toHaveAttribute("data-status", "solved");
    await expect(page.getByRole("heading", { name: "Gelukt!" })).toBeVisible();
  });

  test("verplaatst een geplaatst tandwiel met een vinger", async ({ page }) => {
    await page.goto("/draaiwerk");

    await page.locator("[data-tray-id]").first().click();
    await page.locator('[data-hole-id="1,0"]').click();
    await expect(page.locator('[data-placed-key="gear:1,0"]')).toBeVisible();

    await touchDragOnto(page, '[data-placed-key="gear:1,0"]', '[data-hole-id="2,2"]');

    await expect(page.locator("[data-draaiwerk-board]")).toHaveAttribute("data-status", "solved");
  });
});
