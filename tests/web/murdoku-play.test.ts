import { beforeEach, describe, expect, it } from "vitest";
import { loadMurdokuLevel } from "@entities/murdoku";
import { crossedCells, MURDOKU_INTRO_LEVEL, useMurdokuStore } from "@features/murdoku-game";

const puzzle = loadMurdokuLevel(MURDOKU_INTRO_LEVEL);

function resetStore(): void {
  useMurdokuStore.setState({ puzzle: null, play: null, history: [] });
}

function store() {
  return useMurdokuStore.getState();
}

beforeEach(() => {
  localStorage.clear();
  resetStore();
});

describe("murdoku-play store", () => {
  it("begint met een leeg bord", () => {
    store().start(puzzle);

    expect(store().play?.levelId).toBe(puzzle.id);
    expect(store().play?.placements.size).toBe(0);
    expect(store().play?.manualCrosses.size).toBe(0);
    expect(store().play?.selected).toBeNull();
    expect(store().play?.mode).toBe("place");
    expect(store().play?.phase).toBe("playing");
    expect(store().play?.wrongCheck).toBe(false);
    expect(store().play?.resolution).toBeNull();
    expect(store().history).toEqual([]);
  });

  it("plaatst een gekozen persoon en haalt hem weer weg", () => {
    store().start(puzzle);
    store().selectPerson("A");
    expect(store().play?.selected).toBe("A");

    store().tapCell(1);

    expect(store().play?.placements.get("A")).toBe(1);
    expect(store().history).toHaveLength(1);

    store().tapCell(1);

    expect(store().play?.placements.has("A")).toBe(false);
    expect(store().history).toHaveLength(2);
  });

  it("zet een kruisje alleen op een bezetbaar vakje", () => {
    store().start(puzzle);
    store().setMode("cross");
    expect(store().play?.selected).toBeNull();

    store().tapCell(8);
    expect(crossedCells(puzzle, store().play!)).toContain(8);

    store().tapCell(8);
    expect(crossedCells(puzzle, store().play!)).not.toContain(8);

    // Rij 1, kolom 3 is een tafel: daar mag niemand staan, dus geen kruisje.
    store().tapCell(2);
    expect(crossedCells(puzzle, store().play!)).not.toContain(2);
    expect(store().history).toHaveLength(2);
  });

  it("kruist de rij en kolom van een geplaatst persoon automatisch weg", () => {
    store().start(puzzle);
    store().selectPerson("A");
    store().tapCell(1);

    const crossed = crossedCells(puzzle, store().play!);
    expect(crossed).toEqual(new Set([0, 5, 9]));
    expect(crossed).not.toContain(1);

    store().tapCell(1);

    expect(crossedCells(puzzle, store().play!).size).toBe(0);
  });

  it("maakt de laatste stap ongedaan", () => {
    store().start(puzzle);
    store().selectPerson("A");
    store().tapCell(1);
    store().undo();

    expect(store().play?.placements.size).toBe(0);
    expect(store().history).toEqual([]);

    store().setMode("cross");
    store().tapCell(8);
    store().undo();

    expect(crossedCells(puzzle, store().play!)).toEqual(new Set());
  });
});
