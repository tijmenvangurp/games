import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { allFrenchItems, LESSON_ANIMAUX, localizeLesson } from "@entities/french";
import { createEmptyProgressMap, type LetterLesson } from "@entities/letter";
import { currentTarget, emptyProgress, wordsFor } from "@entities/typepret";
import { wordSearchWords, type WordSearchPuzzle } from "@entities/word-search";
import { useFrenchProgressStore, useFrenchQuizStore } from "@features/french-listening";
import { useLetterStore } from "@features/letter-game";
import { useTypepretStore } from "@features/typepret";
import { DEFAULT_WORD_SEARCH_SETTINGS, useWordSearchStore } from "@features/word-search";
import { setLanguage } from "@shared/i18n";

function resetToDutch() {
  act(() => setLanguage("nl"));
  localStorage.clear();
}

beforeEach(() => {
  cleanup();
  resetToDutch();
  useTypepretStore.setState({
    progress: emptyProgress(),
    lessonId: null,
    round: null,
    result: null,
  });
  useWordSearchStore.setState({
    puzzle: null,
    found: [],
    lastFound: null,
    selected: [],
    dragStart: null,
    wrong: false,
    hint: null,
    settings: DEFAULT_WORD_SEARCH_SETTINGS,
  });
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
  useFrenchQuizStore.getState().reset();
  useFrenchProgressStore.getState().reset();
  act(() => setLanguage("en"));
});

afterEach(() => {
  cleanup();
  resetToDutch();
});

function renderApp(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

describe("Typing Fun in English", () => {
  function press(key: string) {
    act(() => {
      fireEvent.keyDown(document.body, { key });
    });
  }

  function target(): string {
    const round = useTypepretStore.getState().round;
    return round ? (currentTarget(round) ?? "") : "";
  }

  it("plays a round with English lessons, fingers and feedback", async () => {
    renderApp("/typepret");

    expect(await screen.findByRole("heading", { name: "Choose your lesson" })).toBeTruthy();
    expect(screen.getByText("Learn to touch type")).toBeTruthy();
    expect(screen.getByText(/8 lessons · 20 keys per round/)).toBeTruthy();
    expect(screen.getAllByText("· still locked")).toHaveLength(7);
    fireEvent.click(screen.getByRole("button", { name: /F and J/ }));

    expect(await screen.findByRole("group", { name: "Type these letters" })).toBeTruthy();
    expect(screen.getByText("F and J · 20 keys")).toBeTruthy();
    expect(screen.getByText(/Use your (left|right) index finger/)).toBeTruthy();
    expect(screen.getByText(/Feel the little bumps on F and J/)).toBeTruthy();

    const first = target();
    press(first === "f" ? "j" : "f");
    expect(screen.getByText(/Try again: (left|right) index finger/)).toBeTruthy();

    for (let count = 0; count < 20; count += 1) {
      press(target());
    }

    expect(await screen.findByText("Well practised!")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Another round" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Other lesson" }));
    expect(await screen.findByText("· done")).toBeTruthy();
  });

  it("practises English words in the word lessons", () => {
    useTypepretStore.getState().start("woorden-2");
    const round = useTypepretStore.getState().round;
    expect(round?.round.groups.every((word) => wordsFor("en").includes(word))).toBe(true);
  });
});

