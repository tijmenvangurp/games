import { expect, test, type Locator } from "@playwright/test";

interface Point {
  row: number;
  col: number;
}

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [1, -1],
  [-1, 1],
] as const;

async function readGrid(board: Locator): Promise<string[][]> {
  const cells = await board.locator("[data-row][data-col]").evaluateAll((nodes) =>
    nodes.map((node) => ({
      row: Number(node.getAttribute("data-row")),
      col: Number(node.getAttribute("data-col")),
      letter: node.textContent ?? "",
    })),
  );
  const size = Math.max(...cells.map((cell) => cell.row)) + 1;
  const grid = Array.from({ length: size }, () => Array<string>(size).fill(""));
  for (const cell of cells) {
    grid[cell.row][cell.col] = cell.letter;
  }
  return grid;
}

function findPath(grid: string[][], word: string): { start: Point; end: Point } | null {
  const target = word.toUpperCase();

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] !== target[0]) {
        continue;
      }
      for (const [rowStep, colStep] of DIRECTIONS) {
        const matches = Array.from({ length: target.length - 1 }, (_, index) => {
          const nextRow = row + rowStep * (index + 1);
          const nextCol = col + colStep * (index + 1);
          return grid[nextRow]?.[nextCol] === target[index + 1];
        }).every(Boolean);

        if (matches) {
          return {
            start: { row, col },
            end: {
              row: row + rowStep * (target.length - 1),
              col: col + colStep * (target.length - 1),
            },
          };
        }
      }
    }
  }

  return null;
}

test.describe("woordzoeker op een telefoon", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("start een puzzel, toont het bord en kan vergroten", async ({ page }) => {
    await page.goto("/woordzoeker");
    await expect(page.getByRole("heading", { name: "Nieuw spel" })).toBeVisible();

    await page.getByRole("button", { name: "Spelen" }).click();

    const board = page.getByRole("group", { name: /Woordzoeker van 10 bij 10/i });
    await expect(board).toBeVisible();
    await expect(board.getByRole("button")).toHaveCount(100);

    const overflows = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflows).toBe(false);

    await page.getByRole("button", { name: /Vergroot/ }).click();
    await expect(page.getByRole("button", { name: /Heel bord/ })).toBeVisible();

    const overflowsZoomed = (await page.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflowsZoomed).toBe(false);
  });

  test("sleept een woord door", async ({ page }) => {
    await page.goto("/woordzoeker");
    await page.getByRole("button", { name: "Spelen" }).click();

    const board = page.getByRole("group", { name: /Woordzoeker van 10 bij 10/i });
    const words = page.getByRole("group", { name: "Te zoeken woorden" });
    const firstWord = (await words.getByRole("button").first().textContent())?.trim() ?? "";
    const path = findPath(await readGrid(board), firstWord);
    if (!path) {
      throw new Error(`Woord ${firstWord} niet gevonden`);
    }

    const start = board.locator(`[data-row="${path.start.row}"][data-col="${path.start.col}"]`);
    const end = board.locator(`[data-row="${path.end.row}"][data-col="${path.end.col}"]`);
    const startBox = await start.boundingBox();
    const endBox = await end.boundingBox();
    if (!startBox || !endBox) {
      throw new Error("Geen celpositie");
    }

    await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(endBox.x + endBox.width / 2, endBox.y + endBox.height / 2, {
      steps: 12,
    });
    await page.mouse.up();

    await expect(words.getByRole("button", { name: firstWord, exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
