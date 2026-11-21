import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { levelAt as arrowLevelAt, levelName, solveMaze, type MazeLevel } from "@entities/arrow";
import {
  allLevels,
  drive,
  levelAt,
  levelText,
  trayLabel,
  type DriveResult,
  type Level,
} from "@entities/gear";
import { useArrowsStore } from "@features/arrow-game";
import {
  chapterName,
  formatSpeed,
  outputName,
  rejectionFor,
  statusMessage,
  trayShortLabel,
  useDraaiwerkStore,
} from "@features/draaiwerk";
import { setLanguage } from "@shared/i18n";

function renderApp(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

function resetToDutch() {
  act(() => setLanguage("nl"));
  localStorage.clear();
}

function resetGames() {
  useDraaiwerkStore.setState({ levelIndex: 0, unlocked: 1, finished: false });
  useDraaiwerkStore.getState().startLevel(0);
  useArrowsStore.setState({
    levelIndex: 0,
    unlocked: 1,
    level: arrowLevelAt(0),
    removedIds: [],
    history: [],
    status: "playing",
    hintId: null,
  });
}

function node<T extends Element>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) {
    throw new Error(`${selector} not found`);
  }
  return found;
}

beforeEach(() => {
  cleanup();
  resetToDutch();
  resetGames();
  act(() => setLanguage("en"));
});

afterEach(() => {
  cleanup();
  resetToDutch();
});

