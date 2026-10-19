import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { DEFAULT_FLAG_SETTINGS, useFlagStore } from "@features/flag-game";

const STORAGE_KEY = "games.vlaggen.v1";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useFlagStore.setState({
    round: null,
    questionIndex: 0,
    wrongChoices: [],
    answered: false,
    correct: false,
    stars: 0,
    streak: 0,
    finished: false,
    settings: DEFAULT_FLAG_SETTINGS,
    best: {},
    puzzle: null,
    puzzleLoading: false,
    puzzleError: false,
  });
});

afterEach(() => {
  cleanup();
});

function renderApp() {
  const router = createAppRouter(createMemoryHistory({ initialEntries: ["/vlaggen"] }));
  render(<App router={router} />);
}

function puzzleRound() {
  const round = useFlagStore.getState().puzzle?.round;
  if (!round) {
    throw new Error("Geen puzzelronde");
  }
  return round;
}

function pieceButton(name: string) {
  return screen.getByRole("button", { name: `${name} (stuk)` });
}

function targetElement(code: string) {
  const element = document.querySelector(`[data-country="${code}"]`);
  if (!element) {
    throw new Error(`Geen kaartvlak voor ${code}`);
  }
  return element;
}

async function startPuzzle() {
  renderApp();
  fireEvent.click(await screen.findByRole("button", { name: /Kaartpuzzel/ }));
  fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

  return screen.findByTestId("puzzle-map");
}

describe("kaartpuzzel", () => {
  it("starts with a map and eight pieces", async () => {
    await startPuzzle();

    const round = puzzleRound();
    expect(round.questions).toHaveLength(8);
    expect(screen.getByText("0 van 8 geplaatst")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /\(stuk\)$/ })).toHaveLength(8);
  });

  it("places a piece on the right country and scores a star", async () => {
    await startPuzzle();
    const country = puzzleRound().questions[0]?.country;
    if (!country) {
      throw new Error("Geen land");
    }

    fireEvent.keyDown(pieceButton(country.name), { key: "Enter" });
    expect(useFlagStore.getState().puzzle?.selected).toBe(country.code);

    fireEvent.click(targetElement(country.code));

    expect(useFlagStore.getState().stars).toBe(1);
    expect(useFlagStore.getState().puzzle?.placed).toContain(country.code);
    expect(screen.getByText(`Goed! ${country.name} ligt op de juiste plek.`)).toBeTruthy();
    expect(screen.getByText("1 van 8 geplaatst")).toBeTruthy();
  });

  it("names the wrong country and costs the star", async () => {
    await startPuzzle();
    const questions = puzzleRound().questions;
    const answer = questions[0]?.country;
    const wrong = questions[1]?.country;
    if (!answer || !wrong) {
      throw new Error("Geen landen");
    }

    fireEvent.keyDown(pieceButton(answer.name), { key: "Enter" });
    fireEvent.click(targetElement(wrong.code));

    expect(useFlagStore.getState().stars).toBe(0);
    expect(useFlagStore.getState().puzzle?.placed).not.toContain(answer.code);
    expect(screen.getByText(`Dat is ${wrong.name}. Zoek ${answer.name}.`)).toBeTruthy();
  });

  it("shows the right place after two mistakes", async () => {
    await startPuzzle();
    const questions = puzzleRound().questions;
    const answer = questions[0]?.country;
    const wrongA = questions[1]?.country;
    const wrongB = questions[2]?.country;
    if (!answer || !wrongA || !wrongB) {
      throw new Error("Geen landen");
    }

    fireEvent.keyDown(pieceButton(answer.name), { key: "Enter" });
    fireEvent.click(targetElement(wrongA.code));
    fireEvent.click(targetElement(wrongB.code));

    expect(useFlagStore.getState().puzzle?.placed).toContain(answer.code);
    expect(useFlagStore.getState().stars).toBe(0);
    expect(screen.getByText(`Hier hoort ${answer.name}.`)).toBeTruthy();
  });

  it("celebrates a full round and stores the puzzle score", async () => {
    await startPuzzle();

    for (const question of puzzleRound().questions) {
      useFlagStore.getState().selectPiece(question.country.code);
      useFlagStore.getState().placePiece(question.country.code);
    }

    expect(await screen.findByRole("heading", { name: "Perfect!" })).toBeTruthy();
    expect(screen.getByText("Je haalde 8 van de 8 sterren.")).toBeTruthy();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      best?: Record<string, number>;
    };
    expect(stored.best?.["kaartpuzzel:europa:makkelijk"]).toBe(8);
  });

  it("disables the provinces and moves away from them in puzzle mode", async () => {
    useFlagStore.getState().chooseScope("nederland");
    useFlagStore.getState().chooseMode("kaartpuzzel");

    expect(useFlagStore.getState().settings.scope).toBe("europa");

    renderApp();
    const netherlands = await screen.findByRole("button", { name: /Nederland/ });
    expect((netherlands as HTMLButtonElement).disabled).toBe(true);
  });
});
