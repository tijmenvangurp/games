import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { createGame, type GanzenbordGame } from "@entities/ganzenbord";
import { fourInARowLabels } from "@entities/four-in-a-row";
import type { MemoryScene } from "@entities/memory";
import { getPokemon } from "@entities/pokedex";
import {
  DEFAULT_SETTINGS as FOUR_SETTINGS,
  useFourInARowStore,
} from "@features/four-in-a-row-game";
import { DEFAULT_SETTINGS as GOOSE_SETTINGS, useGanzenbordStore } from "@features/ganzenbord";
import { DEFAULT_MEMORY_SETTINGS, useMemoryStore } from "@features/memory-game";
import { DEFAULT_POKEMON_QUIZ_SETTINGS, usePokemonQuizStore } from "@features/pokemon-quiz";
import { setLanguage, type Texts } from "@shared/i18n";
import { pokedexTexts } from "../../libs/entities/pokedex/ui/texts";
import { memoryTexts } from "../../libs/features/memory-game/model/texts";
import { pokemonQuizTexts } from "../../libs/features/pokemon-quiz/model/texts";
import { fourInARowTexts } from "../../libs/features/four-in-a-row-game/model/texts";
import {
  eventMessage,
  positionText,
  statusHint,
  turnText,
  winnerDescription,
  winnerTitle,
} from "../../libs/features/ganzenbord/model/presentation";
import { ganzenbordTexts, ganzenbordUiTexts } from "../../libs/features/ganzenbord/model/texts";
import { memoryPageTexts } from "../../libs/pages/memory/ui/texts";
import { pokemonQuizPageTexts } from "../../libs/pages/pokemon-quiz/ui/texts";
import { fourInARowPageTexts } from "../../libs/pages/four-in-a-row/ui/texts";
import { ganzenbordPageTexts } from "../../libs/pages/ganzenbord/ui/texts";

function resetStores() {
  useMemoryStore.setState({
    scene: null,
    matched: [],
    flipped: [],
    locked: false,
    moves: 0,
    found: false,
    settings: DEFAULT_MEMORY_SETTINGS,
    review: {},
    attempts: [],
    outcomes: [],
    boardHints: 0,
    invalidTaps: 0,
    seen: [],
    firstFlipAt: null,
    pairHints: 0,
    hint: null,
    isChallenge: false,
    lastRound: null,
  });
  usePokemonQuizStore.setState({
    question: null,
    selectedId: null,
    answered: false,
    correctCount: 0,
    rounds: 0,
    settings: DEFAULT_POKEMON_QUIZ_SETTINGS,
  });
  useFourInARowStore.setState({
    settings: FOUR_SETTINGS,
    score: { one: 0, two: 0 },
    game: null,
    match: null,
  });
  useGanzenbordStore.setState({
    settings: GOOSE_SETTINGS,
    wins: { one: 0, two: 0, three: 0, four: 0 },
    game: null,
    rolling: false,
    pendingDice: null,
    animation: null,
    events: [],
  });
}

function resetToDutch() {
  act(() => setLanguage("nl"));
  localStorage.clear();
}

beforeEach(() => {
  cleanup();
  resetToDutch();
  resetStores();
  act(() => setLanguage("en"));
});

afterEach(() => {
  cleanup();
  useGanzenbordStore.getState().cancelRoll();
  resetToDutch();
});

function renderApp(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

async function openSetup(path: string) {
  renderApp(path);
  expect(await screen.findByRole("heading", { name: "New game" })).toBeTruthy();
}

function play() {
  fireEvent.click(screen.getByRole("button", { name: "Play" }));
}

/** Roept elke tekstfunctie aan, zodat ook de Engelse kant echt tekst oplevert. */
function collectTexts(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (typeof value === "function") {
    const args = Array.from({ length: value.length }, () => "3");
    return collectTexts((value as (...input: string[]) => unknown)(...args));
  }
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectTexts);
  }
  return [];
}

function shape(value: unknown): unknown {
  if (typeof value === "function") {
    return `fn${value.length}`;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape(item)]));
  }
  return typeof value;
}

type MemoryPair = readonly [id: number, indices: readonly number[]];

