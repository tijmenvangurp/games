import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { COUNTRIES, PROVINCES, type FlagQuestion } from "@entities/geography";
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
  });
});

afterEach(() => {
  cleanup();
});

function renderApp(path = "/vlaggen") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

function nameFor(code: string): string {
  const subject = [...COUNTRIES, ...PROVINCES].find((candidate) => candidate.code === code);
  if (!subject) {
    throw new Error(`Onbekend onderwerp ${code}`);
  }
  return subject.name;
}

function currentQuestion(): FlagQuestion {
  const round = useFlagStore.getState().round;
  if (!round) {
    throw new Error("Geen ronde");
  }
  const question = round.questions[useFlagStore.getState().questionIndex];
  if (!question) {
    throw new Error("Geen vraag");
  }
  return question;
}

function clickChoice(code: string) {
  fireEvent.click(screen.getByRole("button", { name: nameFor(code) }));
}

function answerCurrentCorrectly() {
  const question = currentQuestion();
  clickChoice(question.subject.code);
  expect(useFlagStore.getState().answered).toBe(true);

  const lastQuestion =
    useFlagStore.getState().questionIndex + 1 >=
    (useFlagStore.getState().round?.questions.length ?? 0);
  fireEvent.click(screen.getByRole("button", { name: lastQuestion ? "Klaar" : "Volgende" }));
}

function playRound() {
  for (let index = 0; index < 10; index += 1) {
    answerCurrentCorrectly();
  }
}

describe("flag game", () => {
  it("plays a full round from the setup screen and scores ten stars", async () => {
    renderApp();

    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Europa/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Hele wereld/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

    expect(await screen.findByText("Vraag 1 van 10")).toBeTruthy();
    playRound();

    expect(await screen.findByRole("heading", { name: "Perfect!" })).toBeTruthy();
    expect(screen.getByText("Je haalde 10 van de 10 sterren.")).toBeTruthy();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      best?: Record<string, number>;
    };
    expect(stored.best?.["europa:makkelijk"]).toBe(10);
  });

  it("mixes both directions inside one round", async () => {
    renderApp();
    fireEvent.click(await screen.findByRole("button", { name: "Spelen" }));

    const round = useFlagStore.getState().round;
    if (!round) {
      throw new Error("Geen ronde");
    }
    const directions = round.questions.map((question) => question.direction);
    expect(directions).toContain("vlag-naar-land");
    expect(directions).toContain("land-naar-vlag");

    let seenFlagQuestion = false;
    let seenNameQuestion = false;
    for (let index = 0; index < round.questions.length; index += 1) {
      const question = currentQuestion();
      if (question.direction === "vlag-naar-land") {
        expect(screen.getByText("Welk land hoort bij deze vlag?")).toBeTruthy();
        seenFlagQuestion = true;
      } else {
        expect(screen.getByText("Welke vlag hoort bij dit land?")).toBeTruthy();
        expect(screen.getByText(question.subject.name)).toBeTruthy();
        seenNameQuestion = true;
      }
      answerCurrentCorrectly();
    }

    expect(seenFlagQuestion).toBe(true);
    expect(seenNameQuestion).toBe(true);
  });

  it("marks a wrong answer and reveals the answer after two mistakes", async () => {
    renderApp();
    fireEvent.click(await screen.findByRole("button", { name: "Spelen" }));

    const question = currentQuestion();
    const wrong = question.choices.filter((choice) => choice.code !== question.subject.code);

    clickChoice(wrong[0]!.code);
    expect(useFlagStore.getState().wrongChoices).toHaveLength(1);
    expect(useFlagStore.getState().answered).toBe(false);

    clickChoice(wrong[1]!.code);
    expect(useFlagStore.getState().answered).toBe(true);
    expect(useFlagStore.getState().correct).toBe(false);
    expect(useFlagStore.getState().stars).toBe(0);

    const expected =
      question.direction === "vlag-naar-land"
        ? `Het juiste antwoord is ${question.subject.name}.`
        : `De juiste vlag is de vlag van ${question.subject.name}.`;
    expect(screen.getByText(expected)).toBeTruthy();
    expect(await screen.findByTestId("place-map")).toBeTruthy();
  });

  it("plays only the chosen continent", async () => {
    renderApp();

    fireEvent.click(await screen.findByRole("button", { name: /Azië/ }));
    fireEvent.click(screen.getByRole("button", { name: /Moeilijk/ }));
    expect(screen.getByText("Nog geen score")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

    const round = useFlagStore.getState().round;
    if (!round) {
      throw new Error("Geen ronde");
    }
    expect(round.scope).toBe("azie");
    expect(round.level).toBe("moeilijk");
    expect(round.questions.every((question) => question.subject.region === "azie")).toBe(true);
  });

  it("plays a round with the Dutch provinces", async () => {
    renderApp();

    fireEvent.click(await screen.findByRole("button", { name: /Nederland/ }));
    expect(screen.getByText("12 provincies")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

    const round = useFlagStore.getState().round;
    if (!round) {
      throw new Error("Geen ronde");
    }
    expect(round.scope).toBe("nederland");
    expect(round.questions).toHaveLength(10);
    expect(round.questions.every((question) => question.subject.region === "nederland")).toBe(true);

    const question = currentQuestion();
    clickChoice(question.subject.code);
    expect(useFlagStore.getState().answered).toBe(true);

    expect(await screen.findByText(/ligt in Nederland/)).toBeTruthy();
    expect(await screen.findByTestId("place-map")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Volgende" }));
  });

  it("can choose another continent after a round and return to the menu", async () => {
    renderApp();
    fireEvent.click(await screen.findByRole("button", { name: "Spelen" }));
    playRound();

    expect(await screen.findByRole("heading", { name: "Perfect!" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Ander spel kiezen/ }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Terug naar het menu" }));
    expect(await screen.findByRole("heading", { name: "Spellen" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Vlaggenreis/ })).toBeTruthy();
  });
});
