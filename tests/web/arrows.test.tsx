import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import {
  levelAt,
  levelBounds,
  MAX_HEARTS,
  removableArrows,
  solveMaze,
  type MazeArrow,
} from "@entities/arrow";
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

function boardSvg(): SVGSVGElement {
  return screen.getByRole("group", { name: /pijlenpuzzel/i }) as unknown as SVGSVGElement;
}

function mockBoardRect(svg: SVGSVGElement, bounds: ReturnType<typeof levelBounds>): void {
  svg.getBoundingClientRect = () =>
    ({
      bottom: bounds.height,
      height: bounds.height,
      left: 0,
      right: bounds.width,
      top: 0,
      width: bounds.width,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

/** A point in the middle of the arrow's first segment, unique to that arrow. */
function segmentMidpoint(arrow: MazeArrow): { x: number; y: number } {
  const from = arrow.points[0] as { x: number; y: number };
  const to = arrow.points[1] as { x: number; y: number };
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
}

function latticeDotCount(arrow: MazeArrow): number {
  let count = 1;
  for (let index = 1; index < arrow.points.length; index += 1) {
    const from = arrow.points[index - 1] as { x: number; y: number };
    const to = arrow.points[index] as { x: number; y: number };
    count += Math.max(1, Math.round(Math.abs(to.x - from.x) + Math.abs(to.y - from.y)));
  }
  return count;
}

describe("arrows pointer gestures", () => {
  async function tapTarget(): Promise<{
    svg: SVGSVGElement;
    x: number;
    y: number;
    arrow: MazeArrow;
  }> {
    await startGame();
    const level = currentLevel();
    const bounds = levelBounds(level);
    const svg = boardSvg();
    mockBoardRect(svg, bounds);
    const arrow = firstRemovable();
    const point = segmentMidpoint(arrow);
    return { arrow, svg, x: point.x - bounds.minX, y: point.y - bounds.minY };
  }

  it("selects an arrow on a single stationary pointer tap", async () => {
    const { arrow, svg, x, y } = await tapTarget();

    fireEvent.pointerDown(svg, {
      button: 0,
      clientX: x,
      clientY: y,
      isPrimary: true,
      pointerId: 1,
    });
    fireEvent.pointerUp(svg, { button: 0, clientX: x, clientY: y, isPrimary: true, pointerId: 1 });

    expect(useArrowsStore.getState().removedIds).toContain(arrow.id);
  });

  it("ignores a gesture that turns into a drag", async () => {
    const { svg, x, y } = await tapTarget();

    fireEvent.pointerDown(svg, {
      button: 0,
      clientX: x,
      clientY: y,
      isPrimary: true,
      pointerId: 1,
    });
    fireEvent.pointerMove(svg, { clientX: x + 40, clientY: y, isPrimary: true, pointerId: 1 });
    fireEvent.pointerUp(svg, {
      button: 0,
      clientX: x + 40,
      clientY: y,
      isPrimary: true,
      pointerId: 1,
    });

    expect(useArrowsStore.getState().removedIds).toEqual([]);
    expect(useArrowsStore.getState().hearts).toBe(MAX_HEARTS);
  });

  it("ignores a tap while a second finger is down", async () => {
    const { svg, x, y } = await tapTarget();

    fireEvent.pointerDown(svg, {
      button: 0,
      clientX: x,
      clientY: y,
      isPrimary: true,
      pointerId: 1,
    });
    fireEvent.pointerDown(svg, {
      button: 0,
      clientX: x + 30,
      clientY: y + 30,
      isPrimary: false,
      pointerId: 2,
    });
    fireEvent.pointerUp(svg, { button: 0, clientX: x, clientY: y, isPrimary: true, pointerId: 1 });

    expect(useArrowsStore.getState().removedIds).toEqual([]);
    expect(useArrowsStore.getState().hearts).toBe(MAX_HEARTS);
  });

  it("lights up the lattice points a departed arrow vacated", async () => {
    await startGame();
    const arrow = firstRemovable();
    fireEvent.click(arrowNode(arrow.id));

    const dots = document.querySelectorAll(".maze-trail-dot");
    expect(dots).toHaveLength(latticeDotCount(arrow));

    const head = arrow.points[arrow.points.length - 1] as { x: number; y: number };
    const headDot = [...dots].find(
      (dot) =>
        dot.getAttribute("cx") === String(head.x) && dot.getAttribute("cy") === String(head.y),
    );
    expect(headDot).toBeTruthy();
  });
});
