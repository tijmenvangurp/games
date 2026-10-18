import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { createPlayState, generatePuzzle, type SudokuPuzzle } from "@entities/sudoku";
import { DEFAULT_SETTINGS, useSudokuStore } from "@features/sudoku-game";

const STORAGE_KEY = "games.sudoku.v1";

const fixturePuzzle: SudokuPuzzle = {
  size: 4,
  difficulty: "makkelijk",
  seed: 1,
  givens: [1, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1],
  solution: [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1],
};

const directSettings = {
  size: 4 as const,
  difficulty: "makkelijk" as const,
  theme: "animals" as const,
  mistakeMode: "direct" as const,
};

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useSudokuStore.setState({
    play: null,
    settings: DEFAULT_SETTINGS,
    history: [],
    hintPreview: null,
    hintUnavailable: false,
  });
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
    settings: { size: 4, difficulty: "makkelijk", theme: "animals", mistakeMode: "direct" },
  });
}

function preloadFixture(
  mode: "direct" | "check" = "direct",
  entries: Readonly<Record<number, number>> = {},
) {
  const play = createPlayState(fixturePuzzle);
  for (const [index, value] of Object.entries(entries)) {
    play.entries[Number(index)] = value;
  }
  useSudokuStore.setState({
    play,
    settings: { ...directSettings, mistakeMode: mode },
    history: [],
    hintPreview: null,
    hintUnavailable: false,
  });
  return play;
}

