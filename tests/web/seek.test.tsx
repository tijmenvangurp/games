import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import type { SeekScene } from "@entities/hidden-object";
import { DEFAULT_SEEK_SETTINGS, useSeekStore } from "@features/seek-and-find";

const STORAGE_KEY = "games.seek.v1";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useSeekStore.setState({
    scene: null,
    found: false,
    tries: 0,
    wrongId: null,
    hintVisible: false,
    settings: DEFAULT_SEEK_SETTINGS,
  });
});

afterEach(() => {
  cleanup();
});

function renderApp(path = "/zoeken") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

function currentScene(): SeekScene {
  const scene = useSeekStore.getState().scene;
  if (!scene) {
    throw new Error("No seek scene");
  }
  return scene;
}

function creatureNode(id: number): Element {
  const node = document.querySelector(`[data-creature-id="${id}"]`);
  if (!node) {
    throw new Error(`Creature ${id} not found`);
  }
  return node;
}

describe("seek and find", () => {
  it("starts a scene, gives feedback and celebrates a find", async () => {
    renderApp();

    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Moeilijk/ }));
    fireEvent.click(screen.getByRole("button", { name: /Onder water/ }));
    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

    expect(await screen.findByRole("img", { name: /Zoek de Wobbel met de ster/i })).toBeTruthy();

    const scene = currentScene();
    expect(scene.difficulty).toBe("moeilijk");
    expect(scene.theme).toBe("onderwater");
    expect(scene.creatures).toHaveLength(81);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
      difficulty: "moeilijk",
      theme: "onderwater",
    });

    const decoy = scene.creatures.find((creature) => creature.id !== scene.targetId);
    if (!decoy) {
      throw new Error("No decoy found");
    }
    fireEvent.click(creatureNode(decoy.id));
    expect(useSeekStore.getState().wrongId).toBe(decoy.id);
    expect(useSeekStore.getState().tries).toBe(1);
    expect(screen.getByText(/Nog niet/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(screen.getByTestId("hint-region")).toBeTruthy();

    fireEvent.click(creatureNode(scene.targetId));
    expect(useSeekStore.getState().found).toBe(true);
    expect(await screen.findByRole("heading", { name: "Gevonden!" })).toBeTruthy();
    expect(screen.getByText(/1 keer mis/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Nog een keer/ }));
    expect(screen.queryByRole("heading", { name: "Gevonden!" })).toBeNull();
    expect(useSeekStore.getState().tries).toBe(0);
    expect(useSeekStore.getState().scene).not.toBe(scene);

    fireEvent.click(screen.getByRole("button", { name: "Nieuw spel" }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Terug naar je zoekveld/ }));
    expect(await screen.findByRole("img", { name: /Zoek de Wobbel met de ster/i })).toBeTruthy();
  });

  it("can switch to another game from the win dialog", async () => {
    renderApp();
    fireEvent.click(await screen.findByRole("button", { name: "Spelen" }));
    await screen.findByRole("img", { name: /Zoek de Wobbel met de ster/i });
    fireEvent.click(creatureNode(currentScene().targetId));

    fireEvent.click(await screen.findByRole("button", { name: /Ander spel kiezen/ }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
  });

  it("returns to the menu from the win dialog", async () => {
    renderApp();
    fireEvent.click(await screen.findByRole("button", { name: "Spelen" }));
    await screen.findByRole("img", { name: /Zoek de Wobbel met de ster/i });
    fireEvent.click(creatureNode(currentScene().targetId));

    fireEvent.click(await screen.findByRole("button", { name: /Naar het menu/ }));
    expect(await screen.findByRole("heading", { name: "Spellen" })).toBeTruthy();
  });
});
