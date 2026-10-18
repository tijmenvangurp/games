import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import type { MemoryScene } from "@entities/memory";
import { DEFAULT_MEMORY_SETTINGS, useMemoryStore } from "@features/memory-game";

const STORAGE_KEY = "games.memory.v1";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useMemoryStore.setState({
    scene: null,
    matched: [],
    flipped: [],
    locked: false,
    moves: 0,
    found: false,
    settings: DEFAULT_MEMORY_SETTINGS,
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, "vibrate");
});

function renderApp(path = "/memory") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

function cardNode(index: number): HTMLElement {
  const node = document.querySelector<HTMLElement>(`[data-card-index="${index}"]`);
  if (!node) {
    throw new Error(`Card ${index} not found`);
  }
  return node;
}

function indexesByPokemon(scene: MemoryScene): Map<number, number[]> {
  const byId = new Map<number, number[]>();
  scene.cards.forEach((pokemonId, index) => {
    const list = byId.get(pokemonId) ?? [];
    list.push(index);
    byId.set(pokemonId, list);
  });
  return byId;
}

function clickPair(indices: number[]): void {
  fireEvent.click(cardNode(indices[0]));
  fireEvent.click(cardNode(indices[1]));
}

function matchAllPairs(): void {
  const scene = useMemoryStore.getState().scene;
  if (!scene) {
    throw new Error("No memory scene");
  }
  for (const indices of indexesByPokemon(scene).values()) {
    clickPair(indices);
  }
}

async function startGame(): Promise<void> {
  renderApp();
  expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Spelen" }));
  await screen.findAllByRole("button", { name: "Omgedraaide kaart" });
}

describe("pokémon memory", () => {
  it("flips cards, handles a mismatch and celebrates a full board", async () => {
    await startGame();

    const scene = useMemoryStore.getState().scene;
    if (!scene) {
      throw new Error("No memory scene");
    }
    expect(scene.cards).toHaveLength(16);

    const byId = indexesByPokemon(scene);
    const entries = [...byId.entries()];
    const [matchedId, pair] = entries[0];
    clickPair(pair);

    expect(useMemoryStore.getState().moves).toBe(1);
    expect(useMemoryStore.getState().matched[pair[0]]).toBe(true);
    expect(useMemoryStore.getState().matched[pair[1]]).toBe(true);
    expect(useMemoryStore.getState().flipped).toEqual([]);

    const other = entries.find(([id]) => id !== matchedId);
    const third = entries.find(([id]) => id !== matchedId && id !== other?.[0]);
    if (!other || !third) {
      throw new Error("Not enough Pokémon for a mismatch");
    }
    clickPair([other[1][0], third[1][0]]);

    expect(useMemoryStore.getState().locked).toBe(true);
    expect(useMemoryStore.getState().flipped).toHaveLength(2);
    await waitFor(() => expect(useMemoryStore.getState().locked).toBe(false), {
      timeout: 3000,
    });
    expect(useMemoryStore.getState().flipped).toEqual([]);

    matchAllPairs();

    expect(await screen.findByRole("heading", { name: "Alle Pokémon gevonden!" })).toBeTruthy();
    expect(screen.getByText(/zetten over/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Nog een keer/ }));
    expect(screen.queryByRole("heading", { name: "Alle Pokémon gevonden!" })).toBeNull();
    expect(useMemoryStore.getState().moves).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Nieuw spel" }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Terug naar je spel/ }));
    expect(
      (await screen.findAllByRole("button", { name: "Omgedraaide kaart" })).length,
    ).toBeGreaterThan(0);
  });

  it("gives haptic feedback on a flip, a match and a mismatch", async () => {
    const vibrate = vi.fn(() => true);
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    });

    await startGame();
    const scene = useMemoryStore.getState().scene;
    if (!scene) {
      throw new Error("No memory scene");
    }
    const entries = [...indexesByPokemon(scene).entries()];

    fireEvent.click(cardNode(entries[0]?.[1][0] ?? 0));
    expect(vibrate).toHaveBeenLastCalledWith(10);

    fireEvent.click(cardNode(entries[0]?.[1][1] ?? 1));
    expect(vibrate).toHaveBeenLastCalledWith([10, 30, 10]);

    const second = entries[1]?.[1][0];
    const third = entries[2]?.[1][0];
    if (second === undefined || third === undefined) {
      throw new Error("Not enough cards for a mismatch");
    }
    fireEvent.click(cardNode(second));
    fireEvent.click(cardNode(third));
    expect(vibrate).toHaveBeenLastCalledWith([30, 40, 30]);
  });

  it("stores the chosen difficulty and uses it for the deck", async () => {
    renderApp();
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Moeilijk/ }));
    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

    const cards = await screen.findAllByRole("button", { name: "Omgedraaide kaart" });
    expect(cards).toHaveLength(20);
    expect(useMemoryStore.getState().scene?.pairs).toBe(10);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
      difficulty: "moeilijk",
    });
  });

  it("can switch to another game from the win dialog", async () => {
    await startGame();
    matchAllPairs();
    expect(await screen.findByRole("heading", { name: "Alle Pokémon gevonden!" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Ander spel kiezen/ }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
  });

  it("returns to the menu from the win dialog", async () => {
    await startGame();
    matchAllPairs();
    expect(await screen.findByRole("heading", { name: "Alle Pokémon gevonden!" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Naar het menu/ }));
    expect(await screen.findByRole("heading", { name: "Spellen" })).toBeTruthy();
  });
});
