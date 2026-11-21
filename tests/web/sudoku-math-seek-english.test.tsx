import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { createSeekScene } from "@entities/hidden-object";
import {
  explanationFor,
  levelHint,
  praiseText,
  type MathQuestion,
  type MathRound,
} from "@entities/math";
import { createPlayState, generatePuzzle, type SudokuPuzzle } from "@entities/sudoku";
import { DEFAULT_MATH_SETTINGS, useMathStore } from "@features/math-trainer";
import { DEFAULT_SEEK_SETTINGS, useSeekStore } from "@features/seek-and-find";
import { DEFAULT_SETTINGS, useSudokuStore } from "@features/sudoku-game";
import { setLanguage } from "@shared/i18n";

const fixturePuzzle: SudokuPuzzle = {
  size: 4,
  difficulty: "makkelijk",
  seed: 1,
  givens: [1, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1],
  solution: [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1],
};

const fixtureSettings = {
  size: 4 as const,
  difficulty: "makkelijk" as const,
  theme: "animals" as const,
  mistakeMode: "direct" as const,
};

function renderApp(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

function resetStores() {
  useSudokuStore.setState({
    play: null,
    settings: DEFAULT_SETTINGS,
    history: [],
    hintPreview: null,
    hintUnavailable: false,
  });
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
  useSeekStore.setState({
    scene: null,
    found: false,
    tries: 0,
    wrongId: null,
    hintVisible: false,
    settings: DEFAULT_SEEK_SETTINGS,
  });
}

beforeEach(() => {
  cleanup();
  act(() => setLanguage("nl"));
  localStorage.clear();
  resetStores();
  act(() => setLanguage("en"));
});

afterEach(() => {
  cleanup();
  act(() => setLanguage("nl"));
  localStorage.clear();
});

function preloadSudoku(
  mode: "direct" | "check" = "direct",
  entries: Readonly<Record<number, number>> = {},
) {
  const play = createPlayState(fixturePuzzle);
  for (const [index, value] of Object.entries(entries)) {
    play.entries[Number(index)] = value;
  }
  useSudokuStore.setState({
    play,
    settings: { ...fixtureSettings, mistakeMode: mode },
    history: [],
    hintPreview: null,
    hintUnavailable: false,
  });
}

async function sudokuBoard(): Promise<HTMLElement> {
  return screen.findByRole("group", { name: "Sudoku grid of 4 by 4" });
}

describe("sudoku in English", () => {
  it("shows the setup and starts a puzzle", async () => {
    renderApp("/sudoku");

    expect(await screen.findByRole("heading", { name: "New game" })).toBeTruthy();
    expect(screen.getByText("Choose your puzzle")).toBeTruthy();
    expect(screen.getByText("Size")).toBeTruthy();
    expect(screen.getByText("Difficulty")).toBeTruthy();
    expect(screen.getByText("Show mistakes")).toBeTruthy();
    expect(screen.getByText("Symbols")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Medium/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /When I check/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Animals/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Numbers/ }));
    fireEvent.click(screen.getByRole("button", { name: /Straight away/ }));
    fireEvent.click(screen.getByRole("button", { name: /Easy/ }));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    const board = await sudokuBoard();
    const labels = within(board)
      .getAllByRole("button")
      .map((cell) => cell.getAttribute("aria-label"));
    expect(labels.some((label) => /^empty, row \d, column \d$/.test(label ?? ""))).toBe(true);
    expect(screen.getByText("0 of 16 squares filled in")).toBeTruthy();
    expect(screen.getByText("4 × 4 · easy")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Choose a number or animal" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Choose 1" })).toBeTruthy();
    for (const label of ["Hint", "Undo", "Erase", "Start over"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }

    fireEvent.click(screen.getByRole("button", { name: "New game" }));
    expect(await screen.findByRole("button", { name: /Back to your puzzle/ })).toBeTruthy();
  });

  it("explains a hint before placing it", async () => {
    preloadSudoku();
    renderApp("/sudoku");
    await sudokuBoard();

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(screen.getAllByRole("button", { name: /, tip$/ })).toHaveLength(1);
    expect(screen.getByText(/In this (row|column|box)|Only one number still fits/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Why?" }));
    expect(
      screen.getByText(/Cross out the numbers|Which number can't go anywhere else/),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Place" }));
    expect(screen.getAllByRole("button", { name: /, hint$/ })).toHaveLength(1);
  });

  it("asks to fix a mistake before giving a hint", async () => {
    preloadSudoku("direct", { 1: 3 });
    renderApp("/sudoku");
    await sudokuBoard();

    expect(screen.getByText("Something isn't right yet.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(screen.getByText("First fix the square that isn't right yet.")).toBeTruthy();
  });

  it("checks the board in check mode", async () => {
    preloadSudoku("check", { 1: 2 });
    renderApp("/sudoku");
    const board = await sudokuBoard();

    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("Everything is still correct!")).toBeTruthy();

    fireEvent.click(within(board).getAllByRole("button")[2]);
    fireEvent.click(screen.getByRole("button", { name: "Choose 🐶" }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(within(board).getAllByRole("button")[2]?.getAttribute("aria-label")).toContain(
      "not right yet",
    );
  });

  it("marks clashes and fixed squares", async () => {
    preloadSudoku("direct", { 1: 4 });
    renderApp("/sudoku");
    const board = await sudokuBoard();

    expect(screen.getByText("Some numbers appear twice.")).toBeTruthy();
    const cells = within(board).getAllByRole("button");
    expect(cells[0]?.getAttribute("aria-label")).toBe("🐶, row 1, column 1, fixed");
    expect(cells[1]?.getAttribute("aria-label")).toContain("clash");
  });

  it("celebrates rows, boxes and halfway", async () => {
    preloadSudoku("direct", { 1: 2, 2: 3 });
    renderApp("/sudoku");
    let board = await sudokuBoard();
    fireEvent.click(within(board).getAllByRole("button")[3]);
    fireEvent.click(screen.getByRole("button", { name: "Choose 🦊" }));
    expect(await screen.findByText("Row 1 done!")).toBeTruthy();

    cleanup();
    preloadSudoku("direct", { 1: 2 });
    renderApp("/sudoku");
    board = await sudokuBoard();
    fireEvent.click(within(board).getAllByRole("button")[4]);
    fireEvent.click(screen.getByRole("button", { name: "Choose 🐰" }));
    expect(await screen.findByText("Box 1 done!")).toBeTruthy();

    cleanup();
    preloadSudoku("direct", { 1: 2, 2: 3, 4: 3, 6: 1, 8: 2 });
    renderApp("/sudoku");
    board = await sudokuBoard();
    fireEvent.click(within(board).getAllByRole("button")[9]);
    fireEvent.click(screen.getByRole("button", { name: "Choose 🐶" }));
    expect(await screen.findByText("Halfway there!")).toBeTruthy();
  });

  it("joins two finished units in one message", async () => {
    preloadSudoku("direct", { 2: 3, 3: 4, 4: 3 });
    renderApp("/sudoku");
    const board = await sudokuBoard();
    fireEvent.click(within(board).getAllByRole("button")[1]);
    fireEvent.click(screen.getByRole("button", { name: "Choose 🐱" }));
    expect(await screen.findByText("Row 1 and Box 1 done!")).toBeTruthy();
  });

  it("shows the last square and the solved dialog", async () => {
    const entries = fixturePuzzle.solution.map((value, index) => (index === 1 ? 0 : value));
    useSudokuStore.setState({
      play: {
        puzzle: fixturePuzzle,
        entries,
        hinted: fixturePuzzle.givens.map(() => false),
        selected: null,
        solved: false,
      },
      settings: { ...fixtureSettings },
    });
    renderApp("/sudoku");
    await sudokuBoard();
    expect(screen.getByText("Just one square left!")).toBeTruthy();

    cleanup();
    const puzzle = generatePuzzle(4, "gemiddeld", 99);
    useSudokuStore.setState({
      play: {
        puzzle,
        entries: [...puzzle.solution],
        hinted: puzzle.givens.map(() => false),
        selected: null,
        solved: true,
      },
      settings: { ...fixtureSettings, difficulty: "gemiddeld" },
    });
    renderApp("/sudoku");
    expect(await screen.findByRole("heading", { name: "Solved!" })).toBeTruthy();
    expect(screen.getByText("You solved the whole sudoku.")).toBeTruthy();
    expect(screen.getByText("4 × 4 · medium")).toBeTruthy();
  });
});

function currentRound(): MathRound {
  const round = useMathStore.getState().round;
  if (!round) {
    throw new Error("No math round");
  }
  return round;
}

function currentQuestion(): MathQuestion {
  const question = currentRound().questions[useMathStore.getState().questionIndex];
  if (!question) {
    throw new Error("No math question");
  }
  return question;
}

describe("Times Table Topper in English", () => {
  it("plays a round with English feedback", async () => {
    renderApp("/rekenen");

    expect(await screen.findByRole("heading", { name: "New game" })).toBeTruthy();
    expect(screen.getByText("Times Table Topper")).toBeTruthy();
    expect(screen.getByText("Choose what you want to practise")).toBeTruthy();
    expect(screen.getByText("Kind of sum")).toBeTruthy();
    expect(screen.getByText("Level")).toBeTruthy();
    expect(screen.getByText("No score yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Taking away/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Sharing/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Adding/ }));
    fireEvent.click(screen.getByRole("button", { name: /Hard/ }));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    expect(await screen.findByText("Sum 1 of 10")).toBeTruthy();
    expect(screen.getByText("Adding · Hard")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Choose the right answer" })).toBeTruthy();
    expect(screen.getByText("Choose the right answer.")).toBeTruthy();

    const question = currentQuestion();
    const wrong = question.choices.find((choice) => choice !== question.answer);
    if (wrong === undefined) {
      throw new Error("No wrong choice");
    }
    fireEvent.click(screen.getByRole("button", { name: `Answer ${wrong}` }));
    expect(screen.getByText("Almost! Try one more time.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: `Answer ${question.answer}` }));
    expect(screen.getByText(praiseText(currentRound().seed, question))).toBeTruthy();
    expect(screen.getByText(/Count on from/)).toBeTruthy();
    expect(screen.getByRole("img", { name: /^Number line from 0 to/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Sum 2 of 10")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "New game" }));
    expect(await screen.findByRole("button", { name: /Back to your sums/ })).toBeTruthy();
  });

  it("shows the right answer and groups for a division", async () => {
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
      wrongChoices: [4],
    });
    renderApp("/rekenen");
    expect(await screen.findByText("Sum 1 of 1")).toBeTruthy();
    expect(screen.getByText("Sharing · Easy")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Answer 6" }));
    expect(screen.getByText("The right answer is 3.")).toBeTruthy();
    expect(screen.getByText("3 groups of 5")).toBeTruthy();
    expect(screen.getByRole("img", { name: "3 groups of 5 dots" })).toBeTruthy();
    expect(screen.getByText("15 ÷ 5 = 3. That's 3 groups of 5.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Done" })).toBeTruthy();
  });

  it("names the score and celebration in English", async () => {
    useMathStore.setState({ best: { "plus:makkelijk": 8 } });
    renderApp("/rekenen");
    expect(await screen.findByText("Best score: 8 out of 10 stars")).toBeTruthy();

    for (const [stars, title] of [
      [10, "You stayed sharp!"],
      [7, "You kept on calculating!"],
      [3, "Good practice!"],
    ] as const) {
      cleanup();
      useMathStore.setState({
        round: {
          mode: "keer",
          level: "gemiddeld",
          seed: 1,
          questions: [
            {
              id: 0,
              mode: "keer",
              level: "gemiddeld",
              left: 2,
              right: 3,
              answer: 6,
              prompt: "2 × 3",
              choices: [6, 5, 8],
            },
          ],
        },
        stars,
        finished: true,
      });
      renderApp("/rekenen");
      expect(await screen.findByRole("heading", { name: title })).toBeTruthy();
      expect(screen.getByText(`You got ${stars} out of 10 stars.`)).toBeTruthy();
      expect(screen.getByText("Times · Medium")).toBeTruthy();
    }
  });

  it("explains every kind of sum and level in English", () => {
    const base = { id: 0, level: "makkelijk" as const, choices: [], prompt: "" };
    expect(explanationFor({ ...base, mode: "min", left: 9, right: 4, answer: 5 })).toBe(
      "9 − 4 = 5. Count back from 9.",
    );
    expect(explanationFor({ ...base, mode: "keer", left: 2, right: 3, answer: 6 })).toBe(
      "2 × 3 = 6. That's 2 groups of 3.",
    );
    expect(levelHint("plus", "moeilijk")).toBe("Up to 100");
    expect(levelHint("keer", "moeilijk")).toBe("Tables 6–10");
  });
});

describe("Where is Wobbel? in English", () => {
  it("plays a scene with English texts", async () => {
    renderApp("/zoeken");

    expect(await screen.findByRole("heading", { name: "New game" })).toBeTruthy();
    expect(screen.getByText("Where is Wobbel?")).toBeTruthy();
    expect(screen.getByText("Choose your search scene")).toBeTruthy();
    expect(screen.getByText("Where will you look?")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Garden/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Medium/ }));
    fireEvent.click(screen.getByRole("button", { name: /Under water/ }));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    expect(
      await screen.findByRole("group", {
        name: "Find the Wobbel with the star among all the other Wobbels",
      }),
    ).toBeTruthy();
    expect(screen.getByText("medium · under water")).toBeTruthy();
    expect(
      screen.getByRole("img", { name: "Goal: the Wobbel with a star on its hat" }),
    ).toBeTruthy();
    expect(screen.getByText("Look for this one")).toBeTruthy();
    expect(screen.getByText("Wobbel with the star")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Wobbel 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "New search scene" })).toBeTruthy();

    const scene = useSeekStore.getState().scene;
    if (!scene) {
      throw new Error("No seek scene");
    }
    const decoy = scene.creatures.find((creature) => creature.id !== scene.targetId);
    if (!decoy) {
      throw new Error("No decoy found");
    }
    fireEvent.click(document.querySelector(`[data-creature-id="${decoy.id}"]`) as Element);
    expect(screen.getByText("Not yet — look closely at the star.")).toBeTruthy();

    fireEvent.click(document.querySelector(`[data-creature-id="${scene.targetId}"]`) as Element);
    expect(await screen.findByRole("heading", { name: "Found it!" })).toBeTruthy();
    expect(screen.getByText("You looked 1 more time, and still found him!")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "New game" }));
    expect(await screen.findByRole("button", { name: /Back to your search scene/ })).toBeTruthy();
  });

  it("counts the extra looks in the win dialog", async () => {
    const scene = createSeekScene("makkelijk", "tuin", 7);
    useSeekStore.setState({ scene, found: true, tries: 0 });
    renderApp("/zoeken");
    expect(await screen.findByText("You found him straight away. Good looking!")).toBeTruthy();
    expect(screen.getByText("easy · in the garden")).toBeTruthy();

    cleanup();
    useSeekStore.setState({ scene, found: true, tries: 3 });
    renderApp("/zoeken");
    expect(await screen.findByText("You looked 3 more times, and still found him!")).toBeTruthy();
  });
});