describe("Gearworks in English", () => {
  it("plays the first level and opens the level list", async () => {
    renderApp("/draaiwerk");

    expect(await screen.findByText("Gearworks")).toBeTruthy();
    expect(screen.getByText("Gears · level 1 of 25")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Level 1 · First tooth" })).toBeTruthy();
    expect(screen.getByText("One gear touches the motor and the goal.")).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
    expect(
      screen.getByText("Choose a part, or drag a placed part back to the drawer."),
    ).toBeTruthy();
    expect(screen.getByRole("region", { name: "Parts" })).toBeTruthy();
    expect(screen.getByText("1 left")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start again" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Gear board for First tooth" })).toBeTruthy();
    expect(screen.getByText("MOTOR")).toBeTruthy();
    expect(screen.getByText("GOAL")).toBeTruthy();

    fireEvent.click(node('[data-hole-id="2,2"]'));
    expect(screen.getByText("Choose a part from the drawer first.")).toBeTruthy();

    const gear = screen.getByRole("button", { name: "Small gear" });
    expect(gear.textContent).toContain("Small");
    fireEvent.click(gear);
    expect(screen.getByRole("button", { name: "Small gear, selected" })).toBeTruthy();
    expect(screen.getByText("Tap an empty hole for the gear.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hole 0, 0" })).toBeTruthy();

    fireEvent.click(node('[data-hole-id="2,2"]'));

    expect(await screen.findByText("You did it!")).toBeTruthy();
    expect(screen.getByText("done")).toBeTruthy();
    expect(screen.getByText("Level complete.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next level" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Choose a level" }));

    expect(await screen.findByRole("button", { name: "Back to the game" })).toBeTruthy();
    expect(screen.getByText("25 levels · 6 chapters")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Gears" })).toBeTruthy();
    expect(screen.getByText("Chapter 1 · levels 1–4")).toBeTruthy();
    expect(screen.getByText("1/4 done")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Level 1, First tooth, complete" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Level 2, Two in-between wheels" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Level 3, The chain loop, locked" })).toBeTruthy();
    expect(screen.getByText("2 of 25 levels unlocked")).toBeTruthy();
  });

  it("hangs a chain with English help", async () => {
    useDraaiwerkStore.setState({ unlocked: 3 });
    useDraaiwerkStore.getState().startLevel(2);
    renderApp("/draaiwerk");

    fireEvent.click(await screen.findByRole("button", { name: "Chain" }));
    expect(screen.getByText("Tap a gear to hang the chain around it.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Goal, gear" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Motor, gear" }));
    expect(screen.getByText("Now pull the chain to another gear.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pull the chain to another gear" })).toBeTruthy();
  });

  it("names the speed meter in English", async () => {
    const index = allLevels().findIndex((level) => level.id === "de-meter");
    useDraaiwerkStore.setState({ unlocked: index + 1 });
    useDraaiwerkStore.getState().startLevel(index);
    renderApp("/draaiwerk");

    expect(
      await screen.findByRole("img", {
        name: /^Speed of the goal: 0 times the motor, standing still$/,
      }),
    ).toBeTruthy();
  });

  it("translates the labels, messages and level texts", () => {
    const level = levelAt(0);
    expect(chapterName(6)).toBe("The factory");
    expect(chapterName(99)).toBe("Chapter 99");
    expect(formatSpeed(1.5)).toBe("1.5");
    expect(outputName("target")).toBe("Goal");
    expect(outputName("generator")).toBe("Lamp");
    expect(trayShortLabel({ id: "g", kind: "gear", size: 3 })).toBe("Large");
    expect(trayShortLabel({ id: "b", kind: "belt", crossed: true })).toBe("Crossed");
    expect(trayShortLabel({ id: "c", kind: "chain" })).toBe("Chain");
    expect(trayLabel({ id: "g", kind: "gear", size: 2 })).toBe("Medium gear");
    expect(trayLabel({ id: "b", kind: "belt", crossed: true })).toBe("Crossed chain");
    expect(rejectionFor(level, [], { kind: "gear", holeId: "9,9", size: 1 })).toBe(
      "That hole doesn't exist.",
    );

    const result: DriveResult = { ...drive(level, []), solved: false, jammed: true };
    expect(statusMessage(level, result, null, "", false)).toMatch(/^Stuck!/);
    expect(statusMessage(level, { ...result, jammed: false }, null, "", true)).toBe(
      "All the parts are used. Take one away and try again.",
    );

    for (const entry of allLevels()) {
      expect(levelText(entry, "nl")).toMatchObject({ name: entry.name, intro: entry.intro });
      expect(levelText(entry, "en").name).not.toBe(entry.name);
      expect(levelText(entry, "en").intro).not.toBe(entry.intro);
    }
    const unknown: Level = { ...level, id: "onbekend" };
    expect(levelText(unknown, "en").name).toBe(level.name);
  });
});

describe("Arrows in English", () => {
  it("shows the intro, plays a level and celebrates", async () => {
    renderApp("/pijlen");

    expect(await screen.findByText("Arrows")).toBeTruthy();
    expect(screen.getByText("Level 1 of 10")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Heart" })).toBeTruthy();
    expect(screen.getByText("1 of 10 levels unlocked")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    expect(await screen.findByRole("group", { name: "Heart: arrow puzzle" })).toBeTruthy();
    expect(screen.getByText("Tap an arrow that is free to fly away.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start again" })).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: /^Arrow pointing (up|right|down|left)$/ }).length,
    ).toBe(arrowLevelAt(0).arrows.length);

    const order = solveMaze(arrowLevelAt(0));
    if (!order) {
      throw new Error("Level is not solvable");
    }
    for (const id of order) {
      fireEvent.click(node(`[data-maze-arrow-id="${id}"]`));
    }

    expect(await screen.findByRole("heading", { name: "You did it!" })).toBeTruthy();
    expect(screen.getByText("Level 1 · Heart is solved.")).toBeTruthy();
    expect(screen.getByText("All the arrows are gone!")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next level" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back to the menu" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Choose a level" }));

    expect(await screen.findByRole("heading", { name: "Choose a level" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Level 2, Star" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Level 3, locked" })).toBeTruthy();
    expect(screen.getByText(/^Fish · \d+ arrows$/)).toBeTruthy();
  });

  it("names every level in English", () => {
    for (let index = 0; index < 10; index += 1) {
      const level = arrowLevelAt(index);
      expect(levelName(level, "nl")).toBe(level.name);
      expect(levelName(level, "en")).not.toBe(level.name);
    }
    const unknown: MazeLevel = { ...arrowLevelAt(0), id: "onbekend" };
    expect(levelName(unknown, "en")).toBe("Hart");
  });
});
