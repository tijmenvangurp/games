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

async function startLesson(name: RegExp) {
  fireEvent.click(await screen.findByRole("button", { name }));
  const round = useLetterStore.getState().round;
  if (!round) {
    throw new Error("Geen ronde");
  }
  return round;
}

describe("letter game", () => {
  it("speelt een volledige letterronde", async () => {
    renderLetters();

    expect(await screen.findByRole("heading", { name: "Kies je les" })).toBeTruthy();

    const round = await startLesson(/letterronde/i);
    expect(round.lesson).toBe("letters");
    expect(round.questions).toHaveLength(6);

    for (let index = 0; index < round.questions.length; index += 1) {
      const question = round.questions[index];
      if (!question || question.kind === "lees") {
        throw new Error("Geen lettervraag");
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

  it("speelt een volledige leesronde", async () => {
    renderLetters();
    const round = await startLesson(/woordlezen/i);
    expect(round.lesson).toBe("woorden");
    expect(round.questions).toHaveLength(6);

    for (let index = 0; index < round.questions.length; index += 1) {
      const question = round.questions[index];
      if (!question || question.kind !== "lees") {
        throw new Error("Geen leesvraag");
      }

      fireEvent.click(screen.getByRole("button", { name: `Woord ${question.target.word}` }));
      expect(useLetterStore.getState().answered).toBe(true);

      const nextLabel = index + 1 >= round.questions.length ? "Klaar" : "Volgende";
      fireEvent.click(screen.getByRole("button", { name: nextLabel }));
    }

    expect(await screen.findByRole("heading", { name: "Knap gelezen!" })).toBeTruthy();
    // Woordlezen oefent lezen en raakt de lettervoortgang niet aan.
    expect(loadLetterProgress().i.attempts).toBe(0);
  });

  it("geeft na twee fouten het juiste antwoord", async () => {
    renderLetters();
    const round = await startLesson(/letterronde/i);
    const question = round.questions[0];
    if (!question || question.kind === "trein" || question.kind === "lees") {
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
