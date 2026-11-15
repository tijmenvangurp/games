import { expect, test } from "@playwright/test";

function audioRequests(page: import("@playwright/test").Page): string[] {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/audio/nl/")) {
      requests.push(request.url());
    }
  });
  return requests;
}

test.describe("voorlezen op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("vraagt lokale schaakaudio op en de toggle werkt", async ({ page }) => {
    const requests = audioRequests(page);
    await page.goto("/schaken/les");
    await page.getByRole("button", { name: "Kijk" }).click();

    await expect.poll(() => requests.some((url) => url.includes("/audio/nl/chess/"))).toBe(true);

    await page.getByRole("button", { name: "Voorlezen uitzetten" }).click();
    await expect(page.getByRole("button", { name: "Voorlezen aanzetten" })).toBeVisible();
  });

  test("bouwt de rekenvraag uit lokale clips", async ({ page }) => {
    const requests = audioRequests(page);
    await page.goto("/rekenen");
    await page.getByRole("button", { name: "Spelen" }).click();

    await expect
      .poll(() => requests.some((url) => url.includes("/audio/nl/math/math-what-is.mp3")))
      .toBe(true);
  });

  test("vraagt niets op als voorlezen uit staat", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("games.speech.v1", "off");
    });
    const requests = audioRequests(page);

    await page.goto("/rekenen");
    await page.getByRole("button", { name: "Spelen" }).click();
    await page.waitForTimeout(700);

    expect(requests).toHaveLength(0);
  });
});
