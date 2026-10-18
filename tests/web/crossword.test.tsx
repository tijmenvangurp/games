import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { useCrosswordStore } from "@features/crossword";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useCrosswordStore.setState({
    letters: {},
    selected: null,
    direction: "across",
    entryIndex: null,
    wrong: new Set(),
    hinted: new Set(),
    solved: false,
    checked: false,
  });
});

afterEach(() => {
  cleanup();
});

function renderApp(path = "/kruiswoord") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

async function startGame() {
  renderApp();
  fireEvent.click(await screen.findByRole("button", { name: "Spelen" }));
  return screen.findByRole("group", { name: "Kruiswoordpuzzel" });
}

function solutionLetters(): Record<string, string> {
  const puzzle = useCrosswordStore.getState().puzzle;
  return Object.fromEntries(
    puzzle.cells
      .flat()
      .filter((cell) => cell.solution)
      .map((cell) => [`${cell.row}:${cell.col}`, cell.solution ?? ""]),
  );
}

describe("crossword", () => {
  it("starts the Pokémon puzzle and accepts typed letters", async () => {
    const board = await startGame();
    expect(within(board).getAllByRole("button")).toHaveLength(35);
    expect(screen.getByRole("button", { name: /IJsvogel-legende/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /IJsvogel-legende/ }));
    for (const letter of "ARTICUNO") {
      fireEvent.click(screen.getByRole("button", { name: `Letter ${letter}` }));
    }

    const letters = useCrosswordStore.getState().letters;
    expect(letters["1:0"]).toBe("A");
    expect(letters["1:7"]).toBe("O");
    expect(screen.getByText("Nu: 2 horizontaal.")).toBeTruthy();
  }, 30_000);

  it("checks a complete board and celebrates", async () => {
    await startGame();
    useCrosswordStore.setState({ letters: solutionLetters() });

    fireEvent.click(screen.getByRole("button", { name: "Controleer" }));
    expect(await screen.findByRole("heading", { name: "Opgelost!" })).toBeTruthy();
    expect(screen.getByText("Je hebt alle 6 woorden gevonden.")).toBeTruthy();
    expect(useCrosswordStore.getState().solved).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /Nog een keer/ }));
    expect(screen.queryByRole("heading", { name: "Opgelost!" })).toBeNull();
    expect(useCrosswordStore.getState().solved).toBe(false);
    expect(useCrosswordStore.getState().letters).toEqual({});
  }, 30_000);

  it("marks wrong letters and reports an incomplete board", async () => {
    await startGame();

    fireEvent.click(screen.getByRole("button", { name: "Controleer" }));
    expect(screen.getByText("Nog niet alle vakjes zijn gevuld.")).toBeTruthy();

    const letters = solutionLetters();
    letters["0:5"] = "X";
    useCrosswordStore.setState({ letters });
    fireEvent.click(screen.getByRole("button", { name: "Controleer" }));

    expect(useCrosswordStore.getState().wrong.size).toBeGreaterThan(0);
    expect(useCrosswordStore.getState().solved).toBe(false);
    expect(screen.getByText("Er zitten nog fouten in. Probeer het nog eens.")).toBeTruthy();
  }, 30_000);

  it("reveals a hint and opens the setup again", async () => {
    await startGame();
    fireEvent.click(screen.getByRole("button", { name: "Hint" }));

    expect(useCrosswordStore.getState().letters["0:5"]).toBe("B");
    expect(useCrosswordStore.getState().hinted.has("0:5")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Nieuw spel" }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Terug naar je kruiswoord/ }));
    expect(await screen.findByRole("group", { name: "Kruiswoordpuzzel" })).toBeTruthy();
  }, 30_000);
});
