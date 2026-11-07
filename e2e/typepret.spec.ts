import { expect, test, type Page } from "@playwright/test";

const NO_HORIZONTAL_OVERFLOW =
  "document.documentElement.scrollWidth > document.documentElement.clientWidth";

async function typeCurrentTarget(page: Page): Promise<void> {
  const text = (await page.locator('[aria-current="step"]').textContent()) ?? "";
  await page.keyboard.press(text.trim().toLowerCase());
}

test.describe("typepret op een tablet met toetsenbord", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("speelt een F/J-ronde en ontgrendelt de volgende les", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /typepret/i }).click();

    await expect(page.getByRole("heading", { name: "Kies je les" })).toBeVisible();
    await expect(page.getByRole("button", { name: /D en K/ })).toBeDisabled();
    await page.getByRole("button", { name: /F en J/ }).click();

    // Een foute toets laat het doelteken staan en blijft vriendelijk.
    const first = (await page.locator('[aria-current="step"]').textContent()) ?? "";
    await page.keyboard.press(first.trim().toLowerCase() === "f" ? "j" : "f");
    await expect(page.getByText(/Probeer nog eens/)).toBeVisible();
    expect(((await page.locator('[aria-current="step"]').textContent()) ?? "").trim()).toBe(
      first.trim(),
    );

    for (let count = 0; count < 20; count += 1) {
      await typeCurrentTarget(page);
    }

    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Andere les" }).click();
    await expect(page.getByRole("button", { name: /D en K/ })).toBeEnabled();

    const overflows = (await page.evaluate(NO_HORIZONTAL_OVERFLOW)) as boolean;
    expect(overflows).toBe(false);
  });
});

test.describe("typepret op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("past op het scherm zonder horizontaal scrollen", async ({ page }) => {
    await page.goto("/typepret");
    await expect(page.getByRole("heading", { name: "Kies je les" })).toBeVisible();
    await page.getByRole("button", { name: /F en J/ }).click();
    await expect(page.locator('[aria-current="step"]')).toBeVisible();

    const overflows = (await page.evaluate(NO_HORIZONTAL_OVERFLOW)) as boolean;
    expect(overflows).toBe(false);
  });
});
