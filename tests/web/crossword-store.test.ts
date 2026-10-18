import { beforeEach, describe, expect, it } from "vitest";
import { useCrosswordStore } from "@features/crossword";
import { saveCrosswordLetters } from "@features/crossword";

function solutionLetters(): Record<string, string> {
  const puzzle = useCrosswordStore.getState().puzzle;
  return Object.fromEntries(
    puzzle.cells
      .flat()
      .filter((cell) => cell.solution)
      .map((cell) => [`${cell.row}:${cell.col}`, cell.solution ?? ""]),
  );
}

beforeEach(() => {
  localStorage.clear();
  useCrosswordStore.setState({
    letters: {},
    selected: null,
    direction: "across",
    entryIndex: null,
    wrong: new Set(),
    hinted: new Set(),
    solved: false,
    checked: false,
  });
});

describe("crossword selection", () => {
  it("selects an entry and toggles direction on the same cell", () => {
    const store = useCrosswordStore.getState();
    store.selectEntry(3);
    expect(useCrosswordStore.getState().selected).toEqual({ row: 4, col: 0 });
    expect(useCrosswordStore.getState().direction).toBe("across");

    store.selectCell(4, 0);
    expect(useCrosswordStore.getState().direction).toBe("down");
    store.selectCell(4, 0);
    expect(useCrosswordStore.getState().direction).toBe("across");
  });

  it("ignores blocks and unknown entries", () => {
    useCrosswordStore.getState().selectEntry(99);
    const before = useCrosswordStore.getState().selected;
    useCrosswordStore.getState().selectCell(0, 0);
    expect(useCrosswordStore.getState().selected).toEqual(before);
  });
});

describe("crossword typing", () => {
  it("fills a word and stays on the last cell", () => {
    const store = useCrosswordStore.getState();
    store.selectEntry(1);
    for (const letter of "ARTICUNO") {
      store.typeLetter(letter);
    }

    const state = useCrosswordStore.getState();
    expect(state.letters["1:0"]).toBe("A");
    expect(state.letters["1:7"]).toBe("O");
    expect(state.selected).toEqual({ row: 1, col: 7 });

    store.typeLetter("1");
    expect(useCrosswordStore.getState().letters["1:7"]).toBe("O");
  });

  it("clears the current or previous letter with backspace", () => {
    const store = useCrosswordStore.getState();
    store.selectEntry(1);
    store.typeLetter("A");
    store.typeLetter("R");
    store.typeLetter("T");

    store.backspace();
    expect(useCrosswordStore.getState().letters["1:2"]).toBeUndefined();
    store.backspace();
    expect(useCrosswordStore.getState().letters["1:1"]).toBeUndefined();
  });

  it("moves over filled cells and ignores blocks", () => {
    const store = useCrosswordStore.getState();
    store.selectEntry(1);
    store.move(0, 1);
    expect(useCrosswordStore.getState().selected).toEqual({ row: 1, col: 1 });

    store.move(-1, 0);
    expect(useCrosswordStore.getState().selected).toEqual({ row: 1, col: 1 });
    store.move(9, 9);
    expect(useCrosswordStore.getState().selected).toEqual({ row: 1, col: 1 });
  });
});

describe("crossword checking and hints", () => {
  it("solves a complete correct board", () => {
    useCrosswordStore.setState({ letters: solutionLetters() });
    useCrosswordStore.getState().check();

    expect(useCrosswordStore.getState().solved).toBe(true);
    expect(useCrosswordStore.getState().wrong.size).toBe(0);
  });

  it("marks a wrong board and reports an incomplete board", () => {
    const letters = solutionLetters();
    letters["0:5"] = "X";
    useCrosswordStore.setState({ letters });
    useCrosswordStore.getState().check();

    expect(useCrosswordStore.getState().solved).toBe(false);
    expect(useCrosswordStore.getState().wrong.size).toBeGreaterThan(0);
    expect(useCrosswordStore.getState().checked).toBe(true);

    useCrosswordStore.setState({ letters: {} });
    useCrosswordStore.getState().check();
    expect(useCrosswordStore.getState().wrong.size).toBe(0);
    expect(useCrosswordStore.getState().checked).toBe(true);
  });

  it("reveals a hint and can finish the puzzle", () => {
    useCrosswordStore.getState().start();
    useCrosswordStore.getState().hint();
    expect(useCrosswordStore.getState().letters["0:5"]).toBe("B");
    expect(useCrosswordStore.getState().hinted.has("0:5")).toBe(true);

    const letters = solutionLetters();
    const lastKey = Object.keys(letters).at(-1) ?? "0:5";
    const [row, col] = lastKey.split(":").map(Number);
    const rest = { ...letters };
    delete rest[lastKey];
    useCrosswordStore.setState({ letters: rest, selected: { row, col }, solved: false });
    useCrosswordStore.getState().hint();
    expect(useCrosswordStore.getState().solved).toBe(true);
  });
});

describe("crossword lifecycle", () => {
  it("restarts with a clean board", () => {
    useCrosswordStore.setState({ letters: { "0:5": "B" }, solved: true });
    useCrosswordStore.getState().restart();

    const state = useCrosswordStore.getState();
    expect(state.letters).toEqual({});
    expect(state.solved).toBe(false);
    expect(state.selected).toEqual({ row: 0, col: 5 });
  });

  it("resumes saved letters", () => {
    saveCrosswordLetters({ "0:5": "B" });
    useCrosswordStore.getState().start();
    expect(useCrosswordStore.getState().letters["0:5"]).toBe("B");
    expect(useCrosswordStore.getState().solved).toBe(false);
  });
});
