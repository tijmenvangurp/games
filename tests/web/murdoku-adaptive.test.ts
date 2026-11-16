import { beforeEach, describe, expect, it } from "vitest";
import { MURDOKU_CASES, loadMurdokuLevel } from "@entities/murdoku";
import {
  DEFAULT_MURDOKU_SETTINGS,
  loadMurdokuState,
  restoreMurdokuState,
  useMurdokuStore,
} from "@features/murdoku-game";

const [first, second] = MURDOKU_CASES;

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
    adaptive: { levelIndex: 0, streak: 0 },
    attempts: [],
    lastRound: null,
    roundStartedAt: null,
    roundOpen: false,
  });
}

function store() {
  return useMurdokuStore.getState();
}

function startCase(entry: (typeof MURDOKU_CASES)[number]): void {
  store().start(loadMurdokuLevel(entry.level));
}

/** Vraagt hints via de gewone knop en speelt de zaak daarna uit. */
function solveCase(entry: (typeof MURDOKU_CASES)[number], hints: number): void {
  startCase(entry);
  for (let index = 0; index < hints; index++) {
    store().showHint();
  }
  for (const [person, cell] of Object.entries(entry.solution)) {
    if (person === "victim") continue;
    store().selectPerson(person);
    store().tapCell(cell);
  }
  store().check(new Map(Object.entries(entry.solution)));
}

beforeEach(() => {
  localStorage.clear();
  resetStore();
});

describe("het adaptieve niveau in de murdokustore", () => {
  it("gaat omhoog na een zaak met hooguit één hint", () => {
    solveCase(first, 0);

    expect(store().play?.phase).toBe("solved");
    expect(store().adaptive.levelIndex).toBe(1);
    expect(store().lastRound?.delta).toBe(1);
  });

  it("blijft staan na een zaak met twee hints", () => {
    solveCase(first, 2);

    expect(store().adaptive.levelIndex).toBe(0);
    expect(store().lastRound?.delta).toBe(0);
  });

  it("gaat omlaag na een zaak met drie hints", () => {
    useMurdokuStore.setState({ adaptive: { levelIndex: 2, streak: 0 } });
    solveCase(first, 3);

    expect(store().adaptive.levelIndex).toBe(1);
    expect(store().lastRound?.delta).toBe(-1);
  });

  it("demoot niet door een foute plaatsing of een mislukte controle", () => {
    useMurdokuStore.setState({ adaptive: { levelIndex: 2, streak: 0 } });
    startCase(first);

    // Eerst een verkeerde plek en een foute controle: dat is geen ronde.
    const puzzle = loadMurdokuLevel(first.level);
    const wrongCell = puzzle.board
      .occupiableCells()
      .find(
        (cell) =>
          cell !== first.solution.A && cell !== first.solution.B && cell !== first.solution.C,
      );
    if (wrongCell === undefined) throw new Error("geen vrij vakje in de testzaak");

    store().selectPerson("A");
    store().tapCell(first.solution.A);
    store().selectPerson("B");
    store().tapCell(first.solution.B);
    store().selectPerson("C");
    store().tapCell(wrongCell);
    store().check(new Map(Object.entries(first.solution)));

    expect(store().play?.wrongCheck).toBe(true);
    expect(store().adaptive.levelIndex).toBe(2);
    expect(store().attempts).toHaveLength(0);

    // Dezelfde zaak daarna goed oplossen zonder hints gaat één stap omhoog.
    if (store().play?.selected !== "C") store().selectPerson("C");
    store().tapCell(first.solution.C);
    store().check(new Map(Object.entries(first.solution)));

    expect(store().play?.phase).toBe("solved");
    expect(store().adaptive.levelIndex).toBe(3);
  });

  it("gaat omlaag als het kind halverwege een andere zaak kiest", () => {
    startCase(first);
    store().selectPerson("A");
    store().tapCell(first.solution.A);

    startCase(second);

    expect(store().adaptive.levelIndex).toBe(0);
    expect(store().attempts.at(-1)).toMatchObject({
      itemId: first.id,
      ok: false,
      hints: 0,
    });
  });

  it("telt een nieuwe zaak zonder voortgang niet als stoppen", () => {
    startCase(first);
    startCase(second);

    expect(store().attempts).toHaveLength(0);
    expect(store().adaptive.levelIndex).toBe(0);
  });

  it("bewaart hooguit tweehonderd pogingen", () => {
    useMurdokuStore.setState({
      attempts: Array.from({ length: 200 }, (_, index) => ({
        itemId: first.id,
        ok: true,
        at: index,
        durationMs: 0,
        hints: 0,
      })),
    });

    solveCase(first, 0);

    expect(store().attempts).toHaveLength(200);
    expect(store().attempts.at(-1)).toMatchObject({ itemId: first.id, ok: true });
  });

  it("bewaart het niveau en de pogingen lokaal met profiel local", () => {
    solveCase(first, 0);

    const saved = loadMurdokuState();
    expect(saved.profileId).toBe("local");
    expect(saved.adaptive.levelIndex).toBe(1);
    expect(saved.attempts).toHaveLength(1);
    expect(saved.attempts[0]).toMatchObject({ itemId: first.id, ok: true });

    const restored = restoreMurdokuState();
    expect(restored.adaptive.levelIndex).toBe(1);
    expect(restored.attempts).toHaveLength(1);
  });
});
