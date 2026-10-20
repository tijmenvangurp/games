import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { selectionMatches, type Cell, type WordSearchPuzzle } from "@entities/word-search";
import { DEFAULT_WORD_SEARCH_SETTINGS, useWordSearchStore } from "@features/word-search";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useWordSearchStore.setState({
    puzzle: null,
    found: [],
    lastFound: null,
    selected: [],
    dragStart: null,
    wrong: false,
    hint: null,
    settings: DEFAULT_WORD_SEARCH_SETTINGS,
  });
});

afterEach(() => {
  cleanup();
});

function renderApp(path = "/woordzoeker") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

function currentPuzzle(): WordSearchPuzzle {
  const puzzle = useWordSearchStore.getState().puzzle;
  if (!puzzle) {
    throw new Error("No word search puzzle");
  }
  return puzzle;
}

function cellNode(board: HTMLElement, cell: Cell): HTMLElement {
  const node = board.querySelector<HTMLElement>(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
  if (!node) {
    throw new Error(`Cell ${cell.row}:${cell.col} not found`);
  }
  return node;
}

function findWrongPair(puzzle: WordSearchPuzzle): [Cell, Cell] {
  for (let row = 0; row < puzzle.size; row += 1) {
    for (let col = 0; col < puzzle.size - 1; col += 1) {
      const cells = [
        { row, col },
        { row, col: col + 1 },
      ];
      if (!puzzle.placements.some((placement) => selectionMatches(placement, cells))) {
        return [cells[0], cells[1]];
      }
    }
  }
  throw new Error("No wrong pair found");
}

async function startDefaultGame() {
  renderApp();
  fireEvent.click(await screen.findByRole("button", { name: "Spelen" }));
  const board = await screen.findByRole("group", { name: /Woordzoeker van 10 bij 10/i });
  return { board, puzzle: currentPuzzle() };
}

describe("word search", () => {
  it("starts a 12 bij 12 puzzle and finds a word", async () => {
    renderApp();

    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Gemiddeld/ }));
    fireEvent.click(screen.getByRole("button", { name: /Onder water/ }));
    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

    const board = await screen.findByRole("group", { name: /Woordzoeker van 12 bij 12/i });
    expect(within(board).getAllByRole("button")).toHaveLength(144);

    const puzzle = currentPuzzle();
    expect(puzzle.theme).toBe("onderwater");
    expect(puzzle.difficulty).toBe("gemiddeld");
    expect(puzzle.placements).toHaveLength(10);

    const placement = puzzle.placements[0];
    if (!placement) {
      throw new Error("No placement");
    }
    const first = placement.cells[0];
    const last = placement.cells.at(-1);
    if (!first || !last) {
      throw new Error("Placement without cells");
    }

    fireEvent.click(cellNode(board, first));
    expect(useWordSearchStore.getState().selected).toEqual([first]);
    fireEvent.click(cellNode(board, last));

    expect(useWordSearchStore.getState().found).toContain(placement.word);
    expect(screen.getByText(`${placement.word} gevonden`)).toBeTruthy();
    const wordButton = screen.getByRole("button", { name: placement.word });
    expect(wordButton.getAttribute("aria-pressed")).toBe("true");

    await waitFor(() => {
      expect(board.querySelector(`[data-word="${placement.word}"]`)).toBeTruthy();
    });
  }, 30_000);

  it("gives feedback on a wrong line and shows a hint", async () => {
    const { board, puzzle } = await startDefaultGame();
    const [wrongStart, wrongEnd] = findWrongPair(puzzle);

    fireEvent.click(cellNode(board, wrongStart));
    fireEvent.click(cellNode(board, wrongEnd));
    expect(useWordSearchStore.getState().wrong).toBe(true);
    expect(screen.getByText(/Die niet/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(useWordSearchStore.getState().hint).not.toBeNull();
    expect(board.querySelector('[aria-label*="hint"]')).toBeTruthy();
  }, 30_000);

  it("celebrates a complete board and starts a new round", async () => {
    const { puzzle } = await startDefaultGame();
    useWordSearchStore.setState({ found: puzzle.placements.map((item) => item.word) });

    expect(await screen.findByRole("heading", { name: "Gevonden!" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Nog een keer/ }));
    expect(screen.queryByRole("heading", { name: "Gevonden!" })).toBeNull();
    expect(useWordSearchStore.getState().found).toEqual([]);
    expect(useWordSearchStore.getState().puzzle).not.toBe(puzzle);
  }, 30_000);

  it("marks a word found when the selection is dragged", async () => {
    const { board, puzzle } = await startDefaultGame();
    const placement = puzzle.placements[0];
    if (!placement) {
      throw new Error("No placement");
    }
    const first = placement.cells[0];
    if (!first) {
      throw new Error("Placement without cells");
    }

    useWordSearchStore.getState().startDrag(first);
    for (const cell of placement.cells.slice(1)) {
      useWordSearchStore.getState().dragTo(cell);
    }

    expect(useWordSearchStore.getState().selected).toEqual(placement.cells);
    useWordSearchStore.getState().commitDrag();

    expect(useWordSearchStore.getState().found).toContain(placement.word);
    expect(useWordSearchStore.getState().selected).toEqual([]);
    await waitFor(() => {
      expect(board.querySelector('[aria-label*="gevonden"]')).toBeTruthy();
    });
    expect(board.querySelector(`[data-word="${placement.word}"]`)).toBeTruthy();
  }, 30_000);

  it("starts a Pokémon word search", async () => {
    renderApp();
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Pokémon/ }));
    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

    const board = await screen.findByRole("group", { name: /Woordzoeker van 10 bij 10/i });
    const puzzle = currentPuzzle();
    expect(puzzle.theme).toBe("pokemon");
    expect(within(board).getAllByRole("button")).toHaveLength(100);

    const first = puzzle.placements[0];
    if (!first) {
      throw new Error("No placement");
    }
    expect(screen.getByRole("button", { name: first.word })).toBeTruthy();
  }, 30_000);

  it("opens the setup again and can go back to the active game", async () => {
    await startDefaultGame();

    fireEvent.click(screen.getByRole("button", { name: "Nieuw spel" }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Terug naar je woordzoeker/ }));
    expect(await screen.findByRole("group", { name: /Woordzoeker van 10 bij 10/i })).toBeTruthy();
  }, 30_000);
});
