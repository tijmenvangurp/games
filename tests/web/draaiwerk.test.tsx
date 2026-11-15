import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  LEVEL_COUNT,
  drive,
  levelAt,
  type DriveResult,
  type Level,
  type Placement,
} from "@entities/gear";
import {
  DEFAULT_DRAAIWERK_PROGRESS,
  DRAAIWERK_STORAGE_KEY,
  DRAAIWERK_STORAGE_VERSION,
  normalizeDraaiwerkProgress,
  statusMessage,
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
    expect(await screen.findByRole("button", { name: "Volgende level" })).toBeTruthy();

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
      (
        placement,
      ): placement is Extract<Placement, { kind: "open-belt" | "crossed-belt" | "chain" }> =>
        placement.kind === "open-belt" ||
        placement.kind === "crossed-belt" ||
        placement.kind === "chain",
    );
    if (!belt || !link) {
      throw new Error("Level 3 is not a belt level");
    }

    fireEvent.click(trayNode(belt.id));
    fireEvent.click(gearNode(gearKeyAt(level, link.fromHoleId)));

    expect(useDraaiwerkStore.getState().placements[0]).toMatchObject({
      kind: "loose-belt",
      holeId: link.fromHoleId,
    });
    expect(useDraaiwerkStore.getState().pendingGearKey).not.toBeNull();
    expect(screen.getByText("Trek de riem nu naar een ander tandwiel.")).toBeTruthy();

    fireEvent.click(gearNode(gearKeyAt(level, link.toHoleId)));

    expect(useDraaiwerkStore.getState().status).toBe("solved");
    expect(useDraaiwerkStore.getState().placements).toHaveLength(1);
  });

  it("places a wormas with one tap", () => {
    useDraaiwerkStore.setState({ unlocked: 10 });
    useDraaiwerkStore.getState().startLevel(9);
    renderGame();

    const level = levelAt(9);
    const worm = level.tray.find((item) => item.kind === "worm");
    const solution = level.solution.find((placement) => placement.kind === "worm");
    if (!worm || worm.kind !== "worm" || !solution || solution.kind !== "worm") {
      throw new Error("Level 10 has no wormas");
    }

    fireEvent.click(trayNode(worm.id));
    fireEvent.click(holeNode(solution.shaftHoleId));

    expect(useDraaiwerkStore.getState().status).toBe("solved");
    expect(useDraaiwerkStore.getState().placements).toHaveLength(1);
    expect(useDraaiwerkStore.getState().placements[0]).toMatchObject({
      kind: "worm",
      shaftHoleId: solution.shaftHoleId,
      wheelHoleId: solution.wheelHoleId,
    });
  });

  it("finds the same wormas when the player taps the wheel hole", () => {
    useDraaiwerkStore.setState({ unlocked: 10 });
    useDraaiwerkStore.getState().startLevel(9);
    renderGame();

    const level = levelAt(9);
    const worm = level.tray.find((item) => item.kind === "worm");
    const solution = level.solution.find((placement) => placement.kind === "worm");
    if (!worm || worm.kind !== "worm" || !solution || solution.kind !== "worm") {
      throw new Error("Level 10 has no wormas");
    }

    fireEvent.click(trayNode(worm.id));
    fireEvent.click(holeNode(solution.wheelHoleId));

    expect(useDraaiwerkStore.getState().status).toBe("solved");
    expect(useDraaiwerkStore.getState().placements[0]).toMatchObject({
      kind: "worm",
      shaftHoleId: solution.shaftHoleId,
      wheelHoleId: solution.wheelHoleId,
    });
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

  it("rejects a wormas on an occupied hole", () => {
    useDraaiwerkStore.setState({ unlocked: 10 });
    useDraaiwerkStore.getState().startLevel(9);
    renderGame();

    const worm = levelAt(9).tray.find((item) => item.kind === "worm");
    if (!worm) {
      throw new Error("Level 10 has no wormas");
    }

    fireEvent.click(trayNode(worm.id));
    fireEvent.click(holeNode(levelAt(9).motor.holeId));

    expect(screen.getByText("De wormas past daar niet.")).toBeTruthy();
    expect(useDraaiwerkStore.getState().placements).toEqual([]);
  });

  it("shows the speed gauge and lights the lamp", () => {
    useDraaiwerkStore.setState({ unlocked: 13 });
    useDraaiwerkStore.getState().startLevel(12);
    renderGame();

    expect(screen.getByRole("img", { name: /Snelheid lamp/ })).toBeTruthy();

    const level = levelAt(12);
    const belt = level.tray.find((item) => item.kind === "belt");
    const solution = level.solution.find(
      (
        placement,
      ): placement is Extract<Placement, { kind: "open-belt" | "crossed-belt" | "chain" }> =>
        placement.kind === "open-belt" ||
        placement.kind === "crossed-belt" ||
        placement.kind === "chain",
    );
    if (!belt || !solution) {
      throw new Error("Level 13 has no belt solution");
    }

    fireEvent.click(trayNode(belt.id));
    fireEvent.click(gearNode(gearKeyAt(level, solution.fromHoleId)));
    fireEvent.click(gearNode(gearKeyAt(level, solution.toHoleId)));

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

  it("bouwt level 16 met een riem voor de lamp en een worm voor de lift", () => {
    useDraaiwerkStore.setState({ unlocked: 16 });
    useDraaiwerkStore.getState().startLevel(15);
    renderGame();

    const level = levelAt(15);
    const gears = level.tray.filter((item) => item.kind === "gear");
    const belt = level.tray.find((item) => item.kind === "belt");
    const worm = level.tray.find((item) => item.kind === "worm");
    if (gears.length !== 3 || !belt || !worm) {
      throw new Error("Level 16 does not have the expected tray");
    }

    useDraaiwerkStore.getState().selectTray(gears[0]!.id);
    useDraaiwerkStore.getState().tapHole("2,4");
    useDraaiwerkStore.getState().selectTray(gears[1]!.id);
    useDraaiwerkStore.getState().tapHole("2,6");
    useDraaiwerkStore.getState().selectTray(gears[2]!.id);
    useDraaiwerkStore.getState().tapHole("4,6");

    useDraaiwerkStore.getState().selectTray(belt.id);
    useDraaiwerkStore.getState().tapGear("gear:2,6");
    useDraaiwerkStore.getState().tapGear("output:generator-1");

    useDraaiwerkStore.getState().selectTray(worm.id);
    useDraaiwerkStore.getState().tapHole("6,6");

    expect(useDraaiwerkStore.getState().status).toBe("solved");
    const result = drive(level, useDraaiwerkStore.getState().placements);
    expect(result.outputs.map((output) => output.satisfied)).toEqual([true, true]);
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

function emptyDrive(): DriveResult {
  return { gears: [], connections: [], outputs: [], jammed: false, solved: false };
}

function outputPose(
  kind: "target" | "generator" | "lift",
  satisfied: boolean,
): DriveResult["outputs"][number] {
  return {
    id: kind,
    kind,
    satisfied,
    speed: 1,
    direction: 1,
    center: { x: 0, y: 0 },
  };
}

describe("draaiwerk: onderdelen verplaatsen", () => {
  it("verplaatst een geplaatst tandwiel en haalt het weer weg", () => {
    useDraaiwerkStore.setState({ unlocked: 2, finished: false });
    useDraaiwerkStore.getState().startLevel(0);
    const item = levelAt(0).tray[0];
    if (!item) {
      throw new Error("Level 1 has no tray item");
    }

    useDraaiwerkStore.getState().selectTray(item.id);
    useDraaiwerkStore.getState().tapHole("1,0");
    expect(useDraaiwerkStore.getState().placements).toHaveLength(1);

    useDraaiwerkStore.getState().movePlaced("gear:1,0", "2,2");
    expect(useDraaiwerkStore.getState().status).toBe("solved");

    useDraaiwerkStore.getState().startLevel(0);
    useDraaiwerkStore.getState().selectTray(item.id);
    useDraaiwerkStore.getState().tapHole("1,0");
    useDraaiwerkStore.getState().removePlaced("gear:1,0");

    expect(useDraaiwerkStore.getState().placements).toEqual([]);
    expect(useDraaiwerkStore.getState().usedTrayIds).toEqual([]);
  });

  it("weigert een ongeldige verplaatsing", () => {
    useDraaiwerkStore.setState({ unlocked: 2, finished: false });
    useDraaiwerkStore.getState().startLevel(0);
    const item = levelAt(0).tray[0];
    if (!item) {
      throw new Error("Level 1 has no tray item");
    }

    useDraaiwerkStore.getState().selectTray(item.id);
    useDraaiwerkStore.getState().tapHole("1,0");
    useDraaiwerkStore.getState().movePlaced("gear:1,0", "0,2");

    expect(useDraaiwerkStore.getState().placements).toHaveLength(1);
    expect(useDraaiwerkStore.getState().feedback).toBe("Daar past dit onderdeel niet.");
  });

  it("verplaatst en verwijdert een wormas", () => {
    useDraaiwerkStore.setState({ unlocked: 16, finished: false });
    useDraaiwerkStore.getState().startLevel(9);
    const worm = levelAt(9).tray.find((candidate) => candidate.kind === "worm");
    if (!worm || worm.kind !== "worm") {
      throw new Error("Level 10 has no wormas");
    }
    const placed: Placement = {
      kind: "worm",
      shaftHoleId: "2,0",
      wheelHoleId: "6,0",
      shaftSize: worm.shaftSize,
      wheelSize: worm.wheelSize,
      ratio: worm.ratio,
      direction: worm.direction,
    };

    useDraaiwerkStore.setState({ placements: [placed], usedTrayIds: [worm.id] });
    useDraaiwerkStore.getState().movePlaced("worm:2,0", "2,2");
    expect(useDraaiwerkStore.getState().status).toBe("solved");

    useDraaiwerkStore.setState({ placements: [placed], usedTrayIds: [worm.id] });
    useDraaiwerkStore.getState().startLevel(9);
    useDraaiwerkStore.setState({ placements: [placed], usedTrayIds: [worm.id], status: "playing" });
    useDraaiwerkStore.getState().removePlaced("worm:2,0");

    expect(useDraaiwerkStore.getState().placements).toEqual([]);
    expect(useDraaiwerkStore.getState().usedTrayIds).toEqual([]);
  });

  it("haalt een geplaatste riem terug", () => {
    useDraaiwerkStore.setState({ unlocked: 16, finished: false });
    useDraaiwerkStore.getState().startLevel(13);
    const belt = levelAt(13).tray.find((candidate) => candidate.kind === "belt");
    if (!belt) {
      throw new Error("Level 14 has no belt");
    }

    useDraaiwerkStore.getState().selectTray(belt.id);
    useDraaiwerkStore.getState().tapGear("motor");
    useDraaiwerkStore.getState().tapGear("output:lift-1");
    const placement = useDraaiwerkStore.getState().placements[0];
    if (
      !placement ||
      (placement.kind !== "open-belt" &&
        placement.kind !== "crossed-belt" &&
        placement.kind !== "chain")
    ) {
      throw new Error("Belt was not placed");
    }

    useDraaiwerkStore
      .getState()
      .removePlaced(`belt:${placement.kind}:${placement.fromHoleId}:${placement.toHoleId}`);

    expect(useDraaiwerkStore.getState().placements).toEqual([]);
    expect(useDraaiwerkStore.getState().usedTrayIds).toEqual([]);
  });
});

describe("draaiwerk: wormas en losse riem", () => {
  it("laat een riem eerst los hangen en verbindt pas bij de tweede tik", () => {
    useDraaiwerkStore.setState({ unlocked: 3, finished: false });
    useDraaiwerkStore.getState().startLevel(2);
    const belt = levelAt(2).tray.find((item) => item.kind === "belt");
    if (!belt) {
      throw new Error("Level 3 has no belt");
    }

    useDraaiwerkStore.getState().selectTray(belt.id);
    useDraaiwerkStore.getState().tapGear("motor");

    expect(useDraaiwerkStore.getState().placements[0]).toMatchObject({
      kind: "loose-belt",
      holeId: "0,2",
      link: "open-belt",
    });
    expect(useDraaiwerkStore.getState().pendingGearKey).toBe("motor");

    useDraaiwerkStore.getState().tapHole("5,2");

    expect(useDraaiwerkStore.getState().status).toBe("solved");
    expect(useDraaiwerkStore.getState().placements[0]).toMatchObject({
      kind: "open-belt",
      fromHoleId: "0,2",
      toHoleId: "5,2",
    });
  });

  it("verwijdert een losse riem en houdt het onderdeel in de la", () => {
    useDraaiwerkStore.setState({ unlocked: 3, finished: false });
    useDraaiwerkStore.getState().startLevel(2);
    const belt = levelAt(2).tray.find((item) => item.kind === "belt");
    if (!belt) {
      throw new Error("Level 3 has no belt");
    }

    useDraaiwerkStore.getState().selectTray(belt.id);
    useDraaiwerkStore.getState().tapGear("motor");
    useDraaiwerkStore.getState().removePlaced("loose:0,2");

    expect(useDraaiwerkStore.getState().placements).toEqual([]);
    expect(useDraaiwerkStore.getState().usedTrayIds).toEqual([]);
    expect(useDraaiwerkStore.getState().pendingGearKey).toBeNull();
  });

  it("hervat een losse riem via het losse uiteinde", () => {
    useDraaiwerkStore.setState({ unlocked: 3, finished: false });
    useDraaiwerkStore.getState().startLevel(2);
    const belt = levelAt(2).tray.find((item) => item.kind === "belt");
    if (!belt) {
      throw new Error("Level 3 has no belt");
    }

    useDraaiwerkStore.getState().selectTray(belt.id);
    useDraaiwerkStore.getState().tapGear("motor");
    useDraaiwerkStore.getState().tapGear("motor");
    expect(useDraaiwerkStore.getState().pendingGearKey).toBeNull();

    useDraaiwerkStore.getState().selectLooseBelt("0,2");
    expect(useDraaiwerkStore.getState().pendingGearKey).toBe("motor");
    expect(useDraaiwerkStore.getState().feedback).toBe("Tik nu een tweede tandwiel.");
  });

  it("plaatst een wormas via dropTray en ruimt hem met undo weer op", () => {
    useDraaiwerkStore.setState({ unlocked: 10, finished: false });
    useDraaiwerkStore.getState().startLevel(9);
    const worm = levelAt(9).tray.find((item) => item.kind === "worm");
    if (!worm) {
      throw new Error("Level 10 has no wormas");
    }

    useDraaiwerkStore.getState().dropTray(worm.id, { kind: "hole", targetId: "2,2" });
    expect(useDraaiwerkStore.getState().status).toBe("solved");
    expect(useDraaiwerkStore.getState().placements[0]).toMatchObject({
      kind: "worm",
      shaftHoleId: "2,2",
      wheelHoleId: "6,2",
    });

    useDraaiwerkStore.getState().removeLast();
    expect(useDraaiwerkStore.getState().placements).toEqual([]);
  });

  it("geeft een hint voor de wormas en wisselt de selectie", () => {
    useDraaiwerkStore.setState({ unlocked: 10, finished: false });
    useDraaiwerkStore.getState().startLevel(9);
    const worm = levelAt(9).tray.find((item) => item.kind === "worm");
    if (!worm) {
      throw new Error("Level 10 has no wormas");
    }

    useDraaiwerkStore.getState().hint();
    expect(useDraaiwerkStore.getState().hintPlacement?.kind).toBe("worm");

    useDraaiwerkStore.getState().selectTray(worm.id);
    expect(useDraaiwerkStore.getState().selectedTrayId).toBe(worm.id);
    useDraaiwerkStore.getState().selectTray(worm.id);
    expect(useDraaiwerkStore.getState().selectedTrayId).toBeNull();
  });

  it("negeert losse-riemacties zonder losse riem", () => {
    useDraaiwerkStore.setState({ unlocked: 3, finished: false });
    useDraaiwerkStore.getState().startLevel(2);
    const belt = levelAt(2).tray.find((item) => item.kind === "belt");
    if (!belt) {
      throw new Error("Level 3 has no belt");
    }

    useDraaiwerkStore.getState().extendLooseBelt("0,2", "output:target-1");
    useDraaiwerkStore.getState().selectLooseBelt("0,2");
    expect(useDraaiwerkStore.getState().pendingGearKey).toBeNull();

    useDraaiwerkStore.getState().selectTray(belt.id);
    useDraaiwerkStore.getState().tapGear("motor");
    useDraaiwerkStore.getState().extendLooseBelt("0,2", "motor");
    expect(useDraaiwerkStore.getState().placements[0]).toMatchObject({
      kind: "loose-belt",
    });
  });

  it("haalt een riem mee als het tandwiel eronder weggaat", () => {
    useDraaiwerkStore.setState({ unlocked: 16, finished: false });
    useDraaiwerkStore.getState().startLevel(15);
    const level = levelAt(15);
    const gears = level.tray.filter((item) => item.kind === "gear");
    const belt = level.tray.find((item) => item.kind === "belt");
    if (gears.length !== 3 || !belt) {
      throw new Error("Level 16 does not have the expected tray");
    }

    useDraaiwerkStore.getState().selectTray(gears[0]!.id);
    useDraaiwerkStore.getState().tapHole("2,4");
    useDraaiwerkStore.getState().selectTray(gears[1]!.id);
    useDraaiwerkStore.getState().tapHole("2,6");
    useDraaiwerkStore.getState().selectTray(belt.id);
    useDraaiwerkStore.getState().tapGear("gear:2,6");
    useDraaiwerkStore.getState().tapGear("output:generator-1");
    expect(useDraaiwerkStore.getState().placements).toHaveLength(3);

    useDraaiwerkStore.getState().removePlaced("gear:2,6");

    expect(useDraaiwerkStore.getState().placements).toHaveLength(1);
    expect(useDraaiwerkStore.getState().usedTrayIds).toHaveLength(1);
  });
});

describe("draaiwerk: statusmeldingen", () => {
  const level = levelAt(0);
  const base = emptyDrive();

  it("kiest de juiste melding per uitkomst", () => {
    expect(statusMessage(level, { ...base, solved: true }, null, "instructie", false)).toBe(
      "Level gehaald.",
    );
    expect(statusMessage(level, { ...base, jammed: true }, null, "instructie", false)).toContain(
      "Vastgelopen",
    );
    expect(statusMessage(level, base, "fout", "instructie", false)).toBe("fout");
    expect(
      statusMessage(level, { ...base, outputs: [outputPose("generator", true)] }, null, "i", false),
    ).toBe("De lamp brandt.");
    expect(
      statusMessage(level, { ...base, outputs: [outputPose("lift", true)] }, null, "i", false),
    ).toBe("De lift gaat omhoog.");
    expect(
      statusMessage(level, { ...base, outputs: [outputPose("target", true)] }, null, "i", false),
    ).toBe("Het doel draait de goede kant op.");
    expect(statusMessage(level, base, null, "instructie", true)).toContain("Alle onderdelen");
    expect(statusMessage(level, base, null, "instructie", false)).toBe("instructie");
  });

  it("herkent een verkeerde richting, meter, lamp en lift", () => {
    const wrongLevel = levelAt(7);
    expect(
      statusMessage(
        wrongLevel,
        drive(wrongLevel, [{ kind: "gear", holeId: "3,2", size: 2 }]),
        null,
        "i",
        false,
      ),
    ).toContain("andere kant");

    const meterLevel = levelAt(11);
    expect(
      statusMessage(
        meterLevel,
        drive(meterLevel, [
          {
            kind: "worm",
            shaftHoleId: "3,2",
            wheelHoleId: "7,2",
            shaftSize: 2,
            wheelSize: 1,
            ratio: 0.5,
            direction: 1,
          },
        ]),
        null,
        "i",
        false,
      ),
    ).toContain("meter");

    const generatorLevel = levelAt(12);
    expect(
      statusMessage(
        generatorLevel,
        drive(generatorLevel, [
          {
            kind: "worm",
            shaftHoleId: "3,2",
            wheelHoleId: "7,2",
            shaftSize: 2,
            wheelSize: 1,
            ratio: 0.5,
            direction: -1,
          },
        ]),
        null,
        "i",
        false,
      ),
    ).toContain("lamp");

    const liftLevel = levelAt(13);
    expect(
      statusMessage(
        liftLevel,
        drive(liftLevel, [{ kind: "open-belt", fromHoleId: "0,2", toHoleId: "8,2" }]),
        null,
        "i",
        false,
      ),
    ).toContain("lift");
  });
});
