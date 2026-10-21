import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { BASE_ELEMENT_IDS, ELEMENTS } from "@entities/alchemy";
import { resetAlchemyInstanceCounter, useAlchemyStore } from "@features/alchemy-lab";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  resetAlchemyInstanceCounter();
  useAlchemyStore.setState({
    discovered: [...BASE_ELEMENT_IDS],
    board: [],
    selected: null,
    feedback: null,
    hint: null,
  });
});

afterEach(() => {
  cleanup();
});

function renderApp(path = "/mengelmoes") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

async function renderAlchemy() {
  renderApp();
  await screen.findByRole("heading", { name: "Mengelmoes" });
}

async function makeSteam() {
  fireEvent.click(shelfButton("Water"));
  fireEvent.click(shelfButton("Vuur"));
  fireEvent.click(await screen.findByRole("button", { name: "Verder ontdekken" }));
}

function shelfButton(name: string): HTMLElement {
  return screen.getByRole("button", { name: `${name} op de werkbank leggen` });
}

describe("mengelmoes", () => {
  it("starts with the four base elements on the shelf", async () => {
    await renderAlchemy();

    expect(await screen.findByRole("heading", { name: "Mengelmoes" })).toBeTruthy();
    expect(screen.getByTestId("alchemy-progress").textContent).toContain("4");
    expect(screen.getByTestId("alchemy-progress").textContent).toContain("/ 159 ontdekt");

    for (const name of ["Water", "Vuur", "Aarde", "Lucht"]) {
      expect(shelfButton(name)).toBeTruthy();
    }
  });

  it("combines water and fire by tapping and celebrates steam", async () => {
    await renderAlchemy();

    fireEvent.click(shelfButton("Water"));
    expect(screen.getByRole("button", { name: "Water, geselecteerd" })).toBeTruthy();

    fireEvent.click(shelfButton("Vuur"));

    expect(await screen.findByRole("heading", { name: "Stoom" })).toBeTruthy();
    expect(screen.getByText("Nieuw ontdekt")).toBeTruthy();
    expect(screen.getByText("Water + Vuur")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Verder ontdekken" }));

    expect(screen.queryByRole("heading", { name: "Stoom" })).toBeNull();
    expect(shelfButton("Stoom")).toBeTruthy();
    expect(useAlchemyStore.getState().discovered).toContain("steam");
    expect(screen.getByTestId("alchemy-progress").textContent).toContain("5");
  });

  it("gives gentle feedback on an impossible combination", async () => {
    await renderAlchemy();

    fireEvent.click(shelfButton("Water"));
    fireEvent.click(shelfButton("Vuur"));
    fireEvent.click(await screen.findByRole("button", { name: "Verder ontdekken" }));

    fireEvent.click(shelfButton("Aarde"));

    expect(await screen.findByText(/dat mengt niet/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Stoom" })).toBeTruthy();
    expect(useAlchemyStore.getState().discovered).not.toContain("mud");
  });

  it("shows a hint that uses discovered elements", async () => {
    await renderAlchemy();

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));

    expect(await screen.findByText(/Probeer Water \+ Aarde/i)).toBeTruthy();
    expect(useAlchemyStore.getState().hint?.result).toBe("mud");
  });

  it("opens the lab book and shows undiscovered elements as question marks", async () => {
    await renderAlchemy();

    fireEvent.click(screen.getByRole("button", { name: "Labboek" }));

    expect(await screen.findByRole("heading", { name: "Labboek" })).toBeTruthy();
    expect(screen.getByText("4 van 159 elementen ontdekt")).toBeTruthy();
    expect(screen.getAllByText("Onbekend")).toHaveLength(155);

    fireEvent.click(screen.getByRole("button", { name: "Sluit labboek" }));
    expect(screen.queryByRole("heading", { name: "Labboek" })).toBeNull();
  });

  it("shows filters on the shelf once the collection grows", async () => {
    await renderAlchemy();
    act(() =>
      useAlchemyStore.setState({ discovered: ELEMENTS.slice(0, 12).map((element) => element.id) }),
    );

    expect(screen.getByRole("button", { name: "Alles" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Water" }));

    expect(shelfButton("Water")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Vuur op de werkbank leggen" })).toBeNull();

    const sort = screen.getByLabelText("Sorteer");
    fireEvent.change(sort, { target: { value: "name" } });
    expect((sort as HTMLSelectElement).value).toBe("name");
  });

  it("filters the lab book by category", async () => {
    await renderAlchemy();
    await makeSteam();

    fireEvent.click(screen.getByRole("button", { name: "Labboek" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("button", { name: "Bekijk Stoom" })).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Bekijk Vuur" })).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Water" }));
    expect(within(dialog).getByRole("button", { name: "Bekijk Stoom" })).toBeTruthy();
    expect(within(dialog).queryByRole("button", { name: "Bekijk Vuur" })).toBeNull();

    fireEvent.click(within(dialog).getByRole("button", { name: "Alles" }));
    expect(within(dialog).getByRole("button", { name: "Bekijk Vuur" })).toBeTruthy();
  });

  it("shows recipes and uses in the element detail", async () => {
    await renderAlchemy();
    await makeSteam();

    fireEvent.click(screen.getByRole("button", { name: "Labboek" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Bekijk Stoom" }));

    expect(within(dialog).getByRole("heading", { name: "Stoom" })).toBeTruthy();
    expect(within(dialog).getByText("Gemaakt van")).toBeTruthy();
    expect(within(dialog).getAllByText("Water").length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText("Vuur").length).toBeGreaterThan(0);
    expect(within(dialog).getByText("Kan maken met")).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Terug naar labboek" }));
    expect(within(dialog).getByRole("button", { name: "Bekijk Stoom" })).toBeTruthy();
  });

  it("clears the workbench without losing discoveries", async () => {
    await renderAlchemy();

    fireEvent.click(shelfButton("Water"));
    fireEvent.click(shelfButton("Vuur"));
    fireEvent.click(await screen.findByRole("button", { name: "Verder ontdekken" }));
    expect(screen.getByRole("button", { name: "Stoom, geselecteerd" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Opruimen" }));

    expect(screen.getByText(/Tik of sleep een element naar de werkbank/)).toBeTruthy();
    expect(useAlchemyStore.getState().board).toEqual([]);
    expect(useAlchemyStore.getState().discovered).toContain("steam");
  });

  it("hints with self-combinations and a single known ingredient", async () => {
    await renderAlchemy();
    act(() => useAlchemyStore.setState({ discovered: ["water"] }));

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(await screen.findByText("Probeer Water + Water.")).toBeTruthy();

    act(() => useAlchemyStore.setState({ discovered: ["fire"], hint: null }));
    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(await screen.findByText("Probeer Vuur met iets anders.")).toBeTruthy();
  });

  it("shows a known-result message when a combination is repeated", async () => {
    await renderAlchemy();
    act(() =>
      useAlchemyStore.setState({
        discovered: [...BASE_ELEMENT_IDS, "steam"],
        board: [
          { instanceId: "water-1", elementId: "water", x: 0.2, y: 0.2 },
          { instanceId: "fire-1", elementId: "fire", x: 0.6, y: 0.6 },
        ],
        selected: null,
        feedback: null,
        hint: null,
      }),
    );

    const board = screen.getByRole("group", { name: "Werkbank" });
    fireEvent.click(within(board).getByRole("button", { name: "Water" }));
    fireEvent.click(within(board).getByRole("button", { name: "Vuur" }));

    expect(await screen.findByText("Die had je al: Stoom.")).toBeTruthy();
  });

  it("warns when the workbench is full", async () => {
    await renderAlchemy();
    act(() =>
      useAlchemyStore.setState({
        board: Array.from({ length: 12 }, (_, index) => ({
          instanceId: `full-${index}`,
          elementId: "water",
          x: 0.3,
          y: 0.3,
        })),
        selected: null,
        feedback: null,
        hint: null,
      }),
    );

    fireEvent.click(shelfButton("Water"));

    expect(await screen.findByText(/De werkbank is vol/)).toBeTruthy();
  });

  it("celebrates a complete lab book in the hint message", async () => {
    await renderAlchemy();
    act(() => useAlchemyStore.setState({ discovered: ELEMENTS.map((element) => element.id) }));

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));

    expect(await screen.findByText(/Je hebt alle elementen ontdekt/)).toBeTruthy();
  });

  it("closes the discovery card and the lab book with Escape", async () => {
    await renderAlchemy();

    fireEvent.click(shelfButton("Water"));
    fireEvent.click(shelfButton("Vuur"));
    const discovery = await screen.findByRole("dialog");
    fireEvent.keyDown(discovery, { key: "Escape" });
    expect(screen.queryByRole("heading", { name: "Stoom" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Labboek" }));
    const labBook = await screen.findByRole("dialog");
    fireEvent.keyDown(labBook, { key: "Escape" });
    expect(screen.queryByRole("heading", { name: "Labboek" })).toBeNull();
  });

  it("returns to the menu with the back button", async () => {
    renderApp();
    await screen.findByRole("heading", { name: "Mengelmoes" });

    fireEvent.click(screen.getByRole("button", { name: "Terug naar het menu" }));

    expect(await screen.findByRole("heading", { name: "Spellen" })).toBeTruthy();
  });
});
