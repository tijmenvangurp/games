import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import {
  DEFAULT_SETTINGS,
  loadFourInARowState,
  useFourInARowStore,
} from "@features/four-in-a-row-game";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useFourInARowStore.setState({
    settings: DEFAULT_SETTINGS,
    score: { one: 0, two: 0 },
    game: null,
  });
});

afterEach(() => {
  cleanup();
});

function renderApp(path = "/vier-op-een-rij") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

/** De router rendert pas na een tick; wacht op het instellingenscherm. */
async function openSetup(path = "/vier-op-een-rij") {
  renderApp(path);
  expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
}

function startGame() {
  fireEvent.click(screen.getByRole("button", { name: "Spelen" }));
}

function clickColumn(column: number) {
  fireEvent.click(screen.getByRole("button", { name: `Kolom ${column}` }));
}

function playColumns(columns: readonly number[]) {
  for (const column of columns) {
    clickColumn(column);
  }
}

/** Blauw wint verticaal in kolom 1; Bruin speelt steeds in kolom 2. */
const WIN_FOR_ONE = [1, 2, 1, 2, 1, 2, 1] as const;

describe("vier op een rij", () => {
  it("is te openen vanuit het menu en te spelen", async () => {
    renderApp("/");

    fireEvent.click(await screen.findByRole("link", { name: /vier op een rij/i }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
    expect(screen.getByText(/Blauw begint deze partij/)).toBeTruthy();

    startGame();

    expect(screen.getByRole("group", { name: "Speelbord" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /^Kolom/ })).toHaveLength(7);
    expect(screen.getByText(/Blauw begint/)).toBeTruthy();

    clickColumn(1);
    expect(screen.getByText("Bruin is aan de beurt.")).toBeTruthy();
    expect(useFourInARowStore.getState().game?.last).toEqual({
      player: "one",
      column: 0,
      row: 0,
    });

    // De eerste zet is al gedaan; de rest van de winnende reeks volgt.
    playColumns(WIN_FOR_ONE.slice(1));

    expect(screen.getByText("Blauw heeft vier op een rij!")).toBeTruthy();
    expect(
      await screen.findByRole("heading", { name: "Blauw wint!" }, { timeout: 3000 }),
    ).toBeTruthy();
    expect(screen.getByText(/De stand is nu Blauw 1 – Bruin 0/)).toBeTruthy();
    expect(loadFourInARowState().score).toEqual({ one: 1, two: 0 });
  });

  it("laat een zet ongedaan maken", async () => {
    await openSetup();
    startGame();

    const undo = screen.getByRole("button", { name: "Ongedaan maken" });
    expect(undo.hasAttribute("disabled")).toBe(true);

    clickColumn(3);
    clickColumn(4);
    expect(undo.hasAttribute("disabled")).toBe(false);

    fireEvent.click(undo);

    const game = useFourInARowStore.getState().game;
    expect(game?.drops).toHaveLength(1);
    expect(game?.current).toBe("two");
    expect(screen.getByText("Bruin is aan de beurt.")).toBeTruthy();
  });

  it("speelt op een kleiner bord als je dat kiest", async () => {
    await openSetup();
    fireEvent.click(screen.getByRole("button", { name: /Klein bord/ }));
    startGame();

    expect(screen.getAllByRole("button", { name: /^Kolom/ })).toHaveLength(6);
    expect(useFourInARowStore.getState().settings.size).toBe("klein");
  });

  it("zet een volle kolom uit", async () => {
    await openSetup();
    fireEvent.click(screen.getByRole("button", { name: /Klein bord/ }));
    startGame();

    playColumns([1, 1, 1, 1, 1]);

    expect(screen.getByRole("button", { name: "Kolom 1" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Kolom 2" }).hasAttribute("disabled")).toBe(false);
  });

  it("laat de verliezer beginnen en kan de stand wissen", async () => {
    await openSetup();
    startGame();
    playColumns(WIN_FOR_ONE);

    await screen.findByRole("heading", { name: "Blauw wint!" }, { timeout: 3000 });
    fireEvent.click(screen.getByRole("button", { name: "Nog een potje" }));

    expect(screen.queryByRole("heading", { name: "Blauw wint!" })).toBeNull();
    expect(screen.getByText(/Bruin begint\./)).toBeTruthy();
    expect(screen.getByLabelText("1 gewonnen partijen")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Nieuw spel" }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
    expect(screen.getByText(/Stand: Blauw 1 – Bruin 0/)).toBeTruthy();
    expect(screen.getByText(/Bruin begint deze partij/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Stand op nul" }));
    expect(screen.getByText(/Stand: Blauw 0 – Bruin 0/)).toBeTruthy();
    expect(loadFourInARowState().score).toEqual({ one: 0, two: 0 });
  });

  it("gaat terug naar je spel vanaf het instellingenscherm", async () => {
    await openSetup();
    startGame();
    clickColumn(2);

    fireEvent.click(screen.getByRole("button", { name: "Nieuw spel" }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Terug naar je spel/ }));
    expect(await screen.findByRole("group", { name: "Speelbord" })).toBeTruthy();
    expect(useFourInARowStore.getState().game?.drops).toHaveLength(1);
  });
});
