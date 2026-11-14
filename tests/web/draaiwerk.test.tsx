import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LEVEL_COUNT, levelAt, type Level, type Placement } from "@entities/gear";
import {
  DEFAULT_DRAAIWERK_PROGRESS,
  DRAAIWERK_STORAGE_KEY,
  DRAAIWERK_STORAGE_VERSION,
  normalizeDraaiwerkProgress,
  useDraaiwerkStore,
} from "@features/draaiwerk";
import { DraaiwerkScreen } from "@pages/draaiwerk";
import { MotionProvider } from "@shared/ui";

function trayNode(id: string): HTMLElement {
  const node = document.querySelector<HTMLElement>(`[data-tray-id="${id}"]`);
  if (!node) {
    throw new Error(`Tray item ${id} not found`);
  }
  return node;
}

function holeNode(id: string): SVGGElement {
  const node = document.querySelector<SVGGElement>(`[data-hole-id="${id}"]`);
  if (!node) {
    throw new Error(`Hole ${id} not found`);
  }
  return node;
}

function boardNode(): Element {
  const node = document.querySelector("[data-draaiwerk-board]");
  if (!node) {
    throw new Error("Board not found");
  }
  return node;
}

function gearKeyAt(level: Level, holeId: string): string {
  if (level.motor.holeId === holeId) {
    return "motor";
  }
  const output = level.outputs.find((candidate) => candidate.holeId === holeId);
  return output ? `output:${output.id}` : `gear:${holeId}`;
}

function gearNode(key: string): Element {
  const node = document.querySelector(`[data-gear-key="${key}"]`);
  if (!node) {
    throw new Error(`Gear ${key} not found`);
  }
  return node;
}

function firstGearItem(level = levelAt(0)) {
  const item = level.tray.find((candidate) => candidate.kind === "gear");
  if (!item || item.kind !== "gear") {
    throw new Error("Level has no gear in the tray");
  }
  return item;
}

function firstGearSolution(level = levelAt(0)): Extract<Placement, { kind: "gear" }> {
  const placement = level.solution.find(
    (candidate): candidate is Extract<Placement, { kind: "gear" }> => candidate.kind === "gear",
  );
  if (!placement) {
    throw new Error("Level has no gear in the solution");
  }
  return placement;
}

function renderGame() {
  render(
    <MotionProvider>
      <DraaiwerkScreen onHome={() => {}} />
    </MotionProvider>,
  );
}

function resetGame() {
  localStorage.clear();
  useDraaiwerkStore.setState({ levelIndex: 0, unlocked: 1, finished: false });
  useDraaiwerkStore.getState().startLevel(0);
}

beforeEach(() => {
  cleanup();
  resetGame();
});

afterEach(() => {
  cleanup();
});

