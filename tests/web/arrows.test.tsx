import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { levelAt, MAX_HEARTS, removableArrows, solveMaze, type MazeArrow } from "@entities/arrow";
import { useArrowsStore } from "@features/arrow-game";

const STORAGE_KEY = "games.arrows.v2";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useArrowsStore.setState({
    levelIndex: 0,
    unlocked: 1,
    level: levelAt(0),
    removedIds: [],
    history: [],
    hearts: MAX_HEARTS,
    status: "playing",
    hintId: null,
  });
});

afterEach(() => {
  cleanup();
});

function renderApp(path = "/pijlen") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

function arrowNode(id: number): HTMLElement {
  const node = document.querySelector<HTMLElement>(`[data-maze-arrow-id="${id}"]`);
  if (!node) {
    throw new Error(`Arrow ${id} not found`);
  }
  return node;
}

function currentLevel() {
  return useArrowsStore.getState().level;
}

function firstRemovable(): MazeArrow {
  const arrow = removableArrows(currentLevel(), new Set())[0];
  if (!arrow) {
    throw new Error("No removable arrow");
  }
  return arrow;
}

async function startGame() {
  renderApp();
  expect(await screen.findByRole("button", { name: "Spelen" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Spelen" }));
  expect(await screen.findByRole("group", { name: /pijlenpuzzel/i })).toBeTruthy();
}

describe("arrows maze", () => {
  it("plays a level, hints, launches, undoes and restarts", async () => {
    await startGame();

    const level = currentLevel();
    expect(screen.getByRole("progressbar", { name: /0 van \d+ pijlen weg/ })).toBeTruthy();
    expect(
      screen.getByRole("img", { name: new RegExp(`3 van ${MAX_HEARTS} harten`) }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(document.querySelectorAll('[data-hint="true"]')).toHaveLength(1);

    const removable = firstRemovable();
    fireEvent.click(arrowNode(removable.id));

    expect(useArrowsStore.getState().removedIds).toContain(removable.id);
    expect(useArrowsStore.getState().history).toHaveLength(1);
    expect(screen.getByRole("progressbar", { name: /1 van \d+ pijlen weg/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Ongedaan maken" }));
    expect(useArrowsStore.getState().removedIds).toEqual([]);
    expect(useArrowsStore.getState().hearts).toBe(MAX_HEARTS);

    const keyboardArrow = firstRemovable();
    fireEvent.keyDown(arrowNode(keyboardArrow.id), { key: "Enter" });
    expect(useArrowsStore.getState().removedIds).toContain(keyboardArrow.id);

    fireEvent.click(screen.getByRole("button", { name: "Opnieuw" }));
    expect(useArrowsStore.getState().removedIds).toEqual([]);
    expect(screen.getByRole("progressbar", { name: /0 van \d+ pijlen weg/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Terug" }));
    expect(await screen.findByRole("heading", { name: level.name })).toBeTruthy();
    expect(level.arrows.length).toBeGreaterThan(0);
  });

  it("wins a level, unlocks the next one and starts it", async () => {
    await startGame();
    const level = currentLevel();
    const order = solveMaze(level);
    if (!order) {
      throw new Error("Level is not solvable");
    }

    for (const id of order) {
      fireEvent.click(arrowNode(id));
    }

    expect(useArrowsStore.getState().status).toBe("won");
    expect(await screen.findByRole("heading", { name: "Excellent!" })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toMatchObject({
      unlocked: 2,
    });

    fireEvent.click(screen.getByRole("button", { name: "Volgende level" }));
    expect(await screen.findByRole("group", { name: /pijlenpuzzel/i })).toBeTruthy();
    expect(useArrowsStore.getState().levelIndex).toBe(1);
    expect(useArrowsStore.getState().level.name).toBe("Ster");
  });

  it("loses a heart on a blocked arrow and restarts after three mistakes", async () => {
    await startGame();
    const level = currentLevel();
    const free = new Set(removableArrows(level, new Set()).map((arrow) => arrow.id));
    const blocked = level.arrows.find((arrow) => !free.has(arrow.id));
    if (!blocked) {
      throw new Error("No blocked arrow in the first level");
    }

    fireEvent.click(arrowNode(blocked.id));
    expect(useArrowsStore.getState().hearts).toBe(MAX_HEARTS - 1);
    expect(screen.getByText("Die pijl is geblokkeerd.")).toBeTruthy();

    fireEvent.click(arrowNode(blocked.id));
    fireEvent.click(arrowNode(blocked.id));

    expect(useArrowsStore.getState().status).toBe("lost");
    expect(screen.getByRole("heading", { name: "Harten op" })).toBeTruthy();

    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Opnieuw" }));
    expect(useArrowsStore.getState().status).toBe("playing");
    expect(useArrowsStore.getState().hearts).toBe(MAX_HEARTS);
    expect(screen.queryByRole("heading", { name: "Harten op" })).toBeNull();
  });

  it("shows locked levels until the previous one is solved", async () => {
    renderApp();
    fireEvent.click(await screen.findByRole("button", { name: "Levels" }));

    expect(await screen.findByRole("heading", { name: "Kies level" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Level 1,/ })).not.toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Level 2, vergrendeld" })).toHaveProperty(
      "disabled",
      true,
    );

    fireEvent.click(screen.getByRole("button", { name: /Level 1,/ }));
    expect(await screen.findByRole("group", { name: /pijlenpuzzel/i })).toBeTruthy();
  });
});
