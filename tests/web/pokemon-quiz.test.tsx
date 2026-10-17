import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { getPokemon } from "@entities/pokedex";
import { DEFAULT_POKEMON_QUIZ_SETTINGS, usePokemonQuizStore } from "@features/pokemon-quiz";

const STORAGE_KEY = "games.pokemon-quiz.v1";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  usePokemonQuizStore.setState({
    question: null,
    selectedId: null,
    answered: false,
    correctCount: 0,
    rounds: 0,
    settings: DEFAULT_POKEMON_QUIZ_SETTINGS,
  });
});

afterEach(() => {
  cleanup();
});

function renderApp(path = "/raad") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

function currentQuestion() {
  const question = usePokemonQuizStore.getState().question;
  if (!question) {
    throw new Error("No quiz question");
  }
  return question;
}

function targetName(): string {
  const target = getPokemon(currentQuestion().targetId);
  if (!target) {
    throw new Error("No target Pokémon");
  }
  return target.name;
}

async function startGame(): Promise<void> {
  renderApp();
  expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Spelen" }));
  expect(await screen.findByRole("group", { name: "Kies de juiste naam" })).toBeTruthy();
}

describe("wie is deze pokémon", () => {
  it("starts with four names and accepts the correct answer", async () => {
    await startGame();

    const group = screen.getByRole("group", { name: "Kies de juiste naam" });
    expect(within(group).getAllByRole("button")).toHaveLength(4);
    expect(usePokemonQuizStore.getState().question?.optionIds).toHaveLength(4);

    const name = targetName();
    fireEvent.click(screen.getByRole("button", { name }));

    expect(usePokemonQuizStore.getState().answered).toBe(true);
    expect(usePokemonQuizStore.getState().correctCount).toBe(1);
    expect(usePokemonQuizStore.getState().rounds).toBe(1);
    expect(screen.getByText("Goed gedaan!")).toBeTruthy();
    expect(screen.getByText(`${name} is goed!`)).toBeTruthy();
    expect(screen.getByRole("img", { name })).toBeTruthy();
    expect(screen.getByRole("button", { name }).getAttribute("data-answer-state")).toBe("correct");

    const previousQuestion = currentQuestion();
    fireEvent.click(screen.getByRole("button", { name: /Volgende Pokémon/ }));
    expect(usePokemonQuizStore.getState().answered).toBe(false);
    expect(usePokemonQuizStore.getState().selectedId).toBeNull();
    expect(usePokemonQuizStore.getState().rounds).toBe(1);
    expect(currentQuestion()).not.toBe(previousQuestion);
  });

  it("marks a wrong name and reveals the right one", async () => {
    await startGame();

    const question = currentQuestion();
    const name = targetName();
    const wrong = question.optionIds
      .map((id) => getPokemon(id)?.name)
      .find((optionName): optionName is string => Boolean(optionName) && optionName !== name);
    if (!wrong) {
      throw new Error("No wrong option found");
    }

    fireEvent.click(screen.getByRole("button", { name: wrong }));

    expect(usePokemonQuizStore.getState().correctCount).toBe(0);
    expect(usePokemonQuizStore.getState().rounds).toBe(1);
    expect(screen.getByText("Bijna!")).toBeTruthy();
    expect(screen.getByText(`Het juiste antwoord is ${name}.`)).toBeTruthy();
    expect(screen.getByRole("button", { name: wrong }).getAttribute("data-answer-state")).toBe(
      "wrong",
    );
    expect(screen.getByRole("button", { name }).getAttribute("data-answer-state")).toBe("correct");
  });

  it("stores the chosen difficulty and shows five names", async () => {
    renderApp();
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Moeilijk/ }));
    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

    const group = await screen.findByRole("group", { name: "Kies de juiste naam" });
    expect(within(group).getAllByRole("button")).toHaveLength(5);
    expect(usePokemonQuizStore.getState().question?.optionIds).toHaveLength(5);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
      difficulty: "moeilijk",
    });
  });

  it("returns to the setup without losing the score", async () => {
    await startGame();
    const name = targetName();
    fireEvent.click(screen.getByRole("button", { name }));

    fireEvent.click(screen.getByRole("button", { name: "Nieuw spel" }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Terug naar je spel/ }));
    expect(await screen.findByRole("group", { name: "Kies de juiste naam" })).toBeTruthy();
    expect(usePokemonQuizStore.getState().correctCount).toBe(1);
  });
});
