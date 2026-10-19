import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { createEmptyProgressMap } from "@entities/letter";
import { loadLetterProgress, useLetterStore } from "@features/letter-game";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useLetterStore.setState({
    round: null,
    index: 0,
    answered: false,
    correct: false,
    wrongChoices: [],
    filled: [],
    wrongLetters: [],
    progress: createEmptyProgressMap(),
    finished: false,
  });
});

afterEach(() => {
  cleanup();
});

function renderLetters() {
  const router = createAppRouter(createMemoryHistory({ initialEntries: ["/letters"] }));
  render(<App router={router} />);
  return router;
}

async function startRound() {
  fireEvent.click(await screen.findByRole("button", { name: "Start de letterronde" }));
  const round = useLetterStore.getState().round;
  if (!round) {
    throw new Error("Geen letterronde");
  }
  return round;
}

describe("letter game", () => {
  it("speelt een volledige letterronde", async () => {
    renderLetters();

    expect(
      await screen.findByRole("heading", { name: "Hoor de klank. Kies de letter." }),
    ).toBeTruthy();

    const round = await startRound();
    expect(round.questions).toHaveLength(6);

    for (let index = 0; index < round.questions.length; index += 1) {
      const question = round.questions[index];
      if (!question) {
        throw new Error("Geen vraag");
      }

      if (question.kind === "trein") {
        for (const letter of question.word.letters) {
          fireEvent.click(screen.getByRole("button", { name: `Letter ${letter}` }));
        }
      } else {
        fireEvent.click(screen.getByRole("button", { name: `Letter ${question.target}` }));
      }

      expect(useLetterStore.getState().answered).toBe(true);
      const nextLabel = index + 1 >= round.questions.length ? "Klaar" : "Volgende";
      fireEvent.click(screen.getByRole("button", { name: nextLabel }));
    }

    expect(await screen.findByRole("heading", { name: "Knap geoefend!" })).toBeTruthy();
    expect(loadLetterProgress().i.attempts).toBeGreaterThan(0);
    expect(loadLetterProgress().k.attempts).toBeGreaterThan(0);
  });

  it("geeft na twee fouten het juiste antwoord", async () => {
    renderLetters();
    const round = await startRound();
    const question = round.questions[0];
    if (!question || question.kind === "trein") {
      throw new Error("Eerste vraag is geen klankvraag");
    }

    const wrong = question.choices.filter((letter) => letter !== question.target);
    fireEvent.click(screen.getByRole("button", { name: `Letter ${wrong[0]}` }));
    expect(useLetterStore.getState().answered).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: `Letter ${wrong[1]}` }));
    expect(useLetterStore.getState().answered).toBe(true);
    expect(useLetterStore.getState().correct).toBe(false);
    expect(loadLetterProgress()[question.target].correct).toBe(0);
  });
});
