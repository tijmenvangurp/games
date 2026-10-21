import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import type { MathQuestion, MathRound } from "@entities/math";
import { DEFAULT_MATH_SETTINGS, loadMathState, useMathStore } from "@features/math-trainer";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useMathStore.setState({
    round: null,
    questionIndex: 0,
    wrongChoices: [],
    answered: false,
    correct: false,
    stars: 0,
    streak: 0,
    finished: false,
    settings: DEFAULT_MATH_SETTINGS,
    best: {},
  });
});

afterEach(() => {
  cleanup();
});

function renderApp(path = "/rekenen") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

function currentRound(): MathRound {
  const round = useMathStore.getState().round;
  if (!round) {
    throw new Error("No math round");
  }
  return round;
}

function currentQuestion(): MathQuestion {
  const round = currentRound();
  const question = round.questions[useMathStore.getState().questionIndex];
  if (!question) {
    throw new Error("No math question");
  }
  return question;
}

function clickAnswer(value: number) {
  fireEvent.click(screen.getByRole("button", { name: `Antwoord ${value}` }));
}

function answerCurrentCorrectly() {
  const question = currentQuestion();
  clickAnswer(question.answer);
  expect(useMathStore.getState().answered).toBe(true);
  expect(screen.getByText("Goed gerekend!")).toBeTruthy();
}

function advanceRound() {
  const round = currentRound();
  const isLast = useMathStore.getState().questionIndex + 1 >= round.questions.length;
  fireEvent.click(screen.getByRole("button", { name: isLast ? "Klaar" : "Volgende" }));
}

function playRoundCorrectly() {
  const round = currentRound();
  for (let index = 0; index < round.questions.length; index += 1) {
    answerCurrentCorrectly();
    advanceRound();
  }
}

describe("math trainer", () => {
  it("plays a complete round and stores the best score", async () => {
    renderApp();

    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Keer/ }));
    fireEvent.click(screen.getByRole("button", { name: /Gemiddeld/ }));
    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

    const round = currentRound();
    expect(round.mode).toBe("keer");
    expect(round.level).toBe("gemiddeld");
    expect(round.questions).toHaveLength(10);

    playRoundCorrectly();

    expect(useMathStore.getState().stars).toBe(10);
    expect(await screen.findByRole("heading", { name: "Je bleef scherp!" })).toBeTruthy();
    expect(screen.getByText("Je haalde 10 van de 10 sterren.")).toBeTruthy();
    expect(loadMathState().best["keer:gemiddeld"]).toBe(10);

    fireEvent.click(screen.getByRole("button", { name: /Nog een keer/ }));
    expect(screen.queryByRole("heading", { name: "Je bleef scherp!" })).toBeNull();
    expect(useMathStore.getState().finished).toBe(false);
    expect(useMathStore.getState().stars).toBe(0);
    expect(useMathStore.getState().round).not.toBe(round);
  });

  it("gives one retry and explains the answer", async () => {
    renderApp();
    fireEvent.click(await screen.findByRole("button", { name: /Optellen/ }));
    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

    const question = currentQuestion();
    const wrong = question.choices.find((choice) => choice !== question.answer);
    if (wrong === undefined) {
      throw new Error("No wrong choice");
    }

    clickAnswer(wrong);
    expect(useMathStore.getState().answered).toBe(false);
    expect(useMathStore.getState().wrongChoices).toEqual([wrong]);
    expect(screen.getByText("Bijna! Probeer nog één keer.")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: `Antwoord ${wrong}` }) as HTMLButtonElement).disabled,
    ).toBe(true);

    clickAnswer(question.answer);
    expect(useMathStore.getState().answered).toBe(true);
    expect(useMathStore.getState().correct).toBe(true);
    expect(useMathStore.getState().stars).toBe(0);
    expect(screen.getByText("Goed gerekend!")).toBeTruthy();
    expect(screen.getByText(/Tel verder vanaf/)).toBeTruthy();
  });

  it("shows a division as quotient groups of the divisor", async () => {
    useMathStore.setState({
      round: {
        mode: "deel",
        level: "makkelijk",
        seed: 1,
        questions: [
          {
            id: 0,
            mode: "deel",
            level: "makkelijk",
            left: 15,
            right: 5,
            answer: 3,
            prompt: "15 ÷ 5",
            choices: [3, 4, 6],
          },
        ],
      },
      questionIndex: 0,
    });
    renderApp();
    await screen.findByText(/Som 1 van 1/);

    clickAnswer(3);

    expect(screen.getByText("3 groepjes van 5")).toBeTruthy();
    expect(screen.queryByText("5 groepjes van 3")).toBeNull();
    expect(screen.getByText("15 ÷ 5 = 3. Dat zijn 3 groepjes van 5.")).toBeTruthy();
  });

  it("can open the setup again and return to the round", async () => {
    renderApp();
    fireEvent.click(await screen.findByRole("button", { name: "Spelen" }));
    await screen.findByText(/Som 1 van 10/);

    fireEvent.click(screen.getByRole("button", { name: "Nieuw spel" }));
    expect(await screen.findByRole("heading", { name: "Nieuw spel" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Terug naar je sommen/ }));
    expect(await screen.findByText(/Som 1 van 10/)).toBeTruthy();
  });
});