describe("draaiwerk", () => {
  it("solves level 1, celebrates and unlocks the next level", async () => {
    renderGame();

    const level = levelAt(0);
    const gear = firstGearItem(level);
    const solution = firstGearSolution(level);

    expect(boardNode().getAttribute("data-status")).toBe("playing");
    expect(solution.holeId).toBe("2,2");

    fireEvent.click(trayNode(gear.id));
    expect(useDraaiwerkStore.getState().selectedTrayId).toBe(gear.id);

    fireEvent.click(holeNode(solution.holeId));

    expect(useDraaiwerkStore.getState().status).toBe("solved");
    expect(boardNode().getAttribute("data-status")).toBe("solved");
    expect(await screen.findByRole("heading", { name: "Gelukt!" })).toBeTruthy();

    expect(JSON.parse(localStorage.getItem(DRAAIWERK_STORAGE_KEY) ?? "{}")).toMatchObject({
      state: { unlocked: 2, current: 0 },
      version: DRAAIWERK_STORAGE_VERSION,
    });

    fireEvent.click(screen.getByRole("button", { name: "Volgende level" }));

    expect(useDraaiwerkStore.getState().levelIndex).toBe(1);
    expect(useDraaiwerkStore.getState().level.name).toBe(levelAt(1).name);
    expect(await screen.findByRole("heading", { name: new RegExp(levelAt(1).name) })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(DRAAIWERK_STORAGE_KEY) ?? "{}")).toMatchObject({
      state: { unlocked: 2, current: 1 },
    });
  });

  it("adds a new level to the board and can remove the last part", async () => {
    useDraaiwerkStore.setState({ unlocked: 2 });
    useDraaiwerkStore.getState().startLevel(1);
    renderGame();
    const level = levelAt(1);
    const solution = firstGearSolution(level);
    const gear = firstGearItem(level);

    fireEvent.click(trayNode(gear.id));
    fireEvent.click(holeNode(solution.holeId));
    expect(useDraaiwerkStore.getState().placements).toHaveLength(1);
    expect(useDraaiwerkStore.getState().usedTrayIds).toEqual([gear.id]);

    fireEvent.click(screen.getByRole("button", { name: "Ongedaan maken" }));
    expect(useDraaiwerkStore.getState().placements).toHaveLength(0);
    expect(useDraaiwerkStore.getState().usedTrayIds).toEqual([]);
  });

  it("explains a wrong tap and highlights the next solution after two mistakes", () => {
    renderGame();
    const level = levelAt(0);
    const gear = firstGearItem(level);

    fireEvent.click(trayNode(gear.id));
    fireEvent.click(holeNode(level.motor.holeId));

    expect(screen.getByText("Hier zit al een tandwiel.")).toBeTruthy();
    expect(useDraaiwerkStore.getState().hintPlacement).toBeNull();

    fireEvent.click(holeNode(level.motor.holeId));

    expect(useDraaiwerkStore.getState().mistakes).toBe(2);
    expect(useDraaiwerkStore.getState().hintPlacement).not.toBeNull();
    expect(document.querySelectorAll('[data-hint="true"]').length).toBeGreaterThan(0);
  });

  it("connects the motor and the target with a belt", () => {
    useDraaiwerkStore.setState({ unlocked: 3 });
    useDraaiwerkStore.getState().startLevel(2);
    renderGame();

    const level = levelAt(2);
    const belt = level.tray.find((item) => item.kind === "belt");
    const link = level.solution.find(
      (placement) =>
        placement.kind === "open-belt" ||
        placement.kind === "crossed-belt" ||
        placement.kind === "chain",
    );
    if (!belt || !link) {
      throw new Error("Level 3 is not a belt level");
    }

    fireEvent.click(trayNode(belt.id));
    fireEvent.click(gearNode(gearKeyAt(level, link.fromHoleId)));
    fireEvent.click(gearNode(gearKeyAt(level, link.toHoleId)));

    expect(useDraaiwerkStore.getState().status).toBe("solved");
    expect(useDraaiwerkStore.getState().placements).toHaveLength(1);
  });

  it("places a lying axle with two taps", () => {
    useDraaiwerkStore.setState({ unlocked: 10 });
    useDraaiwerkStore.getState().startLevel(9);
    renderGame();

    const level = levelAt(9);
    const axle = level.tray.find((item) => item.kind === "lying-as");
    const solution = level.solution.find((placement) => placement.kind === "lying-as");
    if (!axle || axle.kind !== "lying-as" || !solution || solution.kind !== "lying-as") {
      throw new Error("Level 10 has no lying axle");
    }

    const sameOrientation = axle.sizeA === solution.sizeA && axle.sizeB === solution.sizeB;
    const firstHole = sameOrientation ? solution.holeA : solution.holeB;
    const secondHole = sameOrientation ? solution.holeB : solution.holeA;

    fireEvent.click(trayNode(axle.id));
    fireEvent.click(holeNode(firstHole));
    expect(screen.getByText(/Tik nu het tweede gat/)).toBeTruthy();
    expect(useDraaiwerkStore.getState().pendingHoleId).toBe(firstHole);

    fireEvent.click(holeNode(secondHole));

    expect(useDraaiwerkStore.getState().status).toBe("solved");
    expect(useDraaiwerkStore.getState().placements).toHaveLength(1);
  });

  it("explains blocked holes and overlapping gears", () => {
    useDraaiwerkStore.setState({ unlocked: 6 });
    useDraaiwerkStore.getState().startLevel(5);
    renderGame();

    const level = levelAt(5);
    const blockedHole = level.blockedHoleIds[0];
    if (!blockedHole) {
      throw new Error("Level 6 has no blocked hole");
    }

    fireEvent.click(trayNode(firstGearItem(level).id));
    fireEvent.click(holeNode(blockedHole));
    expect(screen.getByText("Dit gat is geblokkeerd.")).toBeTruthy();

    fireEvent.click(holeNode("0,2"));
    expect(screen.getByText("Dit tandwiel botst met een ander.")).toBeTruthy();
  });

  it("rejects a lying axle that is too short", () => {
    useDraaiwerkStore.setState({ unlocked: 10 });
    useDraaiwerkStore.getState().startLevel(9);
    renderGame();

    const axle = levelAt(9).tray.find((item) => item.kind === "lying-as");
    if (!axle) {
      throw new Error("Level 10 has no lying axle");
    }

    fireEvent.click(trayNode(axle.id));
    fireEvent.click(holeNode("3,2"));
    fireEvent.click(holeNode("4,2"));

    expect(screen.getByText("De as is te kort: kies een gat verder weg.")).toBeTruthy();
    expect(useDraaiwerkStore.getState().placements).toEqual([]);
  });

  it("shows the speed gauge and lights the lamp", () => {
    useDraaiwerkStore.setState({ unlocked: 13 });
    useDraaiwerkStore.getState().startLevel(12);
    renderGame();

    expect(screen.getByRole("img", { name: /Snelheid lamp/ })).toBeTruthy();

    const level = levelAt(12);
    const axle = level.tray.find((item) => item.kind === "lying-as");
    const solution = level.solution.find((placement) => placement.kind === "lying-as");
    if (!axle || axle.kind !== "lying-as" || !solution || solution.kind !== "lying-as") {
      throw new Error("Level 13 has no lying axle");
    }

    const sameOrientation = axle.sizeA === solution.sizeA && axle.sizeB === solution.sizeB;
    const firstHole = sameOrientation ? solution.holeA : solution.holeB;
    const secondHole = sameOrientation ? solution.holeB : solution.holeA;

    fireEvent.click(trayNode(axle.id));
    fireEvent.click(holeNode(firstHole));
    fireEvent.click(holeNode(secondHole));

    expect(useDraaiwerkStore.getState().status).toBe("solved");
    expect(
      document.querySelector('[data-output-id="generator-1"]')?.getAttribute("data-satisfied"),
    ).toBe("true");
  });

  it("shows two gauges on the two-output level", () => {
    useDraaiwerkStore.setState({ unlocked: 16 });
    useDraaiwerkStore.getState().startLevel(15);
    renderGame();

    expect(screen.getByRole("img", { name: /Snelheid lamp/ })).toBeTruthy();
    expect(screen.getByRole("img", { name: /Snelheid lift/ })).toBeTruthy();
    expect(document.querySelectorAll("[data-tray-id]")).toHaveLength(5);
    expect(document.querySelectorAll("[data-output-id]")).toHaveLength(2);
  });

  it("hints, resets and keeps the picker in sync", async () => {
    useDraaiwerkStore.setState({ unlocked: 3 });
    useDraaiwerkStore.getState().startLevel(1);
    renderGame();

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(useDraaiwerkStore.getState().hintPlacement).not.toBeNull();
    expect(document.querySelectorAll('[data-hint="true"]').length).toBeGreaterThan(0);

    const level = levelAt(1);
    fireEvent.click(trayNode(firstGearItem(level).id));
    fireEvent.click(holeNode(firstGearSolution(level).holeId));
    expect(useDraaiwerkStore.getState().placements).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Opnieuw" }));
    expect(useDraaiwerkStore.getState().placements).toEqual([]);
    expect(useDraaiwerkStore.getState().hintPlacement).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Kies level" }));
    expect(await screen.findByRole("heading", { name: "Overbrengen" })).toBeTruthy();
    expect(
      document.querySelector(`[data-level-id="${levelAt(1).id}"]`)?.getAttribute("data-state"),
    ).toBe("completed");
  });

  it("shows every level in the picker with locked state", async () => {
    renderGame();
    fireEvent.click(screen.getByRole("button", { name: "Kies level" }));

    expect(await screen.findByRole("heading", { name: "Tandwielen" })).toBeTruthy();
    expect(document.querySelectorAll("[data-level-id]")).toHaveLength(LEVEL_COUNT);
    expect(
      document.querySelector(`[data-level-id="${levelAt(0).id}"]`)?.getAttribute("data-state"),
    ).not.toBe("locked");
    expect(
      document.querySelector(`[data-level-id="${levelAt(1).id}"]`)?.getAttribute("data-state"),
    ).toBe("locked");
  });

  it("clamps stored progress to the available levels", () => {
    expect(normalizeDraaiwerkProgress(undefined)).toEqual(DEFAULT_DRAAIWERK_PROGRESS);
    expect(normalizeDraaiwerkProgress({ unlocked: 99, current: 99 })).toEqual({
      unlocked: LEVEL_COUNT,
      current: LEVEL_COUNT - 1,
      finished: false,
    });
    expect(normalizeDraaiwerkProgress({ unlocked: "2", current: 0 })).toEqual({
      unlocked: 1,
      current: 0,
      finished: false,
    });
  });
});
