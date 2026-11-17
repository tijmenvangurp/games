import { expect, test, type Locator, type Page } from "@playwright/test";

const NO_HORIZONTAL_OVERFLOW =
  "document.documentElement.scrollWidth > document.documentElement.clientWidth";

const BOARD_GRID = /^Vakjes van de plattegrond$/;
const AANWIJZING = "Aanwijzing";
const ONGEDAAN = "Ongedaan maken";
const CONTROLEER = "Controleer";

function boardGrid(page: Page): Locator {
  return page.getByRole("group", { name: BOARD_GRID });
}

/**
 * Kiest een persoon, tenzij hij al gekozen is. Na ongedaan maken blijft de
 * keuze staan; blind nog eens tikken zou hem juist afkiezen.
 */
async function selectPerson(page: Page, name: RegExp): Promise<void> {
  const button = page.getByRole("button", { name });
  if ((await button.getAttribute("aria-pressed")) !== "true") {
    await button.click();
  }
}

/** Kiest een persoon en tikt daarna op een vakje met die toegankelijke naam. */
async function placeOnBoard(page: Page, person: RegExp, cell: RegExp): Promise<void> {
  await selectPerson(page, person);
  await page.getByRole("button", { name: cell }).click();
}

/**
 * Controleert of elk raakvlak minstens 44 px breed en hoog is. De inline
 * woorden in een aanwijzing hebben een onzichtbaar vergroot raakvlak en vallen
 * daarom buiten deze meting; hun tekst blijft de zichtbare knop.
 */
async function expectTouchTargets(locator: Locator): Promise<void> {
  const sizes = await locator.evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return {
        label:
          element.getAttribute("aria-label") ??
          element.textContent?.trim().slice(0, 40) ??
          element.tagName,
        width: box.width,
        height: box.height,
      };
    }),
  );

  expect(sizes.length).toBeGreaterThan(0);
  for (const size of sizes) {
    expect(size.width, `${size.label} is ${size.width} px breed`).toBeGreaterThanOrEqual(43.5);
    expect(size.height, `${size.label} is ${size.height} px hoog`).toBeGreaterThanOrEqual(43.5);
  }
}

/**
 * De volledige flow op één breedte: Anna met het toetsenbord kiezen en plaatsen,
 * ongedaan maken, een hint in twee stappen, nog eens ongedaan maken en de zaak
 * uitspelen tot de onthulling.
 */
async function playIntroCase(page: Page, keyboardFirst: boolean): Promise<void> {
  await page.goto("/mysterie");
  await expect(page.getByRole("heading", { name: "Wie is wie?" })).toBeVisible();

  if (keyboardFirst) {
    await page.getByRole("button", { name: "Anna" }).focus();
    await page.keyboard.press("Enter");
    await expect(boardGrid(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /^leeg, rij 1, kolom 2/ })).toBeFocused();
    await page.keyboard.press("Enter");
  } else {
    await placeOnBoard(page, /^Anna$/, /^leeg, rij 1, kolom 2/);
  }
  await expect(page.getByRole("button", { name: /^Anna, rij 1, kolom 2/ })).toBeFocused();
  await expect(page.getByRole("status")).toContainText("Anna staat op rij 1, kolom 2.");

  await page.getByRole("button", { name: ONGEDAAN }).click();
  await expect(page.getByRole("button", { name: /^Anna, rij 1, kolom 2/ })).toHaveCount(0);

  // De hint geeft eerst de aanwijzing van Bram, daarna de exacte cel met de
  // reden en pas bij de derde tik de gedwongen zet.
  const hint = page.getByRole("button", { name: AANWIJZING });
  await hint.click();
  await expect(page.getByRole("status")).toContainText(
    "Kijk eens naar de aanwijzing van Bram. Waar is nog een stoel?",
  );
  await expect(page.getByRole("button", { name: /^leeg, licht op, rij 2, kolom 1/ })).toBeFocused();

  await hint.click();
  await expect(page.getByRole("status")).toContainText(
    "Bram stond op een stoel. Alleen de keuken blijft over",
  );

  await hint.click();
  await expect(page.getByRole("status")).toContainText("Zet Bram");
  await expect(
    page.getByRole("button", { name: /^Bram, (licht op, )?rij 2, kolom 1/ }),
  ).toBeFocused();

  await page.getByRole("button", { name: ONGEDAAN }).click();
  await expect(page.getByRole("button", { name: /^Bram, rij 2, kolom 1/ })).toHaveCount(0);

  // Reset maakt het bord leeg en begint dezelfde zaak opnieuw.
  await page.getByRole("button", { name: "Opnieuw beginnen" }).click();
  await expect(page.getByRole("button", { name: /^Anna, rij 1, kolom 2/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Bram, rij 2, kolom 1/ })).toHaveCount(0);

  await placeOnBoard(page, /^Anna$/, /^leeg, rij 1, kolom 2/);
  await placeOnBoard(page, /^Bram$/, /^leeg, rij 2, kolom 1/);
  await placeOnBoard(page, /^Cato$/, /^leeg, rij 3, kolom 4/);

  await page.getByRole("button", { name: CONTROLEER }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Opgelost!" })).toBeVisible();
  await expect(dialog.getByText("Cato was als enige bij de taart in de badkamer.")).toBeVisible();
  // Wacht tot de veer-animatie van de viering klaar is; anders meet de
  // raakvlakcontrole de knop nog verkleind.
  await page.waitForTimeout(500);
  await expectTouchTargets(dialog.getByRole("button"));

  await dialog.getByRole("button", { name: "Bekijk de plattegrond" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // De focus blijft na de viering op de onthulling, niet op de body.
  const reveal = page.getByRole("region", { name: "De dief" });
  await expect(reveal).toBeFocused();
  await expect(reveal).toContainText("Cato was als enige bij de taart in de badkamer.");
  await expect(page.getByRole("button", { name: /^de taart, rij 4, kolom 3/ })).toBeVisible();
}

test.describe("Wie was het? op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("opent de zaak vanuit het menu zonder horizontaal scrollen", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /wie was het/i }).click();

    await expect(page.getByRole("heading", { name: "Wie was het?" })).toBeVisible();
    await expect(
      page.getByRole("img", { name: /plattegrond van de verdwenen taart/i }),
    ).toBeVisible();
    await expect(page.getByText("Anna stond in de keuken.")).toBeVisible();
    await expect(page.getByText("Bram stond op een stoel.")).toBeVisible();
    await expect(page.getByText("Cato stond in de badkamer.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Waar mag je staan?" })).toBeVisible();

    const overflows = (await page.evaluate(NO_HORIZONTAL_OVERFLOW)) as boolean;
    expect(overflows).toBe(false);
  });

  test("speelt de volledige zaak op 390 px", async ({ page }) => {
    await playIntroCase(page, true);

    // De vakjes, de bediening en de persoonskaarten zijn groot genoeg om te raken.
    await expectTouchTargets(boardGrid(page).getByRole("button"));
    await expectTouchTargets(
      page.getByRole("region", { name: "De plattegrond" }).getByRole("button"),
    );
    await expectTouchTargets(page.getByRole("button", { name: /^(Anna|Bram|Cato)$/ }));

    const overflows = (await page.evaluate(NO_HORIZONTAL_OVERFLOW)) as boolean;
    expect(overflows).toBe(false);
  });
});

