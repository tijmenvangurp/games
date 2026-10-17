import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { generatePuzzle } from "@entities/sudoku";
import { DEFAULT_SETTINGS, useSudokuStore } from "@features/sudoku-game";

const STORAGE_KEY = "games.sudoku.v1";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useSudokuStore.setState({ play: null, settings: DEFAULT_SETTINGS });
});

afterEach(() => {
  cleanup();
});

function renderApp(path = "/") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

function preloadSolvedGame() {
  const puzzle = generatePuzzle(4, "makkelijk", 99);
  useSudokuStore.setState({
    play: {
      puzzle,
      entries: [...puzzle.solution],
      hinted: puzzle.givens.map(() => false),
      selected: null,
      solved: true,
    },
    settings: { size: 4, difficulty: "makkelijk", theme: "animals" },
  });
}

function findEmptyCell(board: HTMLElement): HTMLElement {
  const cell = within(board)
    .getAllByRole("button")
    .find((button) => button.getAttribute("aria-label")?.startsWith("leeg"));
  if (!cell) {
    throw new Error("No empty cell found");
  }
  return cell;
}

describe("games app", () => {
  it("opens a playable sudoku from the menu", async () => {
    renderApp("/");

    expect(await screen.findByRole("heading", { name: "Spellen" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /monster memory/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: /sudoku/i }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

    const board = await screen.findByRole("group", { name: /rooster van 4 bij 4/i });
    expect(within(board).getAllByRole("button")).toHaveLength(16);
    expect(screen.getByText(/0 van 16 vakjes ingevuld/)).toBeTruthy();

    const cell = findEmptyCell(board);
    fireEvent.click(cell);
    expect(cell.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Kies 🐱" }));
    expect(cell.getAttribute("aria-label")).toMatch(/^🐱, rij/);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Kies 🐱" }));
    expect(cell.getAttribute("aria-label")).toMatch(/^leeg/);

    const keyboardCell = findEmptyCell(board);
    fireEvent.click(keyboardCell);
    fireEvent.keyDown(window, { key: "1" });
    expect(keyboardCell.getAttribute("aria-label")).toMatch(/^🐶, rij/);
    fireEvent.keyDown(window, { key: "Backspace" });
    expect(keyboardCell.getAttribute("aria-label")).toMatch(/^leeg/);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowDown" });

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(screen.getAllByRole("button", { name: /, hint$/ })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Wissen" }));
    fireEvent.click(screen.getByRole("button", { name: "Opnieuw" }));
    expect(screen.getByText(/0 van 16 vakjes ingevuld/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Nieuw spel" }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Terug naar je puzzel/ }));
    expect(await screen.findByRole("group", { name: /rooster van 4 bij 4/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Terug naar het menu" }));
    expect(await screen.findByRole("heading", { name: "Spellen" })).toBeTruthy();
  });

  it("lets the player pick a size, difficulty and symbol theme", async () => {
    renderApp("/sudoku");

    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /9 × 9/ }));
    expect(screen.queryByText("Symbolen")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /6 × 6/ }));
    expect(screen.getByText("Symbolen")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Cijfers/ }));
    fireEvent.click(screen.getByRole("button", { name: /Moeilijk/ }));
    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

    const board = await screen.findByRole("group", { name: /rooster van 6 bij 6/i });
    expect(within(board).getAllByRole("button")).toHaveLength(36);
    expect(screen.getAllByRole("button", { name: /^Kies/ })).toHaveLength(6);
  });

  it("celebrates a solved puzzle and starts another one", async () => {
    preloadSolvedGame();
    renderApp("/sudoku");

    expect(await screen.findByRole("heading", { name: "Goed gedaan!" })).toBeTruthy();
    expect(screen.getByText("Je hebt de sudoku helemaal opgelost.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Nog een keer/ }));
    expect(screen.queryByRole("heading", { name: "Goed gedaan!" })).toBeNull();
    expect(screen.getByText(/0 van 16 vakjes ingevuld/)).toBeTruthy();
  });

  it("goes back to the setup screen from the win dialog", async () => {
    preloadSolvedGame();
    renderApp("/sudoku");

    expect(await screen.findByRole("heading", { name: "Goed gedaan!" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Ander spel kiezen/ }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
  });

  it("returns to the menu from the win dialog", async () => {
    preloadSolvedGame();
    renderApp("/sudoku");

    expect(await screen.findByRole("heading", { name: "Goed gedaan!" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Naar het menu/ }));
    expect(await screen.findByRole("heading", { name: "Spellen" })).toBeTruthy();
  });
});