describe("Word Search in English", () => {
  function currentPuzzle(): WordSearchPuzzle {
    const puzzle = useWordSearchStore.getState().puzzle;
    if (!puzzle) {
      throw new Error("No puzzle");
    }
    return puzzle;
  }

  it("uses English themes, words and feedback", async () => {
    renderApp("/woordzoeker");

    expect(await screen.findByRole("group", { name: "Difficulty" })).toBeTruthy();
    expect(screen.getByText("Which theme?")).toBeTruthy();
    expect(screen.getByText("Choose your theme")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Medium/ }));
    fireEvent.click(screen.getByRole("button", { name: /Under water/ }));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    const board = await screen.findByRole("group", { name: "Word search of 12 by 12" });
    expect(screen.getByText("medium · 12 × 12 · under water")).toBeTruthy();
    expect(screen.getByText("To find")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Words to find" })).toBeTruthy();
    expect(screen.getByText(/Drag across a word/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "New board" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeTruthy();

    const puzzle = currentPuzzle();
    const english = wordSearchWords("onderwater", "en");
    expect(puzzle.placements.every((placement) => english.includes(placement.word))).toBe(true);

    const placement = puzzle.placements[0];
    const first = placement?.cells[0];
    const last = placement?.cells.at(-1);
    if (!placement || !first || !last) {
      throw new Error("No placement");
    }
    const cell = (target: { row: number; col: number }) =>
      within(board).getByRole("button", {
        name: new RegExp(`^[A-Z], row ${target.row + 1}, column ${target.col + 1}(,|$)`),
      });
    fireEvent.click(cell(first));
    expect(screen.getByText("Now choose the last letter.")).toBeTruthy();
    expect(cell(first).getAttribute("aria-label")).toContain("selected");
    fireEvent.click(cell(last));
    expect(screen.getByText(`You found ${placement.word}!`)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(board.querySelector('[aria-label*="hint"]')).toBeTruthy();

    act(() => {
      useWordSearchStore.setState({ found: puzzle.placements.map((item) => item.word) });
    });
    expect(await screen.findByRole("heading", { name: "All found!" })).toBeTruthy();
    expect(screen.getByText("You found all 10 words.")).toBeTruthy();
  }, 30_000);
});

describe("Letter Fun in English", () => {
  const LESSONS: readonly { lesson: LetterLesson; name: RegExp; done: string }[] = [
    { lesson: "letters", name: /Letter Round/, done: "Great practising!" },
    { lesson: "woorden", name: /Word Reading/, done: "Great reading!" },
    { lesson: "trein", name: /Word Train/, done: "Great building!" },
    { lesson: "klankplek", name: /Sound Spot/, done: "Great listening!" },
    { lesson: "zoemlees", name: /Blend & Read/, done: "Great reading!" },
  ];

  function answerCurrent() {
    const { round, index } = useLetterStore.getState();
    const question = round?.questions[index];
    if (!question) {
      throw new Error("No question");
    }
    switch (question.kind) {
      case "lees":
        fireEvent.click(screen.getByRole("button", { name: `Word ${question.target.word}` }));
        return;
      case "plek": {
        const box = { begin: 1, midden: 2, eind: 3 }[question.position];
        fireEvent.click(screen.getByRole("button", { name: `Box ${box}` }));
        return;
      }
      case "trein":
      case "zoem":
        for (const letter of question.word.letters) {
          fireEvent.click(screen.getByRole("button", { name: `Letter ${letter}` }));
        }
        return;
      default:
        fireEvent.click(screen.getByRole("button", { name: `Letter ${question.target}` }));
    }
  }

  it("explains that the sounds and words are Dutch", async () => {
    renderApp("/letters");

    expect(await screen.findByRole("heading", { name: "Choose your lesson" })).toBeTruthy();
    expect(screen.getByText("Letter sounds and words are in Dutch.")).toBeTruthy();
    expect(screen.getByText("Tip for parents")).toBeTruthy();
    expect(screen.getByText("We start with i, k, m, s, p, v, e, n, t and a.")).toBeTruthy();
    expect(screen.getByText("Hear the sound and choose the letter")).toBeTruthy();
  });

  it.each(LESSONS)("plays a full $lesson round", async ({ lesson, name, done }) => {
    renderApp("/letters");
    fireEvent.click(await screen.findByRole("button", { name }));
    const round = useLetterStore.getState().round;
    expect(round?.lesson).toBe(lesson);
    const total = round?.questions.length ?? 0;

    for (let index = 0; index < total; index += 1) {
      answerCurrent();
      expect(screen.getByText(/^(Yes|Well built)/)).toBeTruthy();
      expect(screen.getByRole("button", { name: "Listen again" })).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: index + 1 >= total ? "Done" : "Next" }));
    }

    expect(await screen.findByRole("heading", { name: done })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Another round" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to the lessons" }));
    expect(await screen.findByRole("heading", { name: "Choose your lesson" })).toBeTruthy();
  });

  it("shows English hints after a mistake", async () => {
    renderApp("/letters");
    fireEvent.click(await screen.findByRole("button", { name: /Sound Spot/ }));
    expect(screen.getByText("Where do you hear this sound?")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Choose the box" })).toBeTruthy();

    const { round } = useLetterStore.getState();
    const question = round?.questions[0];
    if (!question || question.kind !== "plek") {
      throw new Error("No sound spot question");
    }
    const position = { begin: 1, midden: 2, eind: 3 }[question.position];
    const wrong = [1, 2, 3].filter((box) => box !== position);
    fireEvent.click(screen.getByRole("button", { name: `Box ${wrong[0]}` }));
    expect(screen.getByText("Almost! Try again.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: `Box ${wrong[1]}` }));
    expect(screen.getByText(new RegExp(`^The ${question.target} is (at|in) the`))).toBeTruthy();
  });
});

describe("Bonjour ! in English", () => {
  async function openAnimals() {
    renderApp("/frans");
    expect(await screen.findByText(/You hear French and choose the right English/)).toBeTruthy();
    expect(screen.getByText("French listening · A1.2")).toBeTruthy();
    expect(screen.getByText("Animals: listen and choose the right translation.")).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: /Les animaux/ }));
    expect(await screen.findByRole("heading", { name: "Les animaux" })).toBeTruthy();
  }

  it("asks for English meanings of French words", async () => {
    await openAnimals();
    fireEvent.click(screen.getByRole("button", { name: "Start listening practice" }));

    const group = await screen.findByRole("group", { name: "Choose the right translation" });
    expect(screen.getByText("Choose the English translation.")).toBeTruthy();
    expect(screen.getByText(/^Question 1 of/)).toBeTruthy();
    const question = useFrenchQuizStore.getState().question;
    if (!question) {
      throw new Error("No question");
    }
    const english = localizeLesson(LESSON_ANIMAUX, "en");
    const meanings = english.items.flatMap((item) => [item.nl, ...(item.distractors ?? [])]);
    for (const option of question.options) {
      expect(meanings).toContain(option);
    }

    const wrong = question.options.find((option) => option !== question.item.nl) ?? "";
    fireEvent.click(within(group).getByRole("button", { name: wrong }));
    expect(screen.getByText("Not yet.")).toBeTruthy();
    expect(screen.getByText(/The right answer is/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/^Question 2 of/)).toBeTruthy();
  });

  it("shows English on the flashcards and in the sentence builder", async () => {
    await openAnimals();
    fireEvent.click(screen.getByRole("button", { name: "Practise with cards" }));
    const card = await screen.findByRole("button", { name: /^French:/ });
    fireEvent.click(card);
    expect(card.getAttribute("aria-label")).toBe("English: the cat");
    expect(screen.getByText("My cat loves milk.")).toBeTruthy();
    expect(screen.getByText("‘le’ is masculine.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "I know it" }));
    expect(await screen.findByText("Card 2 of 15")).toBeTruthy();
    expect(screen.getByText("1 known")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /New game/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Build the sentence" }));
    expect(await screen.findByText("Make this sentence in French")).toBeTruthy();
    expect(screen.getByText("Tap the words in the right order.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Check" })).toBeTruthy();
  });

  it("sorts words into English categories and reviews in English", async () => {
    renderApp("/frans/sorteren");
    expect(await screen.findByText("Sorting")).toBeTruthy();
    expect(screen.getByText(/Drag a word to a category/)).toBeTruthy();
    const categories = [...document.querySelectorAll("[data-sort-category]")].map(
      (node) => node.textContent,
    );
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.every((label) => !/Dieren|Groeten|Familie|lichaam/.test(label ?? ""))).toBe(
      true,
    );
    cleanup();

    renderApp("/frans/herhalen");
    expect(await screen.findByText("There's nothing to review right now.")).toBeTruthy();
    cleanup();

    const first = allFrenchItems()[0];
    act(() => {
      useFrenchProgressStore.getState().record(first.id, false);
    });
    renderApp("/frans/herhalen");
    expect(await screen.findByText("Your tricky words")).toBeTruthy();
    const start = await screen.findByRole("button", { name: "Start review" });
    fireEvent.click(start);
    expect(await screen.findByText("Choose the English translation.")).toBeTruthy();
  });
});
