import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { LESSON_ANIMAUX } from "@entities/french";
import { useFrenchQuizStore } from "@features/french-listening";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useFrenchQuizStore.getState().reset();
});

afterEach(() => {
  cleanup();
});

function renderApp(path = "/frans") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

function currentQuestion() {
  const question = useFrenchQuizStore.getState().question;
  if (!question) {
    throw new Error("Geen vraag");
  }
  return question;
}

async function startQuiz(): Promise<void> {
  renderApp();
  expect(await screen.findByRole("heading", { name: "Bonjour !" })).toBeTruthy();
  expect(await screen.findByRole("heading", { name: "Les animaux" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Start luisteroefening" }));
  expect(await screen.findByRole("group", { name: "Kies de juiste vertaling" })).toBeTruthy();
}

describe("Frans luisterspel", () => {
  it("start de quiz met vier vertalingen", async () => {
    await startQuiz();

    const group = screen.getByRole("group", { name: "Kies de juiste vertaling" });
    expect(within(group).getAllByRole("button")).toHaveLength(4);
    expect(useFrenchQuizStore.getState().queue).toHaveLength(LESSON_ANIMAUX.items.length);
    expect(currentQuestion().item.kind).toBeTypeOf("string");
    expect(useFrenchQuizStore.getState().correctCount).toBe(0);
  });

  it("accepteert het juiste antwoord en gaat verder", async () => {
    await startQuiz();

    const question = currentQuestion();
    fireEvent.click(screen.getByRole("button", { name: question.item.nl }));

    expect(useFrenchQuizStore.getState().answered).toBe(true);
    expect(useFrenchQuizStore.getState().correctCount).toBe(1);
    expect(screen.getByText("Goed gedaan!")).toBeTruthy();
    expect(screen.getByText(question.item.fr)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: question.item.nl }).getAttribute("data-answer-state"),
    ).toBe("correct");

    if (question.item.example) {
      expect(screen.getByText(question.item.example.fr)).toBeTruthy();
      expect(screen.getByText(question.item.example.nl)).toBeTruthy();
      expect(screen.getByRole("button", { name: "Beluister de voorbeeldzin" })).toBeTruthy();
    }

    fireEvent.click(screen.getByRole("button", { name: "Volgende" }));
    expect(useFrenchQuizStore.getState().answered).toBe(false);
    expect(useFrenchQuizStore.getState().selected).toBeNull();
    expect(useFrenchQuizStore.getState().index).toBe(1);
  });

  it("toont het juiste antwoord na een fout", async () => {
    await startQuiz();

    const question = currentQuestion();
    const wrong = question.options.find((option) => option !== question.item.nl);
    if (!wrong) {
      throw new Error("Geen fout antwoord");
    }

    fireEvent.click(screen.getByRole("button", { name: wrong }));

    expect(useFrenchQuizStore.getState().correctCount).toBe(0);
    expect(screen.getByText("Bijna!")).toBeTruthy();
    expect(screen.getAllByText(question.item.nl).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: wrong }).getAttribute("data-answer-state")).toBe(
      "wrong",
    );
  });

  it("oefent met flipcards", async () => {
    renderApp();
    expect(await screen.findByRole("heading", { name: "Bonjour !" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Oefen met kaarten" }));

    const card = await screen.findByRole("button", { name: /^Frans:/ });
    expect(screen.getByText("Frans")).toBeTruthy();
    fireEvent.click(card);

    expect(screen.getByText("Nederlands")).toBeTruthy();
    expect(card.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(LESSON_ANIMAUX.items[0].nl)).toBeTruthy();
    expect(screen.getByText(LESSON_ANIMAUX.items[0].example?.fr ?? "")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Beluister voorbeeldzin/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Ken ik" }));
    expect(await screen.findByText("Kaart 2 van 15")).toBeTruthy();
  });

  it("toont de eindscore na alle vragen", async () => {
    await startQuiz();

    for (let index = 0; index < LESSON_ANIMAUX.items.length; index += 1) {
      const question = currentQuestion();
      fireEvent.click(screen.getByRole("button", { name: question.item.nl }));
      fireEvent.click(screen.getByRole("button", { name: "Volgende" }));
    }

    expect(await screen.findByText("Klaar!")).toBeTruthy();
    expect(
      screen.getByText(
        `Je had ${LESSON_ANIMAUX.items.length} van ${LESSON_ANIMAUX.items.length} goed.`,
      ),
    ).toBeTruthy();
  });
});
