import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { MURDOKU_CASES, MURDOKU_LEVELS, loadMurdokuLevel } from "@entities/murdoku";
import { useMurdokuStore } from "@features/murdoku-game";

/** jsdom tekent geen canvas; de bordlaag is geen testseam. */
function silentContext(): CanvasRenderingContext2D {
  const target: Record<string, unknown> = {
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    measureText: (text: string) => ({ width: String(text).length * 6 }),
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    createRadialGradient: () => ({ addColorStop: () => undefined }),
  };
  return new Proxy(target, {
    get: (object, property: string) => (property in object ? object[property] : () => undefined),
    set: (object, property: string, value) => {
      object[property] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useMurdokuStore.setState({
    puzzle: null,
    play: null,
    history: [],
    solvedCaseIds: new Set(),
    adaptive: { levelIndex: 0, streak: 0 },
    attempts: [],
    lastRound: null,
    roundStartedAt: null,
    roundOpen: false,
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => silentContext());
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderApp(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

describe("de zaakkeuze van Wie was het?", () => {
  it("opent vanuit de speelpagina en toont de twaalf zaken", async () => {
    renderApp("/mysterie");

    fireEvent.click(await screen.findByRole("link", { name: "Kies een andere zaak" }));

    expect(await screen.findByRole("heading", { name: "Kies een zaak" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /nog niet gespeeld$/ })).toHaveLength(12);
    for (const entry of MURDOKU_CASES) {
      expect(
        screen.getByRole("button", {
          name: `${entry.title}, ${entry.level.size.width} × ${entry.level.size.height}, nog niet gespeeld`,
        }),
      ).toBeTruthy();
    }
  });

  it("start de gekozen zaak op de speelpagina", async () => {
    renderApp("/mysterie/zaken");

    const entry = MURDOKU_CASES[2];
    fireEvent.click(
      await screen.findByRole("button", {
        name: `${entry.title}, ${entry.level.size.width} × ${entry.level.size.height}, nog niet gespeeld`,
      }),
    );

    expect(
      await screen.findByRole("img", {
        name: `Plattegrond van ${entry.title}, ${entry.level.size.width} bij ${entry.level.size.height}`,
      }),
    ).toBeTruthy();
    expect(useMurdokuStore.getState().play?.levelId).toBe(entry.id);
    expect(useMurdokuStore.getState().play?.placements.size).toBe(0);
  });

  it("toont een opgeloste zaak als opgelost", async () => {
    const entry = MURDOKU_CASES[0];
    const puzzle = loadMurdokuLevel(entry.level);
    const store = useMurdokuStore.getState();
    store.start(puzzle);
    for (const [person, cell] of Object.entries(entry.solution)) {
      if (person === "victim") continue;
      useMurdokuStore.getState().selectPerson(person);
      useMurdokuStore.getState().tapCell(cell);
    }
    useMurdokuStore.getState().check(new Map(Object.entries(entry.solution)));
    expect(useMurdokuStore.getState().play?.phase).toBe("solved");

    renderApp("/mysterie/zaken");

    expect(
      await screen.findByRole("button", {
        name: `${entry.title}, ${entry.level.size.width} × ${entry.level.size.height}, opgelost`,
      }),
    ).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /nog niet gespeeld$/ })).toHaveLength(11);
  });

  it("markeert de zaak die bij het adaptieve niveau past", async () => {
    useMurdokuStore.setState({ adaptive: { levelIndex: 5, streak: 0 } });
    const entry = MURDOKU_LEVELS[5];

    renderApp("/mysterie/zaken");

    const button = await screen.findByRole("button", {
      name: `${entry.title}, ${entry.level.size.width} × ${entry.level.size.height}, nog niet gespeeld`,
    });
    expect(within(button).getByText("Past bij jou")).toBeTruthy();
    expect(screen.getAllByText("Past bij jou")).toHaveLength(1);
  });

  it("vertelt na een zaak wat het niveau doet", async () => {
    const entry = MURDOKU_CASES[0];
    const store = useMurdokuStore.getState();
    store.start(loadMurdokuLevel(entry.level));
    for (const [person, cell] of Object.entries(entry.solution)) {
      if (person === "victim") continue;
      useMurdokuStore.getState().selectPerson(person);
      useMurdokuStore.getState().tapCell(cell);
    }
    useMurdokuStore.getState().check(new Map(Object.entries(entry.solution)));

    renderApp("/mysterie");

    expect(await screen.findByText(/De volgende zaak mag een maatje groter/)).toBeTruthy();
  });

  it("telt weggaan naar de zaakkeuze als halverwege stoppen", async () => {
    useMurdokuStore.setState({ adaptive: { levelIndex: 3, streak: 0 } });
    const entry = MURDOKU_CASES[0];
    const store = useMurdokuStore.getState();
    store.start(loadMurdokuLevel(entry.level));
    store.selectPerson("A");
    store.tapCell(entry.solution.A);

    renderApp("/mysterie");
    fireEvent.click(await screen.findByRole("link", { name: "Kies een andere zaak" }));

    expect(await screen.findByRole("heading", { name: "Kies een zaak" })).toBeTruthy();
    expect(useMurdokuStore.getState().adaptive.levelIndex).toBe(2);
    expect(useMurdokuStore.getState().attempts.at(-1)).toMatchObject({
      itemId: entry.id,
      ok: false,
    });
  });
});
