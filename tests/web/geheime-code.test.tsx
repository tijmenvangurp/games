import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { emptyProgress } from "@entities/geheime-code";
import { loadProgress, useGeheimeCodeStore } from "@features/geheime-code";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useGeheimeCodeStore.setState({
    theme: "sinterklaas",
    level: 1,
    round: 1,
    puzzle: null,
    entries: [],
    activeRow: 0,
    activeCell: 0,
    tableTarget: null,
    tableWrong: false,
    revealed: [],
    hintLetter: null,
    wrongCell: null,
    wordMistakes: 0,
    wordHints: 0,
    firstTry: 0,
    wordDone: false,
    result: null,
    progress: emptyProgress(),
  });
});

afterEach(() => {
  cleanup();
});

function renderGame() {
  const router = createAppRouter(createMemoryHistory({ initialEntries: ["/geheime-code"] }));
  render(<App router={router} />);
}

async function startRound(theme: RegExp, level: RegExp) {
  renderGame();
  expect(await screen.findByRole("heading", { name: "Kies je code" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: theme }));
  fireEvent.click(screen.getByRole("button", { name: level }));
  fireEvent.click(screen.getByRole("button", { name: "Spelen" }));
  expect(useGeheimeCodeStore.getState().puzzle).not.toBeNull();
}

function wrongLetter(letter: string): string {
  return letter === "a" ? "b" : "a";
}

describe("geheime code scherm", () => {
  it("start met een thema en niveau", async () => {
    await startRound(/Tuin/, /Kijk & schrijf/);
    const state = useGeheimeCodeStore.getState();
    expect(state.puzzle?.theme).toBe("tuin");
    expect(state.puzzle?.level).toBe(1);
    expect(screen.getByLabelText("Code")).toBeTruthy();
    expect(screen.getByRole("button", { name: "A" })).toBeTruthy();
  });

  it("houdt een goed letter vast en toont na twee fouten de symboolcel", async () => {
    await startRound(/Tuin/, /Kijk & schrijf/);
    let state = useGeheimeCodeStore.getState();
    let row = state.puzzle?.rows[state.activeRow];
    let cell = row?.cells[state.activeCell];
    if (!cell) {
      throw new Error("Geen actieve cel");
    }

    fireEvent.click(screen.getByRole("button", { name: cell.letter.toUpperCase() }));
    state = useGeheimeCodeStore.getState();
    expect(state.entries[0]?.[0]).toBe(cell.letter);

    row = state.puzzle?.rows[state.activeRow];
    cell = row?.cells[state.activeCell];
    if (!cell) {
      throw new Error("Geen volgende cel");
    }
    const wrong = wrongLetter(cell.letter);
    fireEvent.click(screen.getByRole("button", { name: wrong.toUpperCase() }));
    expect(useGeheimeCodeStore.getState().wordMistakes).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: wrong.toUpperCase() }));
    expect(useGeheimeCodeStore.getState().hintLetter).toBe(cell.letter);
  });

  it("wist de actieve letter en houdt de code schoon", async () => {
    await startRound(/Tuin/, /Kijk & schrijf/);
    let state = useGeheimeCodeStore.getState();
    const row = state.puzzle?.rows[state.activeRow];
    const cell = row?.cells[state.activeCell];
    if (!cell) {
      throw new Error("Geen cel");
    }

    fireEvent.click(screen.getByRole("button", { name: cell.letter.toUpperCase() }));
    expect(useGeheimeCodeStore.getState().entries[0]?.[0]).toBe(cell.letter);

    fireEvent.click(screen.getByRole("button", { name: "Wissen" }));
    expect(useGeheimeCodeStore.getState().entries[0]?.[0]).toBe("");

    state = useGeheimeCodeStore.getState();
    const next = state.puzzle?.rows[state.activeRow]?.cells[state.activeCell];
    if (!next) {
      throw new Error("Geen volgende cel");
    }
    act(() => {
      fireEvent.keyDown(document.body, { key: next.letter });
    });
    expect(useGeheimeCodeStore.getState().entries[0]?.[state.activeCell]).toBe(next.letter);
  });

  it("maakt een ronde af en bewaart het beste resultaat", async () => {
    await startRound(/Tuin/, /Kijk & schrijf/);

    while (!useGeheimeCodeStore.getState().result) {
      const state = useGeheimeCodeStore.getState();
      const puzzle = state.puzzle;
      if (!puzzle) {
        throw new Error("Geen puzzel");
      }
      if (state.wordDone) {
        const last = state.activeRow === puzzle.rows.length - 1;
        fireEvent.click(screen.getByRole("button", { name: last ? "Klaar" : "Volgende" }));
        continue;
      }
      const row = puzzle.rows[state.activeRow];
      const cell = row?.cells[state.activeCell];
      if (!cell) {
        throw new Error("Geen cel");
      }
      act(() => {
        state.typeLetter(cell.letter);
      });
    }

    expect(await screen.findByText("Code gekraakt!")).toBeTruthy();
    expect(loadProgress().best["tuin-1"]).toBe(4);
  });

  it("laat op niveau 3 een verborgen letter in de code invullen", async () => {
    await startRound(/Sinterklaas/, /Kraak de code/);

    const hiddenButtons = screen.getAllByRole("button", { name: /letter onbekend/ });
    if (hiddenButtons.length === 0) {
      throw new Error("Geen verborgen codecel");
    }
    fireEvent.click(hiddenButtons[0]!);
    const target = useGeheimeCodeStore.getState().tableTarget;
    expect(target).toBeTruthy();
    if (!target) {
      throw new Error("Geen tabeldoel");
    }

    const wrong = target === "a" ? "b" : "a";
    fireEvent.click(screen.getByRole("button", { name: wrong.toUpperCase() }));
    expect(useGeheimeCodeStore.getState().tableWrong).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: target.toUpperCase() }));
    expect(useGeheimeCodeStore.getState().revealed).toContain(target);
  });
});
