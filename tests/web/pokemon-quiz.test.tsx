import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, "vibrate");
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

function artworkImage(): HTMLImageElement {
  const image = document.querySelector<HTMLImageElement>("img[data-revealed]");
  if (!image) {
    throw new Error("No quiz artwork");
  }
  return image;
}

function artworkLabel(): string {
  const label = document.querySelector<HTMLElement>("[data-artwork-label]");
  if (!label) {
    throw new Error("No artwork label");
  }
  return label.textContent ?? "";
}

async function startHardGame(): Promise<void> {
  renderApp();
  expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Moeilijk/ }));
  fireEvent.click(screen.getByRole("button", { name: "Spelen" }));
  expect(await screen.findByRole("group", { name: "Kies de juiste naam" })).toBeTruthy();
}

async function startMeesterGame(): Promise<void> {
  renderApp();
  expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Meester/ }));
  fireEvent.click(screen.getByRole("button", { name: "Spelen" }));
  expect(await screen.findByRole("group", { name: "Kies de juiste naam" })).toBeTruthy();
}

async function startGame(): Promise<void> {
  renderApp();
  expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Spelen" }));
  expect(await screen.findByRole("group", { name: "Kies de juiste naam" })).toBeTruthy();
}

async function startSoundGame(): Promise<void> {
  renderApp();
  expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Geluid raden/ }));
  fireEvent.click(screen.getByRole("button", { name: "Spelen" }));
  expect(await screen.findByRole("group", { name: "Kies het juiste plaatje" })).toBeTruthy();
}

