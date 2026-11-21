import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { BASE_ELEMENT_IDS, ELEMENTS, elementName } from "@entities/alchemy";
import { subjectName, type FlagQuestion, type FlagSubject } from "@entities/geography";
import {
  filterAndSortElements,
  resetAlchemyInstanceCounter,
  useAlchemyStore,
} from "@features/alchemy-lab";
import { DEFAULT_FLAG_SETTINGS, useFlagStore } from "@features/flag-game";
import { setLanguage } from "@shared/i18n";

function resetToDutch() {
  act(() => setLanguage("nl"));
  localStorage.clear();
}

beforeEach(() => {
  cleanup();
  resetToDutch();
  act(() => setLanguage("en"));
  resetAlchemyInstanceCounter();
  useAlchemyStore.setState({
    discovered: [...BASE_ELEMENT_IDS],
    board: [],
    selected: null,
    feedback: null,
    hint: null,
    missionId: "mud",
  });
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
  resetToDutch();
});

function renderApp(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
}

function shelfButton(name: string): HTMLElement {
  return screen.getByRole("button", { name: `Put ${name} on the workbench` });
}

async function renderAlchemy() {
  renderApp("/mengelmoes");
  await screen.findByRole("heading", { name: "Mix & Match" });
}

describe("Mix & Match in English", () => {
  it("plays the first mission in English", async () => {
    await renderAlchemy();

    expect(screen.getByText("Tap or drag to mix")).toBeTruthy();
    expect(screen.getByTestId("alchemy-progress").textContent).toContain(
      `/ ${ELEMENTS.length} discovered`,
    );
    expect(
      screen.getByText(
        "Tap or drag an element onto the workbench. Then pick a second element to mix.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "My elements" })).toBeTruthy();
    expect(screen.getByText(`4 of ${ELEMENTS.length}`)).toBeTruthy();
    expect(screen.getByText("Tap or drag to the workbench")).toBeTruthy();

    const mission = screen.getByTestId("alchemy-mission");
    expect(mission.textContent).toContain("Make mud.");
    expect(mission.textContent).toContain("Mission 0/30");

    fireEvent.click(shelfButton("Water"));
    expect(screen.getByRole("button", { name: "Water, selected" })).toBeTruthy();
    expect(screen.getByText("Pick a second element to mix")).toBeTruthy();
    fireEvent.click(shelfButton("Earth"));

    expect(await screen.findByRole("heading", { name: "Mud" })).toBeTruthy();
    expect(screen.getByText("New discovery")).toBeTruthy();
    expect(screen.getByText("Water + Earth")).toBeTruthy();
    expect(screen.getByText("Mud is wet earth.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Keep discovering" }));

    expect(mission.textContent).toContain("Done!");
    expect(mission.textContent).toContain("Mission 1/30");
    fireEvent.click(screen.getByRole("button", { name: "Next mission" }));
    expect(mission.textContent).toContain("Make steam.");

    fireEvent.click(screen.getByRole("button", { name: "Another mission" }));
    expect(mission.textContent).toContain("Make it rain.");
  });

  it("names hints and feedback in English", async () => {
    await renderAlchemy();

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(await screen.findByText("Try Water with something else.")).toBeTruthy();

    fireEvent.click(shelfButton("Water"));
    fireEvent.click(shelfButton("Earth"));
    fireEvent.click(await screen.findByRole("button", { name: "Keep discovering" }));

    fireEvent.click(screen.getByRole("button", { name: "Tidy up" }));
    fireEvent.click(shelfButton("Water"));
    fireEvent.click(shelfButton("Earth"));
    expect(await screen.findByText("You already had that one: Mud.")).toBeTruthy();

    fireEvent.click(shelfButton("Mud"));
    expect(await screen.findByText("Hmm, those don't mix. Try something else.")).toBeTruthy();
  });

  it("shows a hint for a recipe with the same element twice", async () => {
    await renderAlchemy();
    act(() => useAlchemyStore.setState({ hint: { a: "air", b: "air", result: "storm" } }));

    expect(await screen.findByText("Try Air twice.")).toBeTruthy();
  });

  it("shows the end messages in English", async () => {
    await renderAlchemy();

    act(() => useAlchemyStore.setState({ feedback: { kind: "full" } }));
    expect(
      await screen.findByText("The workbench is full. The oldest element went back on the shelf."),
    ).toBeTruthy();

    act(() => useAlchemyStore.setState({ feedback: { kind: "all-found" } }));
    expect(await screen.findByText("You've discovered every element. Well done!")).toBeTruthy();

    act(() => useAlchemyStore.setState({ missionId: null }));
    expect(screen.getByTestId("alchemy-mission").textContent).toContain("All missions done!");
  });

  it("opens the lab book with English names, filters and details", async () => {
    await renderAlchemy();
    fireEvent.click(shelfButton("Water"));
    fireEvent.click(shelfButton("Fire"));
    fireEvent.click(await screen.findByRole("button", { name: "Keep discovering" }));

    fireEvent.click(screen.getByRole("button", { name: "Lab book" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: "Lab book" })).toBeTruthy();
    expect(within(dialog).getAllByText(`5 of ${ELEMENTS.length} elements discovered`)).toHaveLength(
      1,
    );
    expect(within(dialog).getAllByText("Unknown")).toHaveLength(ELEMENTS.length - 5);
    expect(within(dialog).getByText("Icons: Microsoft Fluent Emoji · MIT")).toBeTruthy();
    expect(within(dialog).getByRole("group", { name: "Filter by category" })).toBeTruthy();
    expect(within(dialog).getByLabelText("Sort")).toBeTruthy();
    expect(within(dialog).getByRole("option", { name: "Newest" })).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Fantasy" }));
    expect(within(dialog).queryByRole("button", { name: "View Steam" })).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: "All" }));

    fireEvent.click(within(dialog).getByRole("button", { name: "View Steam" }));
    expect(within(dialog).getByRole("heading", { name: "Steam" })).toBeTruthy();
    expect(within(dialog).getByText("Steam is water that has got very hot.")).toBeTruthy();
    expect(within(dialog).getByText("Made from")).toBeTruthy();
    expect(within(dialog).getByText("Successful mixes")).toBeTruthy();
    expect(within(dialog).getByText("Nothing made with it yet.")).toBeTruthy();
    expect(within(dialog).getByText(/more mixes to discover\.$/)).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Back to the lab book" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "View Water" }));
    expect(within(dialog).getByText("This is a basic element.")).toBeTruthy();
    expect(within(dialog).getByText("Water", { selector: "p" })).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Back to the lab book" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Back to the workbench" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows an unknown ingredient and a missing recipe in the detail", async () => {
    await renderAlchemy();
    act(() => useAlchemyStore.setState({ discovered: [...BASE_ELEMENT_IDS, "rainbowdragon"] }));

    fireEvent.click(screen.getByRole("button", { name: "Lab book" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "View Rainbow dragon" }));

    expect(within(dialog).getAllByLabelText("Unknown element").length).toBeGreaterThan(0);
    fireEvent.click(within(dialog).getByRole("button", { name: "Close lab book" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("filters and sorts the shelf by English name", async () => {
    await renderAlchemy();
    act(() =>
      useAlchemyStore.setState({ discovered: ELEMENTS.slice(0, 12).map((element) => element.id) }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Life" }));
    expect(screen.getByText("No elements in this category yet.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "All" }));

    const sort = screen.getByLabelText("Sort");
    fireEvent.change(sort, { target: { value: "name" } });
    const names = Array.from(
      screen.getAllByRole("button", { name: /^Put .* on the workbench$/ }),
      (button) => button.getAttribute("aria-label")?.replace(/^Put (.*) on the workbench$/, "$1"),
    );
    expect(names).toEqual([...names].sort((first, second) => first!.localeCompare(second!, "en")));
    expect(names[0]).toBe("Air");
  });

  it("sorts by the name in the chosen language", () => {
    const english = filterAndSortElements(ELEMENTS, "all", "name", "en").map((element) =>
      elementName(element.id, "en"),
    );
    const dutch = filterAndSortElements(ELEMENTS, "fire", "category", "nl").map((element) =>
      elementName(element.id, "nl"),
    );

    expect(english).toEqual(
      [...english].sort((first, second) => first.localeCompare(second, "en")),
    );
    expect(dutch).toEqual([...dutch].sort((first, second) => first.localeCompare(second, "nl")));
  });
});

function currentQuestion(): FlagQuestion {
  const { round, questionIndex } = useFlagStore.getState();
  const question = round?.questions[questionIndex];
  if (!question) {
    throw new Error("Geen vraag");
  }
  return question;
}

function englishName(subject: FlagSubject): string {
  return subjectName(subject, "en");
}

function answerCurrentCorrectly() {
  const question = currentQuestion();
  fireEvent.click(screen.getByRole("button", { name: englishName(question.subject) }));
  const { questionIndex, round } = useFlagStore.getState();
  const last = questionIndex + 1 >= (round?.questions.length ?? 0);
  fireEvent.click(screen.getByRole("button", { name: last ? "Finish" : "Next" }));
}

describe("Flag Trip in English", () => {
  it("sets up and plays a full flag round in English", async () => {
    renderApp("/vlaggen");

    expect(await screen.findByRole("heading", { name: "New game" })).toBeTruthy();
    expect(screen.getByText("Choose an area")).toBeTruthy();
    expect(screen.getByText("What do you want to play?")).toBeTruthy();
    expect(screen.getByText("Where do you want to play?")).toBeTruthy();
    expect(screen.getByText("Level")).toBeTruthy();
    expect(screen.getByText("No score yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Flags" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Map puzzle" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Whole world/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Europe/ })).toBeTruthy();
    for (const label of ["North America", "South America", "Asia", "Africa", "Oceania"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
    for (const label of ["Easy", "Medium", "Hard"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(await screen.findByText("Question 1 of 10")).toBeTruthy();
    expect(screen.getByText("Europe · Easy")).toBeTruthy();
    expect(screen.getByText("Choose the right answer.")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Choose the right answer" })).toBeTruthy();

    const prompt =
      currentQuestion().direction === "vlag-naar-land"
        ? "Which country does this flag belong to?"
        : "Which flag belongs to this country?";
    expect(screen.getByText(prompt)).toBeTruthy();

    for (let index = 0; index < 10; index += 1) {
      answerCurrentCorrectly();
    }

    expect(await screen.findByRole("heading", { name: "Perfect!" })).toBeTruthy();
    expect(screen.getByText("You got 10 out of 10 stars.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Choose another game" }));
    expect(await screen.findByText("Best score: 10 stars")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to your game" }));
    expect(await screen.findByRole("heading", { name: "Perfect!" })).toBeTruthy();
  });

  it("explains a wrong answer in English", async () => {
    renderApp("/vlaggen");
    fireEvent.click(await screen.findByRole("button", { name: "Play" }));

    const question = currentQuestion();
    const wrong = question.choices.filter((choice) => choice.code !== question.subject.code);
    fireEvent.click(screen.getByRole("button", { name: englishName(wrong[0]!) }));
    fireEvent.click(screen.getByRole("button", { name: englishName(wrong[1]!) }));

    const expected =
      question.direction === "vlag-naar-land"
        ? /^The right answer is /
        : /^The right flag is the flag of /;
    expect(screen.getByText(expected)).toBeTruthy();
    expect(screen.getByText(/ It is in Europe\./)).toBeTruthy();
  });

  it("keeps the province names and asks about provinces", async () => {
    renderApp("/vlaggen");
    fireEvent.click(await screen.findByRole("button", { name: /Netherlands/ }));
    fireEvent.click(screen.getByRole("button", { name: /Hard/ }));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    const question = currentQuestion();
    const prompt =
      question.direction === "vlag-naar-land"
        ? "Which province does this flag belong to?"
        : "Which flag belongs to this province?";
    expect(await screen.findByText(prompt)).toBeTruthy();
    expect(screen.getByText("Netherlands · Hard")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: question.subject.name }));
    expect(screen.getByText(/It is in the Netherlands\./)).toBeTruthy();
  });
});

function puzzleSubjects(): readonly FlagSubject[] {
  const round = useFlagStore.getState().puzzle?.round;
  if (!round) {
    throw new Error("Geen puzzelronde");
  }
  return round.questions.map((question) => question.subject);
}

function pieceButton(subject: FlagSubject) {
  return screen.getByRole("button", { name: `${englishName(subject)} (piece)` });
}

function target(code: string) {
  const element = document.querySelector(`[data-country="${code}"]`);
  if (!element) {
    throw new Error(`Geen kaartvlak voor ${code}`);
  }
  return element;
}

describe("map puzzle in English", () => {
  it("places, misplaces and reveals pieces in English", async () => {
    renderApp("/vlaggen");
    fireEvent.click(await screen.findByRole("button", { name: /Map puzzle/ }));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    await screen.findByTestId("puzzle-map");

    expect(screen.getByText("0 of 8 placed")).toBeTruthy();
    expect(screen.getByText("Pick a piece and put it on the map.")).toBeTruthy();
    expect(screen.getByText("Puzzle pieces")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Map with 8 empty spaces" })).toBeTruthy();

    const [first, second, third, fourth] = puzzleSubjects();
    if (!first || !second || !third || !fourth) {
      throw new Error("Te weinig stukken");
    }

    fireEvent.keyDown(pieceButton(first), { key: "Enter" });
    expect(screen.getByText(/^Where is .*\?$/)).toBeTruthy();
    fireEvent.click(target(first.code));
    expect(screen.getByText(/^Well done! You put .* in the right place\.$/)).toBeTruthy();
    expect(screen.getByText("1 of 8 placed")).toBeTruthy();

    fireEvent.keyDown(pieceButton(second), { key: "Enter" });
    act(() => useFlagStore.getState().placePiece(undefined));
    expect(screen.getByText(/^Drop .* onto the map\.$/)).toBeTruthy();

    fireEvent.click(target(third.code));
    expect(screen.getByText(/^That's .*\. Look for .*\.$/)).toBeTruthy();
    fireEvent.click(target(fourth.code));
    expect(screen.getByText(/^This is where .* goes\.$/)).toBeTruthy();
  });

  it("shows loading and a failed map load in English", async () => {
    renderApp("/vlaggen");
    fireEvent.click(await screen.findByRole("button", { name: /Map puzzle/ }));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    await screen.findByTestId("puzzle-map");

    act(() => useFlagStore.setState({ puzzleLoading: true }));
    expect(screen.getByText("Loading map…")).toBeTruthy();

    act(() => useFlagStore.setState({ puzzleLoading: false, puzzleError: true }));
    expect(screen.getByText("The map couldn't load. Please try again.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