/** De kaartposities per Pokémon, in de volgorde waarin ze op het bord liggen. */
function memoryPairs(): MemoryPair[] {
  const scene = useMemoryStore.getState().scene as MemoryScene;
  const byId = new Map<number, number[]>();
  scene.cards.forEach((id, index) => byId.set(id, [...(byId.get(id) ?? []), index]));
  return [...byId.entries()];
}

function pairAt(pairs: readonly MemoryPair[], index: number): MemoryPair {
  return pairs[index] ?? [0, []];
}

function flipCard(index: number | undefined) {
  fireEvent.click(
    document.querySelector<HTMLElement>(`[data-card-index="${index ?? 0}"]`) as HTMLElement,
  );
}

function flipPair(indices: readonly number[]) {
  flipCard(indices[0]);
  flipCard(indices[1]);
}

function flipRemainingPairs(pairs: readonly MemoryPair[]) {
  pairs.slice(1).forEach(([, indices]) => flipPair(indices));
}

function pokemonName(id: number | undefined): string {
  return getPokemon(id ?? 0)?.name ?? "";
}

/** De naam van de Pokémon die nu geraden moet worden. */
function quizTargetName(): string {
  return pokemonName(usePokemonQuizStore.getState().question?.targetId);
}

/** Een fout antwoord uit de huidige vraag. */
function quizWrongName(name: string): string | undefined {
  return usePokemonQuizStore
    .getState()
    .question?.optionIds.map((id) => getPokemon(id)?.name)
    .find((option): option is string => Boolean(option) && option !== name);
}

const ALL_TEXTS: Record<string, Texts<unknown>> = {
  pokedexTexts,
  memoryTexts,
  memoryPageTexts,
  pokemonQuizTexts,
  pokemonQuizPageTexts,
  fourInARowLabels,
  fourInARowTexts,
  fourInARowPageTexts,
  ganzenbordTexts,
  ganzenbordUiTexts,
  ganzenbordPageTexts,
};