test.describe("Wie was het? op een tablet", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("toont bord, kaarten en legenda", async ({ page }) => {
    await page.goto("/mysterie");

    await expect(page.getByRole("heading", { name: "Wie was het?" })).toBeVisible();
    const board = page.getByRole("img", { name: /plattegrond van de verdwenen taart/i });
    await expect(board).toBeVisible();
    await expect(page.getByRole("heading", { name: "Wie is wie?" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Waar mag je staan?" })).toBeVisible();

    const box = await board.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width ?? 0).toBeLessThanOrEqual(520);

    const overflows = (await page.evaluate(NO_HORIZONTAL_OVERFLOW)) as boolean;
    expect(overflows).toBe(false);
  });

  test("zet op landscape het bord links en de kaarten rechts", async ({ page }) => {
    await page.goto("/mysterie");

    const board = page.getByRole("img", { name: /plattegrond van de verdwenen taart/i });
    const cards = page.getByRole("heading", { name: "Wie is wie?" });
    await expect(board).toBeVisible();
    await expect(cards).toBeVisible();
    await expect(page.getByRole("button", { name: /^Anna$/ })).toBeVisible();

    const boardBox = await board.boundingBox();
    const cardsBox = await cards.boundingBox();
    expect(boardBox).not.toBeNull();
    expect(cardsBox).not.toBeNull();
    expect((boardBox?.x ?? 0) + (boardBox?.width ?? 0)).toBeLessThan(cardsBox?.x ?? 0);

    // Het bord loopt niet buiten de viewporthoogte.
    expect((boardBox?.y ?? 0) + (boardBox?.height ?? 0)).toBeLessThanOrEqual(768 + 1);
    expect(await page.evaluate(NO_HORIZONTAL_OVERFLOW)).toBe(false);
  });

  test("speelt de volledige zaak op 1024 px", async ({ page }) => {
    await playIntroCase(page, false);

    await expectTouchTargets(boardGrid(page).getByRole("button"));
    await expectTouchTargets(
      page.getByRole("region", { name: "De plattegrond" }).getByRole("button"),
    );

    // Op een tablet staat het bord ruim maar niet breder dan prettig is.
    const board = page.getByRole("img", { name: /plattegrond van de verdwenen taart/i });
    const box = await board.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(400);

    const overflows = (await page.evaluate(NO_HORIZONTAL_OVERFLOW)) as boolean;
    expect(overflows).toBe(false);
  });
});

test.describe("Wie was het? op een groot tablet landscape", () => {
  test.use({ viewport: { width: 1366, height: 1024 } });

  test("houdt de tweedeling en de rechterkolom scrollbaar", async ({ page }) => {
    await page.goto("/mysterie");

    const board = page.getByRole("img", { name: /plattegrond van de verdwenen taart/i });
    const cards = page.getByRole("heading", { name: "Wie is wie?" });
    await expect(board).toBeVisible();
    await expect(cards).toBeVisible();

    const boardBox = await board.boundingBox();
    const cardsBox = await cards.boundingBox();
    expect((boardBox?.x ?? 0) + (boardBox?.width ?? 0)).toBeLessThan(cardsBox?.x ?? 0);
    expect(await page.evaluate(NO_HORIZONTAL_OVERFLOW)).toBe(false);
  });
});

test.describe("Wie was het? met verminderde beweging", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce" });

  test("viert de overwinning zonder confetti", async ({ page }) => {
    await page.goto("/mysterie");
    await placeOnBoard(page, /^Anna$/, /^leeg, rij 1, kolom 2/);
    await placeOnBoard(page, /^Bram$/, /^leeg, rij 2, kolom 1/);
    await placeOnBoard(page, /^Cato$/, /^leeg, rij 3, kolom 4/);
    await page.getByRole("button", { name: CONTROLEER }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    // canvas-confetti zet zijn eigen canvas direct op de body; met reduced motion
    // wordt dat canvas nooit gemaakt.
    await page.waitForTimeout(400);
    expect(await page.locator("body > canvas").count()).toBe(0);
  });
});
