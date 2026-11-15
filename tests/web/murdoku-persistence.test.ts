import { beforeEach, describe, expect, it } from "vitest";
import { MURDOKU_CASES, loadMurdokuLevel } from "@entities/murdoku";
import {
  DEFAULT_MURDOKU_SETTINGS,
  MURDOKU_INTRO_LEVEL,
  crossedCells,
  loadMurdokuState,
  restoreMurdokuState,
  useMurdokuStore,
} from "@features/murdoku-game";

const intro = loadMurdokuLevel(MURDOKU_INTRO_LEVEL);

function resetStore(): void {
  useMurdokuStore.setState({
    puzzle: null,
    play: null,
    history: [],
    hint: null,
    hintsUsed: 0,
    clueFocus: null,
    clueFocusLabel: null,
    solvedCaseIds: new Set(),
    settings: DEFAULT_MURDOKU_SETTINGS,
  });
}

function store() {
  return useMurdokuStore.getState();
}

beforeEach(() => {
  localStorage.clear();
  resetStore();
});

describe("murdoku bewaren en hervatten", () => {
  it("bewaart de lopende zaak, de plaatsingen, de kruisjes en de hint", () => {
    store().start(intro);
    store().selectPerson("A");
    store().tapCell(1);
    store().setMode("cross");
    store().tapCell(8);
    store().showHint();

    const saved = loadMurdokuState();
    expect(saved.version).toBe(1);
    expect(saved.current?.levelId).toBe(intro.id);
    expect(saved.current?.placements).toEqual({ A: 1 });
    expect(saved.current?.crosses).toEqual([8]);
    expect(saved.current?.hintsUsed).toBe(1);
    expect(saved.current?.hint).not.toBeNull();

    const restored = restoreMurdokuState();
    expect(restored.puzzle?.id).toBe(intro.id);
    expect(restored.play?.placements.get("A")).toBe(1);
    expect(restored.play?.manualCrosses.has(8)).toBe(true);
    expect(restored.play?.mode).toBe("cross");
    expect(restored.hintsUsed).toBe(1);
    expect(restored.hint).toEqual(saved.current?.hint);
  });

  it("bewaart een opgeloste zaak in de keuzelijst", () => {
    const entry = MURDOKU_CASES[0];
    const puzzle = loadMurdokuLevel(entry.level);
    store().start(puzzle);
    for (const [person, cell] of Object.entries(entry.solution)) {
      if (person === "victim") continue;
      store().selectPerson(person);
      store().tapCell(cell);
    }
    store().check(new Map(Object.entries(entry.solution)));
    expect(store().play?.phase).toBe("solved");

    const restored = restoreMurdokuState();
    expect(restored.solvedCaseIds.has(entry.id)).toBe(true);
    expect(restored.play?.phase).toBe("solved");
    expect(restored.play?.resolution?.murdererId).toBe(store().play?.resolution?.murdererId);
    expect(loadMurdokuState().solved).toEqual([entry.id]);
  });

  it("bewaart de instellingen en laat ze een nieuwe zaak overleven", () => {
    store().setAutoCross(false);
    store().setCrossOnBlocked(true);

    expect(loadMurdokuState().settings).toEqual({ autoCross: false, crossOnBlocked: true });
    expect(restoreMurdokuState().settings).toEqual({ autoCross: false, crossOnBlocked: true });

    store().start(intro);

    expect(store().settings).toEqual({ autoCross: false, crossOnBlocked: true });
    expect(restoreMurdokuState().settings).toEqual({ autoCross: false, crossOnBlocked: true });
  });

  it("zet met de instelling een kruisje op een meubelstuk", () => {
    store().start(intro);
    store().setMode("cross");

    store().tapCell(2);
    expect(crossedCells(intro, store().play!)).not.toContain(2);

    store().setCrossOnBlocked(true);
    store().tapCell(2);
    expect(crossedCells(intro, store().play!)).toContain(2);
  });

  it("toont zonder auto-kruis alleen de kruisjes die het kind zelf zet", () => {
    store().start(intro);
    store().selectPerson("A");
    store().tapCell(1);

    expect(crossedCells(intro, store().play!, { autoCross: true }).size).toBeGreaterThan(0);
    expect(crossedCells(intro, store().play!, { autoCross: false })).toEqual(new Set());
  });

  it("begint zonder opgeslagen staat met de standaardinstellingen", () => {
    expect(store().settings).toEqual(DEFAULT_MURDOKU_SETTINGS);
    expect(store().solvedCaseIds.size).toBe(0);
  });
});
