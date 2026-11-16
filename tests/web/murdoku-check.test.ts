import { beforeEach, describe, expect, it } from "vitest";
import { VICTIM_ID, loadMurdokuLevel } from "@entities/murdoku";
import {
  MURDOKU_INTRO_LEVEL,
  MURDOKU_INTRO_SOLUTION,
  everyonePlaced,
  useMurdokuStore,
} from "@features/murdoku-game";

const puzzle = loadMurdokuLevel(MURDOKU_INTRO_LEVEL);

function store() {
  return useMurdokuStore.getState();
}

function place(person: "A" | "B" | "C", cell: number): void {
  store().selectPerson(person);
  store().tapCell(cell);
}

/** De drie verdachten van de instapzaak op hun oplossingsvakje. */
function placeSuspects(): void {
  place("A", 1);
  place("B", 4);
  place("C", 11);
}

beforeEach(() => {
  localStorage.clear();
  useMurdokuStore.setState({ puzzle: null, play: null, history: [] });
  store().start(puzzle);
});

describe("murdoku controleren en winnen", () => {
  it("controleert pas als iedereen staat", () => {
    place("A", 1);
    place("B", 4);

    expect(everyonePlaced(puzzle, store().play!)).toBe(false);

    store().check(MURDOKU_INTRO_SOLUTION);

    expect(store().play?.phase).toBe("playing");
    expect(store().play?.wrongCheck).toBe(false);
    expect(store().play?.resolution).toBeNull();

    place("C", 11);

    expect(everyonePlaced(puzzle, store().play!)).toBe(true);
  });

  it("onthult de dief en de buit bij een goede controle", () => {
    placeSuspects();

    store().check(MURDOKU_INTRO_SOLUTION);

    const play = store().play!;
    expect(play.phase).toBe("solved");
    expect(play.wrongCheck).toBe(false);
    expect(play.resolution).toEqual({ murdererId: "C", roomId: "4", victimCell: 14 });
    expect(play.placements.get(VICTIM_ID)).toBe(14);
    expect(play.placements.size).toBe(4);
    expect(play.selected).toBeNull();
  });

  it("geeft neutrale feedback bij een fout en laat het bord staan", () => {
    place("A", 1);
    place("B", 4);
    place("C", 8);

    store().check(MURDOKU_INTRO_SOLUTION);

    expect(store().play?.phase).toBe("playing");
    expect(store().play?.wrongCheck).toBe(true);
    expect(store().play?.resolution).toBeNull();
    expect(store().play?.placements.get("C")).toBe(8);
    expect(store().play?.placements.has(VICTIM_ID)).toBe(false);

    // Een nieuwe stap haalt de feedback weg en de volgende controle klopt wel.
    store().tapCell(11);
    expect(store().play?.wrongCheck).toBe(false);

    store().check(MURDOKU_INTRO_SOLUTION);
    expect(store().play?.phase).toBe("solved");
  });

  it("houdt het bord vast zodra de zaak is opgelost", () => {
    placeSuspects();
    store().check(MURDOKU_INTRO_SOLUTION);
    const solved = store().play!;

    store().selectPerson("A");
    store().setMode("cross");
    store().tapCell(1);
    store().undo();

    expect(store().play).toBe(solved);
    expect(store().play?.placements.get("A")).toBe(1);
    expect(store().play?.phase).toBe("solved");
  });

  it("begint een nieuwe poging met een leeg, speelbaar bord", () => {
    placeSuspects();
    store().check(MURDOKU_INTRO_SOLUTION);

    store().start(puzzle);

    expect(store().play?.phase).toBe("playing");
    expect(store().play?.wrongCheck).toBe(false);
    expect(store().play?.resolution).toBeNull();
    expect(store().play?.placements.size).toBe(0);
    expect(store().history).toEqual([]);
  });
});