describe("Engelse teksten van Memory, Pokémon-quiz, Vier op een Rij en Ganzenbord", () => {
  it("heeft voor elke Nederlandse tekst een Engelse tekst", () => {
    for (const [name, texts] of Object.entries(ALL_TEXTS)) {
      expect(shape(texts.en), name).toEqual(shape(texts.nl));
      const english = collectTexts(texts.en);
      expect(english.length, name).toBeGreaterThan(0);
      for (const text of english) {
        expect(text.trim().length, name).toBeGreaterThan(0);
      }
      expect(english, name).not.toEqual(collectTexts(texts.nl));
    }
  });

  it("speelt Pokémon Memory in het Engels", async () => {
    await openSetup("/memory");

    expect(screen.getByRole("heading", { name: "Pokémon Memory" })).toBeTruthy();
    expect(screen.getByText("How do you pick the level?")).toBeTruthy();
    expect(screen.getByText("You start with 6 pairs.")).toBeTruthy();
    expect(screen.getByText("Sources and credits")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Choose yourself/ }));
    expect(screen.getByText("Number of pairs")).toBeTruthy();
    expect(screen.getByRole("button", { name: /4 pairs/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Grows with you/ }));

    play();
    expect((await screen.findAllByRole("button", { name: "Face-down card" })).length).toBe(12);
    expect(screen.getByText("Find all the pairs")).toBeTruthy();
    expect(screen.getByText("0 of 6 pairs · grows with you")).toBeTruthy();
    expect(screen.getByText("6 pairs · grows with you")).toBeTruthy();
    expect(screen.getByText("Take your time and keep looking.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Challenge" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Again" })).toBeTruthy();

    const pairs = memoryPairs();

    const [firstId, firstPair] = pairAt(pairs, 0);
    flipPair(firstPair);
    expect(screen.getAllByRole("button", { name: `${pokemonName(firstId)}, found` })).toHaveLength(
      2,
    );
    expect(screen.getByText("Tries so far: 1.")).toBeTruthy();

    flipCard(pairAt(pairs, 1)[1][0]);
    flipCard(pairAt(pairs, 2)[1][0]);
    expect(screen.getByText("Not yet. The cards will turn back in a moment.")).toBeTruthy();
    await waitFor(() => expect(useMemoryStore.getState().locked).toBe(false), { timeout: 3000 });

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(screen.getByText("Look at the cards with the yellow border.")).toBeTruthy();

    flipRemainingPairs(pairs);
    expect(await screen.findByRole("heading", { name: "You found all the Pokémon!" })).toBeTruthy();
  });

  it("speelt Wie is deze Pokémon? in het Engels", async () => {
    await openSetup("/raad");

    expect(screen.getByRole("heading", { name: "Who's that Pokémon?" })).toBeTruthy();
    expect(screen.getByText("Difficulty")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Medium/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Master/ }));

    play();
    const group = await screen.findByRole("group", { name: "Choose the right name" });
    expect(within(group).getAllByRole("button")).toHaveLength(5);
    expect(screen.getByText("master · 5 names")).toBeTruthy();
    expect(screen.getByText("You only see a little piece…")).toBeTruthy();
    expect(screen.getByText("Choose a name.")).toBeTruthy();
    expect(screen.getByText("0 of 0 correct")).toBeTruthy();
    expect(screen.getByText("rounds")).toBeTruthy();

    const name = quizTargetName();
    fireEvent.click(screen.getByRole("button", { name: quizWrongName(name) }));

    expect(screen.getByText("Not quite.")).toBeTruthy();
    expect(screen.getByText(`The right answer is ${name}.`)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Next Pokémon/ }));

    const next = quizTargetName();
    fireEvent.click(screen.getByRole("button", { name: next }));
    expect(screen.getByText(`It's ${next}.`)).toBeTruthy();
    expect(screen.getByText("1 of 2 correct")).toBeTruthy();
  });

  it("speelt Vier op een Rij in het Engels", async () => {
    await openSetup("/vier-op-een-rij");

    expect(screen.getByRole("heading", { name: "Four in a Row" })).toBeTruthy();
    expect(screen.getByText("Opponent")).toBeTruthy();
    expect(screen.getByText("Board size")).toBeTruthy();
    expect(screen.getByText("Large board 7 × 6")).toBeTruthy();
    expect(screen.getByText("Score: Blue 0 – Red 0")).toBeTruthy();
    expect(screen.getByText("First turn this game: Blue.")).toBeTruthy();
    expect(screen.getByText("The loser starts the next game.")).toBeTruthy();

    play();
    expect(screen.getByRole("group", { name: "Game board" })).toBeTruthy();
    expect(screen.getByText("First turn: Blue. Tap a column to drop your disc.")).toBeTruthy();
    expect(screen.getAllByLabelText("0 games won")).toHaveLength(2);

    const column = (number: number) =>
      fireEvent.click(screen.getByRole("button", { name: `Column ${number}` }));
    column(1);
    expect(screen.getByText("It's Red's turn.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByText(/First turn: Blue\./)).toBeTruthy();

    for (const number of [1, 2, 1, 2, 1, 2, 1]) {
      column(number);
    }
    expect(screen.getByText("Blue got four in a row!")).toBeTruthy();
    expect(
      await screen.findByRole("heading", { name: "Blue wins!" }, { timeout: 3000 }),
    ).toBeTruthy();
    expect(screen.getByText("Four in a row! The score is now Blue 1 – Red 0.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Other board size/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /One more game/ }));
    expect(screen.queryByRole("heading", { name: "Blue wins!" })).toBeNull();
  });

  it("speelt Vier op een Rij tegen de computer in het Engels", async () => {
    await openSetup("/vier-op-een-rij");

    fireEvent.click(screen.getByRole("button", { name: "Computer" }));
    expect(screen.getByText("Computer level")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hard" })).toBeTruthy();
    expect(screen.getByText("First turn this game: You.")).toBeTruthy();
    expect(screen.getByText("You start every game against the computer.")).toBeTruthy();

    play();
    fireEvent.click(screen.getByRole("button", { name: "Column 4" }));
    expect(screen.getByText("The computer is thinking…")).toBeTruthy();
    expect(await screen.findByText("It's your turn.", {}, { timeout: 3000 })).toBeTruthy();
  });

  it("speelt Ganzenbord in het Engels", async () => {
    await openSetup("/ganzenbord");

    expect(screen.getByRole("heading", { name: "Game of the Goose" })).toBeTruthy();
    expect(screen.getByText("Who's playing?")).toBeTruthy();
    expect(screen.getAllByText("2 players")).toHaveLength(2);
    expect(screen.getByText(/Player 1 goes first/)).toBeTruthy();
    expect(screen.getByText("Rules")).toBeTruthy();
    expect(screen.getByText("Bridge (6):")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Adjust the board" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Player 2: computer" }));
    const input = screen.getByLabelText("Name of player 2") as HTMLInputElement;
    expect(input.placeholder).toBe("Computer 2");
    fireEvent.click(screen.getByRole("button", { name: "Player 2: human" }));
    fireEvent.click(
      within(screen.getByRole("group", { name: "Colour of player 1" })).getByRole("button", {
        name: "Purple",
      }),
    );

    play();
    expect(
      screen.getByRole("img", { name: /Game of the Goose board with 63 squares/ }),
    ).toBeTruthy();
    expect(screen.getByRole("img", { name: /Player 1: at the start/ })).toBeTruthy();
    expect(within(screen.getByLabelText("Players")).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByText("· Human")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Roll the dice" }).textContent).toContain("Roll!");
    expect(screen.getAllByText("It's Player 1's turn.").length).toBeGreaterThan(0);

    const game = useGanzenbordStore.getState().game as GanzenbordGame;
    useGanzenbordStore.setState({
      game: {
        ...game,
        players: game.players.map((player) =>
          player.id === "one" ? { ...player, position: 3, firstRollDone: true } : player,
        ),
      },
    });
    act(() => useGanzenbordStore.getState().commitRoll([1, 2]));
    expect(screen.getByText("Player 1 rolls 1 + 2 = 3.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Roll the dice" }).textContent).toContain("Moving…");

    const step = () => {
      const animation = useGanzenbordStore.getState().animation;
      return animation?.steps[animation.index];
    };
    act(() => {
      let guard = 0;
      while (step() && step()?.event?.kind !== "bridge" && guard < 50) {
        useGanzenbordStore.getState().advanceAnimation();
        guard += 1;
      }
    });
    expect(screen.getByRole("heading", { name: "The bridge" })).toBeTruthy();
    expect(screen.getAllByText("Bridge: on to 12.").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    act(() => {
      let guard = 0;
      while (useGanzenbordStore.getState().animation && guard < 50) {
        useGanzenbordStore.getState().advanceAnimation();
        guard += 1;
      }
    });
    expect(screen.getByText("Player 1 rolls 1 + 2 = 3. Bridge: on to 12.")).toBeTruthy();
    expect(screen.getByText("Square 12")).toBeTruthy();
  });

  it("gebruikt het enkelvoud bij één gewonnen partij", () => {
    expect(fourInARowTexts.en.wins(1)).toBe("1 game won");
    expect(fourInARowTexts.en.wins(2)).toBe("2 games won");
    expect(ganzenbordUiTexts.en.winsCount(1)).toBe("1 game won");
    expect(ganzenbordUiTexts.en.winsCount(2)).toBe("2 games won");
  });

  it("geeft Ganzenbordberichten in het Engels", () => {
    const game = createGame(
      [
        { id: "one", controller: "human" },
        { id: "two", controller: "computer" },
      ],
      "two",
    );
    const [one, two] = game.players;
    if (!one || !two) {
      throw new Error("Geen spelers");
    }

    expect(positionText({ ...one, position: 12 })).toBe("Square 12");
    expect(positionText({ ...one, stuckOn: 31 })).toBe("Stuck in the well");
    expect(statusHint(game)).toBe("Computer 2 is about to roll…");
    expect(eventMessage(game, { kind: "inn", player: "one" })).toBe("Inn: miss one turn.");
    expect(eventMessage(game, { kind: "goose", player: "one", to: 18 })).toBe("Goose! On to 18.");
    expect(eventMessage(game, { kind: "move", player: "one" })).toBeNull();
    expect(turnText(game, [])).toBe("It's Computer 2's turn.");

    const won = { ...game, status: "finished" as const, winner: "one" as const };
    expect(winnerTitle(won)).toBe("Player 1 wins!");
    expect(winnerDescription(won)).toBe("Player 1 was the first to reach square 63.");
    const draw = { ...game, status: "draw" as const };
    expect(winnerTitle(draw)).toBe("It's a draw!");
    expect(turnText(draw, [])).toBe("Draw: everyone is stuck.");
  });
});