async function startPictureGame(): Promise<void> {
  renderApp();
  expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Geluid kiezen/ }));
  fireEvent.click(screen.getByRole("button", { name: "Spelen" }));
  expect(await screen.findByRole("group", { name: "Kies het juiste geluid" })).toBeTruthy();
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

  it("gives haptic feedback on a correct and a wrong answer", async () => {
    const vibrate = vi.fn(() => true);
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    });

    await startGame();
    fireEvent.click(screen.getByRole("button", { name: targetName() }));
    expect(vibrate).toHaveBeenLastCalledWith([10, 30, 10]);

    fireEvent.click(screen.getByRole("button", { name: /Volgende Pokémon/ }));
    expect(vibrate).toHaveBeenLastCalledWith(10);

    const name = targetName();
    const wrong = currentQuestion()
      .optionIds.map((id) => getPokemon(id)?.name)
      .find((optionName): optionName is string => Boolean(optionName) && optionName !== name);
    if (!wrong) {
      throw new Error("No wrong option found");
    }

    fireEvent.click(screen.getByRole("button", { name: wrong }));
    expect(vibrate).toHaveBeenLastCalledWith([30, 40, 30]);
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
      mode: "naam",
    });
  });

  it("hides the name on the artwork until an answer is picked", async () => {
    await startGame();

    expect(artworkLabel()).toBe("Wie is deze Pokémon?");
    expect(artworkImage().getAttribute("alt")).toBe("");

    const name = targetName();
    fireEvent.click(screen.getByRole("button", { name }));

    expect(artworkLabel()).toBe(name);
    expect(artworkImage().getAttribute("alt")).toBe(name);
  });

  it("shows only a silhouette on hard until an answer is picked", async () => {
    await startHardGame();

    expect(artworkImage().getAttribute("data-revealed")).toBe("false");
    expect(artworkImage().getAttribute("alt")).toBe("");

    const name = targetName();
    fireEvent.click(screen.getByRole("button", { name }));

    expect(artworkImage().getAttribute("data-revealed")).toBe("true");
    expect(artworkImage().getAttribute("alt")).toBe(name);
  });

  it("reveals the artwork after a wrong hard answer", async () => {
    await startHardGame();

    const name = targetName();
    const wrong = currentQuestion()
      .optionIds.map((id) => getPokemon(id)?.name)
      .find((optionName): optionName is string => Boolean(optionName) && optionName !== name);
    if (!wrong) {
      throw new Error("No wrong option found");
    }

    fireEvent.click(screen.getByRole("button", { name: wrong }));

    expect(usePokemonQuizStore.getState().answered).toBe(true);
    expect(artworkImage().getAttribute("data-revealed")).toBe("true");
    expect(artworkImage().getAttribute("alt")).toBe(name);
    expect(screen.getByText(`Het juiste antwoord is ${name}.`)).toBeTruthy();
  });

  it("shows only a fragment of the silhouette on meester until an answer is picked", async () => {
    await startMeesterGame();

    const group = screen.getByRole("group", { name: "Kies de juiste naam" });
    expect(within(group).getAllByRole("button")).toHaveLength(5);
    expect(artworkImage().getAttribute("data-revealed")).toBe("false");
    expect(artworkImage().getAttribute("data-fragment")).toBe("true");
    expect(artworkImage().getAttribute("alt")).toBe("");
    expect(screen.getByText("Je ziet steeds een stukje…")).toBeTruthy();

    const name = targetName();
    fireEvent.click(screen.getByRole("button", { name }));

    expect(artworkImage().getAttribute("data-revealed")).toBe("true");
    expect(artworkImage().getAttribute("data-fragment")).toBe("false");
    expect(artworkImage().getAttribute("alt")).toBe(name);
    expect(usePokemonQuizStore.getState().correctCount).toBe(1);
  });

  it("plays the cry and shows picture options in sound mode", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play");
    await startSoundGame();

    expect(play).toHaveBeenCalled();

    const question = currentQuestion();
    const group = screen.getByRole("group", { name: "Kies het juiste plaatje" });
    expect(question.mode).toBe("geluid");
    expect(within(group).getAllByRole("button")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Speel het geluid opnieuw" })).toBeTruthy();
    expect(screen.getByText("Welke Pokémon hoor je?")).toBeTruthy();
    expect(document.querySelector("img[data-revealed]")).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
      difficulty: "gemiddeld",
      mode: "geluid",
    });

    const targetButton = group.querySelector<HTMLButtonElement>(
      `[data-pokemon-id="${question.targetId}"]`,
    );
    if (!targetButton) {
      throw new Error("No target picture found");
    }
    fireEvent.click(targetButton);

    expect(usePokemonQuizStore.getState().answered).toBe(true);
    expect(usePokemonQuizStore.getState().correctCount).toBe(1);
    expect(screen.getByRole("img", { name: targetName() })).toBeTruthy();
    expect(screen.getByText(`${targetName()} is goed!`)).toBeTruthy();
    expect(targetButton.getAttribute("data-answer-state")).toBe("correct");
  });

  it("reveals the target picture after a wrong sound answer", async () => {
    await startSoundGame();

    const question = currentQuestion();
    const group = screen.getByRole("group", { name: "Kies het juiste plaatje" });
    const wrongButton = Array.from(
      group.querySelectorAll<HTMLButtonElement>("[data-pokemon-id]"),
    ).find((button) => button.dataset.pokemonId !== String(question.targetId));
    if (!wrongButton) {
      throw new Error("No wrong picture found");
    }

    fireEvent.click(wrongButton);

    expect(usePokemonQuizStore.getState().correctCount).toBe(0);
    expect(screen.getByText("Bijna!")).toBeTruthy();
    expect(screen.getByText(`Het juiste antwoord is ${targetName()}.`)).toBeTruthy();
    expect(screen.getByRole("img", { name: targetName() })).toBeTruthy();
    expect(wrongButton.getAttribute("data-answer-state")).toBe("wrong");
    expect(group.querySelector('[data-answer-state="correct"]')).toBeTruthy();
  });

  it("shows the artwork and lets the player preview and choose a cry", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play");
    await startPictureGame();

    const question = currentQuestion();
    const name = targetName();
    expect(question.mode).toBe("plaatje");
    expect(artworkImage().getAttribute("data-revealed")).toBe("true");
    expect(artworkImage().getAttribute("alt")).toBe("");

    const group = screen.getByRole("group", { name: "Kies het juiste geluid" });
    expect(group.querySelectorAll("[data-pokemon-id]")).toHaveLength(4);
    expect(play).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Beluister geluid A" }));
    expect(play).toHaveBeenCalled();
    expect(usePokemonQuizStore.getState().answered).toBe(false);

    const targetIndex = question.optionIds.indexOf(question.targetId);
    const letter = "ABCDE"[targetIndex];
    fireEvent.click(screen.getByRole("button", { name: `Kies geluid ${letter}` }));

    expect(usePokemonQuizStore.getState().correctCount).toBe(1);
    expect(screen.getByText(`${name} is goed!`)).toBeTruthy();
    expect(
      group
        .querySelector(`[data-pokemon-id="${question.targetId}"]`)
        ?.getAttribute("data-answer-state"),
    ).toBe("correct");
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