function pickEnabledNumber(): string {
  const button = screen
    .getAllByRole("button", { name: /^Kies/ })
    .find((candidate) => !candidate.hasAttribute("disabled"));
  if (!button) {
    throw new Error("No enabled number button");
  }
  const symbol = button.getAttribute("aria-label")?.replace("Kies ", "") ?? "";
  fireEvent.click(button);
  return symbol;
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
    expect(screen.getByRole("link", { name: /pokémon memory/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /wie is deze pokémon/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: /sudoku/i }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

    const board = await screen.findByRole("group", { name: /rooster van 4 bij 4/i });
    expect(within(board).getAllByRole("button")).toHaveLength(16);
    expect(screen.getByText(/0 van 16 vakjes ingevuld/)).toBeTruthy();

    const cell = findEmptyCell(board);
    fireEvent.click(cell);
    expect(cell.getAttribute("aria-pressed")).toBe("true");

    const numberButton = screen
      .getAllByRole("button", { name: /^Kies/ })
      .find((button) => !button.hasAttribute("disabled"));
    if (!numberButton) {
      throw new Error("No enabled number button");
    }
    const symbol = numberButton.getAttribute("aria-label")?.replace("Kies ", "") ?? "";

    fireEvent.click(numberButton);
    expect(cell.getAttribute("aria-label")?.startsWith(`${symbol}, rij`)).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Wissen" }));
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
    expect(screen.getAllByRole("button", { name: /, tip$/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Plaats" }));
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
    expect(document.querySelector('[data-confetti="true"]')).not.toBeNull();
    expect(
      screen
        .getAllByRole("button", { name: /^Kies/ })
        .every((button) => button.hasAttribute("disabled")),
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /Nog een keer/ }));
    expect(screen.queryByRole("heading", { name: "Goed gedaan!" })).toBeNull();
    expect(screen.getByText(/0 van 16 vakjes ingevuld/)).toBeTruthy();
  });

  it("disables a number button once that digit is complete", async () => {
    const puzzle = generatePuzzle(4, "makkelijk", 99);
    const entries = Array.from({ length: puzzle.givens.length }, () => 0);
    puzzle.solution.forEach((value, index) => {
      if (value === 1) {
        entries[index] = 1;
      }
    });
    useSudokuStore.setState({
      play: {
        puzzle,
        entries,
        hinted: puzzle.givens.map(() => false),
        selected: null,
        solved: false,
      },
      settings: { size: 4, difficulty: "makkelijk", theme: "animals", mistakeMode: "direct" },
    });

    renderApp("/sudoku");

    await screen.findByRole("group", { name: /rooster van 4 bij 4/i });
    const dog = screen.getByRole("button", { name: "Kies 🐶" });
    expect(dog.hasAttribute("disabled")).toBe(true);
    expect(dog.textContent).toContain("0");
    expect(screen.getByRole("button", { name: "Kies 🐱" }).hasAttribute("disabled")).toBe(false);
  });

  it("undoes the last sudoku move", async () => {
    preloadFixture();
    renderApp("/sudoku");

    const board = await screen.findByRole("group", { name: /rooster van 4 bij 4/i });
    const cell = findEmptyCell(board);
    fireEvent.click(cell);
    const symbol = pickEnabledNumber();
    expect(cell.getAttribute("aria-label")?.startsWith(`${symbol}, rij`)).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Ongedaan" }));
    expect(cell.getAttribute("aria-label")).toMatch(/^leeg/);
  });

  it("previews a hint before placing it", async () => {
    preloadFixture();
    renderApp("/sudoku");

    await screen.findByRole("group", { name: /rooster van 4 bij 4/i });
    fireEvent.click(screen.getByRole("button", { name: "Hint" }));

    expect(screen.getAllByRole("button", { name: /, tip$/ })).toHaveLength(1);
    const explanation = screen.getByText(/In deze rij|In deze kolom|In dit blok|In dit vakje/);
    expect(explanation.textContent).not.toMatch(/[1-9]/);
    expect(explanation.textContent).not.toMatch(/🐶|🐱|🐰|🦊/);
    expect(screen.queryAllByRole("button", { name: /, hint$/ })).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Waarom?" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Waarom?" }));
    const detail = screen.getByText(/Streep de cijfers|Welk cijfer kan nergens anders/);
    expect(detail.textContent).not.toMatch(/[1-9]/);
    expect(detail.textContent).not.toMatch(/🐶|🐱|🐰|🦊/);
    expect(screen.queryByRole("button", { name: "Waarom?" })).toBeNull();
    expect(screen.queryAllByRole("button", { name: /, hint$/ })).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Plaats" }));
    expect(screen.getAllByRole("button", { name: /, hint$/ })).toHaveLength(1);
  });

  it("shows a mistake only after checking in check mode", async () => {
    preloadFixture("check", { 1: 3 });
    renderApp("/sudoku");

    const board = await screen.findByRole("group", { name: /rooster van 4 bij 4/i });
    const wrong = within(board).getAllByRole("button")[1];
    expect(wrong?.getAttribute("aria-label")).not.toContain("fout");

    fireEvent.click(screen.getByRole("button", { name: "Controleer" }));
    expect(wrong?.getAttribute("aria-label")).toContain("fout");
    expect(screen.getByText("Er staat nog een foutje in.")).toBeTruthy();
  });

  it("marks duplicate digits as conflicts", async () => {
    preloadFixture("direct", { 1: 4 });
    renderApp("/sudoku");

    const board = await screen.findByRole("group", { name: /rooster van 4 bij 4/i });
    const duplicate = within(board).getAllByRole("button")[1];
    expect(duplicate?.getAttribute("aria-label")).toContain("conflict");
    expect(screen.getByText("Er staan dubbele cijfers.")).toBeTruthy();
  });

  it("celebrates a completed row", async () => {
    preloadFixture("direct", { 1: 2, 2: 3 });
    renderApp("/sudoku");

    const board = await screen.findByRole("group", { name: /rooster van 4 bij 4/i });
    fireEvent.click(within(board).getAllByRole("button")[3]);
    fireEvent.click(screen.getByRole("button", { name: "Kies 🦊" }));

    expect(await screen.findByText(/Rij 1 klaar!/)).toBeTruthy();
    expect(document.querySelector('[data-confetti="true"]')).not.toBeNull();
  });

  it("celebrates a completed box", async () => {
    preloadFixture("direct", { 1: 2 });
    renderApp("/sudoku");

    const board = await screen.findByRole("group", { name: /rooster van 4 bij 4/i });
    fireEvent.click(within(board).getAllByRole("button")[4]);
    fireEvent.click(screen.getByRole("button", { name: "Kies 🐰" }));

    expect(await screen.findByText(/Blok 1 klaar!/)).toBeTruthy();
    expect(document.querySelector('[data-confetti="true"]')).not.toBeNull();
  });

  it("celebrates halfway with confetti", async () => {
    preloadFixture("direct", { 1: 2, 2: 3, 4: 3, 6: 1, 8: 2 });
    renderApp("/sudoku");

    const board = await screen.findByRole("group", { name: /rooster van 4 bij 4/i });
    fireEvent.click(within(board).getAllByRole("button")[9]);
    fireEvent.click(screen.getByRole("button", { name: "Kies 🐶" }));

    expect(await screen.findByText(/Halverwege!/)).toBeTruthy();
    expect(document.querySelector('[data-confetti="true"]')).not.toBeNull();
  });

  it("shows a near-solved message with one cell left", async () => {
    const entries = fixturePuzzle.solution.map((value, index) => (index === 1 ? 0 : value));
    useSudokuStore.setState({
      play: {
        puzzle: fixturePuzzle,
        entries,
        hinted: fixturePuzzle.givens.map(() => false),
        selected: null,
        solved: false,
      },
      settings: { ...directSettings },
    });

    renderApp("/sudoku");

    await screen.findByRole("group", { name: /rooster van 4 bij 4/i });
    expect(screen.getByText("Nog één vakje!")).toBeTruthy();
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
