import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { DEFAULT_MURDOKU_SETTINGS, useMurdokuStore } from "@features/murdoku-game";
import { silentCanvasContext } from "./murdoku-canvas";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useMurdokuStore.setState({
    puzzle: null,
    play: null,
    history: [],
    settings: DEFAULT_MURDOKU_SETTINGS,
    solvedCaseIds: new Set(),
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() =>
    silentCanvasContext(),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderApp(path = "/") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

async function renderGame() {
  renderApp("/mysterie");
  await screen.findByRole("heading", { name: "Wie is wie?" });
}

function cell(name: RegExp): HTMLElement {
  return screen.getByRole("button", { name });
}

/** De drie verdachten van de instapzaak op hun oplossingsvakje. */
function placeIntroSolution(): void {
  fireEvent.click(screen.getByRole("button", { name: "Anna" }));
  fireEvent.click(cell(/^leeg, rij 1, kolom 2/));
  fireEvent.click(screen.getByRole("button", { name: "Bram" }));
  fireEvent.click(cell(/^leeg, rij 2, kolom 1/));
  fireEvent.click(screen.getByRole("button", { name: "Cato" }));
  fireEvent.click(cell(/^leeg, rij 3, kolom 4/));
}

describe("Wie was het? toegankelijke overlay", () => {
  it("groepeert de vakjes per rij en noemt de gekozen persoon in elk vakje", async () => {
    await renderGame();

    const grid = screen.getByRole("group", { name: "Vakjes van de plattegrond" });
    expect(within(grid).getAllByRole("group")).toHaveLength(4);
    expect(screen.getByRole("group", { name: "Rij 1" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Rij 4" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Anna" }));

    expect(
      screen.getByRole("button", { name: /^leeg, rij 1, kolom 2,.*Anna kan hier staan/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /^leeg, rij 3, kolom 1,.*Anna kan hier staan/ }),
    ).toBeTruthy();
  });

  it("vat per persoon samen waar hij staat", async () => {
    await renderGame();

    const summary = screen.getByRole("list", { name: "Waar staat wie?" });
    expect(within(summary).getByText("Anna staat nog niet op het bord.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Anna" }));
    fireEvent.click(cell(/^leeg, rij 1, kolom 2/));

    expect(within(summary).getByText("Anna staat op rij 1, kolom 2.")).toBeTruthy();
    expect(within(summary).getByText("Bram staat nog niet op het bord.")).toBeTruthy();
  });
});

describe("Wie was het? focus en toetsenbord", () => {
  it("zet de focus na een toetsenbordkeuze op het bord", async () => {
    await renderGame();

    // `detail: 0` is een klik die de browser bij Enter of Spatie stuurt.
    fireEvent.click(screen.getByRole("button", { name: "Anna" }), { detail: 0 });

    expect(document.activeElement).toBe(
      screen.getByRole("group", { name: "Vakjes van de plattegrond" }),
    );
  });

  it("laat de focus niet naar het bord springen bij een tik", async () => {
    await renderGame();

    fireEvent.click(screen.getByRole("button", { name: "Anna" }), { detail: 1 });

    expect(document.activeElement).not.toBe(
      screen.getByRole("group", { name: "Vakjes van de plattegrond" }),
    );
  });

  it("houdt de focus op het vakje waar de persoon komt te staan", async () => {
    await renderGame();

    fireEvent.click(screen.getByRole("button", { name: "Anna" }));
    const target = cell(/^leeg, rij 1, kolom 2/);
    target.focus();
    fireEvent.click(target);

    expect(document.activeElement).toBe(cell(/^Anna, rij 1, kolom 2/));
  });

  it("zet de focus na een hint op het vakje dat de hint aanwijst", async () => {
    await renderGame();
    const hint = screen.getByRole("button", { name: "Aanwijzing" });

    fireEvent.click(hint);

    expect(document.activeElement).toBe(cell(/^leeg, licht op, rij 1, kolom 1/));

    fireEvent.click(hint);

    expect(document.activeElement).toBe(cell(/^Bram, (licht op, )?rij 2, kolom 1/));
  });

  it("zet de focus na de viering op de onthulling", async () => {
    await renderApp("/mysterie");
    await screen.findByRole("heading", { name: "Wie is wie?" });
    placeIntroSolution();
    fireEvent.click(screen.getByRole("button", { name: "Controleer" }));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Bekijk de plattegrond" }));

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole("region", { name: "De dader" }));
    });
  });
});
