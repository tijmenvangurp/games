import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { createGame, playTurn } from "@entities/ganzenbord";
import { DEFAULT_SETTINGS, loadGanzenbordState, useGanzenbordStore } from "@features/ganzenbord";

const EMPTY_WINS = { one: 0, two: 0, three: 0, four: 0 } as const;

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useGanzenbordStore.setState({
    settings: DEFAULT_SETTINGS,
    wins: EMPTY_WINS,
    game: null,
    rolling: false,
    pendingDice: null,
    events: [],
  });
});

afterEach(() => {
  cleanup();
  useGanzenbordStore.getState().cancelRoll();
});

function renderApp(path = "/ganzenbord") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

async function openSetup(path = "/ganzenbord") {
  renderApp(path);
  expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
}

function startGame() {
  fireEvent.click(screen.getByRole("button", { name: "Spelen" }));
}

function rollButton() {
  return screen.getByRole("button", { name: "Gooi met de dobbelstenen" });
}

function finishAnimation() {
  act(() => {
    let guard = 0;
    while (useGanzenbordStore.getState().animation && guard < 200) {
      useGanzenbordStore.getState().advanceAnimation();
      guard += 1;
    }
  });
}

describe("ganzenbord", () => {
  it("is vanuit het menu te openen en toont het bord", async () => {
    renderApp("/");

    fireEvent.click(await screen.findByRole("link", { name: /ganzenbord/i }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
    expect(screen.getByText(/Kies per speler/)).toBeTruthy();

    startGame();

    expect(screen.getByRole("img", { name: /Ganzenbord met 63 vakjes/ })).toBeTruthy();
    expect(screen.getByText("Speler 1")).toBeTruthy();
    expect(screen.getByText("Speler 2")).toBeTruthy();
    expect(rollButton().hasAttribute("disabled")).toBe(false);
  });

  it("laat een mens gooien en de beurt wisselen", async () => {
    await openSetup();
    startGame();

    fireEvent.click(rollButton());

    expect(useGanzenbordStore.getState().rolling).toBe(true);
    expect(await screen.findByText(/Speler 2 is aan de beurt/, {}, { timeout: 6000 })).toBeTruthy();

    const game = useGanzenbordStore.getState().game;
    expect(game?.lastRoll?.player).toBe("one");
    expect(game?.current).toBe("two");
    expect(game?.players[0]?.position).toBeGreaterThanOrEqual(2);
    expect(rollButton().hasAttribute("disabled")).toBe(false);
  });

  it("laat de computer automatisch gooien", async () => {
    await openSetup();
    fireEvent.click(screen.getByRole("button", { name: "Speler 2: computer" }));
    startGame();

    expect(screen.getByText("CPU 2")).toBeTruthy();
    fireEvent.click(rollButton());

    await waitFor(
      () => {
        expect(useGanzenbordStore.getState().game?.lastRoll?.player).toBe("two");
      },
      { timeout: 9000 },
    );
    expect(useGanzenbordStore.getState().game?.current).toBe("one");
  }, 15_000);

  it("ondersteunt vier spelers met eigen keuzes", async () => {
    await openSetup();
    fireEvent.click(screen.getByRole("button", { name: "4 spelers" }));
    fireEvent.click(screen.getByRole("button", { name: "Speler 3: computer" }));
    fireEvent.click(screen.getByRole("button", { name: "Speler 4: computer" }));

    expect(useGanzenbordStore.getState().settings.playerCount).toBe(4);
    startGame();

    expect(screen.getByText("Speler 1")).toBeTruthy();
    expect(screen.getByText("Speler 2")).toBeTruthy();
    expect(screen.getByText("CPU 3")).toBeTruthy();
    expect(screen.getByText("CPU 4")).toBeTruthy();
    expect(within(screen.getByLabelText("Spelers")).getAllByRole("listitem")).toHaveLength(4);
  });

  it("bewaart de instellingen", async () => {
    await openSetup();
    fireEvent.click(screen.getByRole("button", { name: "3 spelers" }));
    fireEvent.click(screen.getByRole("button", { name: "Speler 2: computer" }));

    expect(loadGanzenbordState().settings).toMatchObject({
      playerCount: 3,
      controllers: { one: "human", two: "computer" },
    });
  });

  it("toont de uitslag en bewaart de stand", async () => {
    await openSetup();
    startGame();

    const game = createGame(
      [
        { id: "one", controller: "human" },
        { id: "two", controller: "human" },
      ],
      "one",
    );
    const withOneAt61 = {
      ...game,
      players: game.players.map((player) =>
        player.id === "one" ? { ...player, position: 61, firstRollDone: true } : player,
      ),
    };
    useGanzenbordStore.setState({ game: withOneAt61 });

    useGanzenbordStore.getState().commitRoll([1, 1]);
    finishAnimation();

    expect(useGanzenbordStore.getState().game?.winner).toBe("one");
    expect(useGanzenbordStore.getState().wins.one).toBe(1);
    expect(
      await screen.findByRole("heading", { name: "Speler 1 wint!" }, { timeout: 3000 }),
    ).toBeTruthy();
    expect(loadGanzenbordState().wins.one).toBe(1);
  });

  it("past de put en de aflosregel toe in de engine", () => {
    const game = createGame([
      { id: "one", controller: "human" },
      { id: "two", controller: "human" },
    ]);
    const first = playTurn(
      {
        ...game,
        players: game.players.map((player) =>
          player.id === "one" ? { ...player, position: 20, firstRollDone: true } : player,
        ),
      },
      [5, 6],
    );

    expect(first.game.players[0]?.stuckOn).toBe(31);
    expect(first.game.current).toBe("two");
  });
});
