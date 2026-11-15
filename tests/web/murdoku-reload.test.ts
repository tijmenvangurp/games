import { beforeEach, describe, expect, it, vi } from "vitest";
import { MURDOKU_CASES, loadMurdokuLevel } from "@entities/murdoku";
import { MURDOKU_INTRO_LEVEL, useMurdokuStore } from "@features/murdoku-game";

/**
 * Een echte herlaad: de opslag blijft staan, de modules worden opnieuw
 * geëvalueerd en de store leest de bewaarde staat bij het opstarten.
 */
async function reloadStore() {
  vi.resetModules();
  const fresh = await import("@features/murdoku-game");
  return fresh.useMurdokuStore.getState();
}

beforeEach(() => {
  localStorage.clear();
  useMurdokuStore.setState({
    puzzle: null,
    play: null,
    history: [],
    hint: null,
    hintsUsed: 0,
    solvedCaseIds: new Set(),
  });
});

describe("murdoku na herladen", () => {
  it("hervat de lopende zaak met de plaatsingen en kruisjes", async () => {
    const puzzle = loadMurdokuLevel(MURDOKU_INTRO_LEVEL);
    const store = useMurdokuStore.getState();
    store.start(puzzle);
    store.selectPerson("A");
    store.tapCell(1);
    store.setMode("cross");
    store.tapCell(8);
    store.setAutoCross(false);

    const reloaded = await reloadStore();

    expect(reloaded.puzzle?.id).toBe(puzzle.id);
    expect(reloaded.play?.levelId).toBe(puzzle.id);
    expect(reloaded.play?.placements.get("A")).toBe(1);
    expect(reloaded.play?.manualCrosses.has(8)).toBe(true);
    expect(reloaded.play?.mode).toBe("cross");
    expect(reloaded.settings.autoCross).toBe(false);
  });

  it("onthoudt de opgeloste zaken voor de zaakkeuze", async () => {
    const entry = MURDOKU_CASES[0];
    const puzzle = loadMurdokuLevel(entry.level);
    const store = useMurdokuStore.getState();
    store.start(puzzle);
    for (const [person, cell] of Object.entries(entry.solution)) {
      if (person === "victim") continue;
      store.selectPerson(person);
      store.tapCell(cell);
    }
    store.check(new Map(Object.entries(entry.solution)));
    expect(useMurdokuStore.getState().play?.phase).toBe("solved");

    const reloaded = await reloadStore();

    expect(reloaded.solvedCaseIds.has(entry.id)).toBe(true);
    expect(reloaded.play?.phase).toBe("solved");
    expect(reloaded.play?.levelId).toBe(entry.id);
  });
});
