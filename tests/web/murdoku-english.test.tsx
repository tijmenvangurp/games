import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { MURDOKU_CASE_TEXTS, MURDOKU_CASES, loadMurdokuLevel } from "@entities/murdoku";
import {
  DEFAULT_MURDOKU_SETTINGS,
  MURDOKU_NL_TEXTS,
  createMurdokuText,
  useMurdokuStore,
} from "@features/murdoku-game";
import { MURDOKU_EN_TEXTS } from "../../libs/features/murdoku-game/lib/en";
import { setLanguage } from "@shared/i18n";
import { silentCanvasContext } from "./murdoku-canvas";

/** Alle sleutels van een woordenlijst als platte paden ("clue.onObject"). */
function keysOf(dictionary: object, prefix = ""): string[] {
  return Object.entries(dictionary).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : keysOf(value as object, `${prefix}${key}.`),
  );
}

function renderApp(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

function resetToDutch() {
  act(() => setLanguage("nl"));
  localStorage.clear();
}

beforeEach(() => {
  cleanup();
  resetToDutch();
  useMurdokuStore.setState({
    puzzle: null,
    play: null,
    history: [],
    hint: null,
    hintsUsed: 0,
    settings: DEFAULT_MURDOKU_SETTINGS,
    solvedCaseIds: new Set(),
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() =>
    silentCanvasContext(),
  );
  act(() => setLanguage("en"));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetToDutch();
});

/** De drie verdachten van de instapzaak op hun oplossingsvakje. */
function placeIntroSolution(): void {
  fireEvent.click(screen.getByRole("button", { name: "Anna" }));
  fireEvent.click(screen.getByRole("button", { name: /^empty, row 1, column 2/ }));
  fireEvent.click(screen.getByRole("button", { name: "Bram" }));
  fireEvent.click(screen.getByRole("button", { name: /^empty, row 2, column 1/ }));
  fireEvent.click(screen.getByRole("button", { name: "Cato" }));
  fireEvent.click(screen.getByRole("button", { name: /^empty, row 3, column 4/ }));
}

describe("Who Did It? in English", () => {
  it("shows the board, the clue cards and the legend in English", async () => {
    renderApp("/mysterie");

    expect(await screen.findByRole("heading", { name: "Who Did It?" })).toBeTruthy();
    expect(
      screen.getByRole("img", { name: "Floor plan of The Missing Cake, 4 by 4" }),
    ).toBeTruthy();
    expect(screen.getByText(/At the birthday party, the cake is suddenly gone/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Who is who?" })).toBeTruthy();
    expect(screen.getByText("R1")).toBeTruthy();
    expect(screen.getByText("C1")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Squares of the floor plan" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Row 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Show the kitchen on the board" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Show a chair on the board" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Who is where?" }).textContent).toContain(
      "Anna is not on the board yet.",
    );

    const sentenceOf = (part: string) =>
      screen.getAllByText((content) => content.trim().startsWith(part));
    expect(sentenceOf("Anna was in").length).toBeGreaterThan(0);
    expect(sentenceOf("Bram was on").length).toBeGreaterThan(0);

    expect(
      screen.getByText(
        "The loot is in a room with exactly one suspect. That suspect is the thief.",
      ),
    ).toBeTruthy();
    const canStand = screen.getByRole("list", { name: "You can stand here" });
    expect(within(canStand).getByText("Chair")).toBeTruthy();
    expect(within(canStand).getByText("Carpet")).toBeTruthy();
    const cannotStand = screen.getByRole("list", { name: "You can't stand here" });
    expect(within(cannotStand).getByText("Bookcase")).toBeTruthy();
    expect(screen.getByText(/The loot \(the cake\) has its own icon/)).toBeTruthy();

    expect(screen.getByRole("heading", { name: "How I play" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Cross out row and column automatically" }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Choose another case" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "How it works and word list" })).toBeTruthy();
    expect(screen.getByText("You can check once everyone is on the board.")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("First choose a person below.");
  });

  it("places people, crosses out squares and tells what happens", async () => {
    renderApp("/mysterie");
    await screen.findByRole("heading", { name: "Who is who?" });

    fireEvent.click(screen.getByRole("button", { name: "Anna" }));
    expect(screen.getByRole("status").textContent).toBe(
      "Anna is chosen. Tap a square to place them.",
    );
    expect(
      screen.getByRole("button", {
        name: /^empty, row 1, column 2, kitchen, Carpet, Anna can stand here$/,
      }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^empty, row 1, column 2/ }));
    expect(screen.getByRole("status").textContent).toContain("Anna is in row 1, column 2.");
    expect(
      screen.getByRole("button", { name: /^Anna, row 1, column 2, .*tap to remove$/ }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /^crossed out, row 2, column 2/ })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Who is where?" }).textContent).toContain(
      "Anna is in row 1, column 2.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Cross mode" }));
    expect(screen.getByRole("status").textContent).toBe(
      "Cross mode: tap a free square to cross it out.",
    );
    expect(
      screen.getByRole("button", { name: /^empty, row 3, column 1, .*tap to cross out$/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /^no space, nobody can stand here, row 1, column 3/ }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    fireEvent.click(screen.getByRole("button", { name: "Start again" }));
    expect(useMurdokuStore.getState().play?.placements.size).toBe(0);
  });

  it("lights up a word from a clue and gives hints in English", async () => {
    renderApp("/mysterie");
    await screen.findByRole("heading", { name: "Who is who?" });

    fireEvent.click(screen.getByRole("button", { name: "Show the kitchen on the board" }));
    expect(screen.getByRole("status").textContent).toBe("The kitchen lights up.");
    expect(screen.getByRole("button", { name: /^empty, lit up, row 1, column 1/ })).toBeTruthy();

    const hint = screen.getByRole("button", { name: "Hint" });
    fireEvent.click(hint);
    expect(screen.getByRole("status").textContent).toBe(
      "Look at Bram's clue. Where can you find a chair?",
    );
    fireEvent.click(hint);
    expect(screen.getByRole("status").textContent).toBe(
      "Bram was on a chair. Only the kitchen is left, and this is the only free square there.",
    );
    fireEvent.click(hint);
    expect(screen.getByRole("status").textContent).toBe(
      "Put Bram on R2/C1, because he was on a chair.",
    );
  });

  it("gives calm feedback on a wrong check and reveals the thief", async () => {
    renderApp("/mysterie");
    await screen.findByRole("heading", { name: "Who is who?" });

    fireEvent.click(screen.getByRole("button", { name: "Anna" }));
    fireEvent.click(screen.getByRole("button", { name: /^empty, row 1, column 2/ }));
    fireEvent.click(screen.getByRole("button", { name: "Bram" }));
    fireEvent.click(screen.getByRole("button", { name: /^empty, row 2, column 1/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cato" }));
    fireEvent.click(screen.getByRole("button", { name: /row 3, column 1/ }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByRole("status").textContent).toBe(
      "Not quite yet. Take another look at the clues and try again.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Start again" }));
    placeIntroSolution();
    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    const sentence = "Cato was the only one with the cake in the bathroom.";
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Solved!" })).toBeTruthy();
    expect(within(dialog).getByText(sentence)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe(`Solved! ${sentence}`);
    expect(screen.getByRole("button", { name: /^the cake, row 4, column 3/ })).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Look at the floor plan" }));
    const reveal = screen.getByRole("region", { name: "The thief" });
    expect(within(reveal).getByText(sentence)).toBeTruthy();
    expect(within(reveal).getByText(/the loot's room has an outline/)).toBeTruthy();
    expect(within(reveal).getByRole("button", { name: "Play again" })).toBeTruthy();
  });

  it("switches an open case between Dutch and English", async () => {
    act(() => setLanguage("nl"));
    renderApp("/mysterie");
    expect(await screen.findByRole("heading", { name: "Wie was het?" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Toon de keuken op het bord" })).toBeTruthy();

    act(() => setLanguage("en"));
    expect(await screen.findByRole("heading", { name: "Who Did It?" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Show the kitchen on the board" })).toBeTruthy();
    expect(
      screen.getByRole("img", { name: "Floor plan of The Missing Cake, 4 by 4" }),
    ).toBeTruthy();
  });

  it("lists the cases in English", async () => {
    renderApp("/mysterie/zaken");

    expect(await screen.findByRole("heading", { name: "Choose a case" })).toBeTruthy();
    expect(screen.getByText("Twelve cases of our own")).toBeTruthy();
    expect(screen.getByText("The Stolen Cookies")).toBeTruthy();
    expect(screen.getByText("Right for you")).toBeTruthy();
    expect(screen.getAllByText("Not played yet").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Back to the case" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^The Stolen Cookies, / }));
    expect(await screen.findByRole("heading", { name: "Who is who?" })).toBeTruthy();
    expect(
      screen.getByText("The cookies are gone. Read the clues and find the thief."),
    ).toBeTruthy();
  });

  it("explains the rules and the word list in English", async () => {
    renderApp("/mysterie/les");

    expect(await screen.findByRole("heading", { name: "The goal" })).toBeTruthy();
    expect(screen.getByText("Seven steps and a word list")).toBeTruthy();
    expect(screen.getByRole("link", { name: "To the case" })).toBeTruthy();
    expect(screen.getByText("Step 1 of 7")).toBeTruthy();
    expect(screen.getByRole("list", { name: "Choose a screen" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Next step" }));
    expect(screen.getByRole("heading", { name: "One per row and column" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Step 3: Where can people stand?" }));
    expect(screen.getAllByText("Bookcase").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Previous step" }));
    expect(screen.getByRole("heading", { name: "One per row and column" })).toBeTruthy();

    expect(screen.getByRole("heading", { name: "Word list" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "the loot" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Where can you stand?" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Two tips" })).toBeTruthy();
    expect(screen.getByText(/Every clue is true\./)).toBeTruthy();
  });
});

describe("Who Did It? English texts", () => {
  it("has the same keys in English as in Dutch", () => {
    expect(keysOf(MURDOKU_EN_TEXTS).sort()).toEqual(keysOf(MURDOKU_NL_TEXTS).sort());
  });

  it("has an English title, intro and loot for every case", () => {
    for (const entry of MURDOKU_CASES) {
      const words = MURDOKU_CASE_TEXTS.en[entry.id];
      expect(words.title.length).toBeGreaterThan(0);
      expect(words.intro.length).toBeGreaterThan(0);
      expect(words.loot).toMatch(/^the /);
      expect(MURDOKU_CASE_TEXTS.nl[entry.id]).toEqual({
        title: entry.title,
        intro: entry.intro,
        loot: entry.loot.name,
      });
    }
  });

  it("turns every clue of every case into an English sentence", () => {
    for (const entry of MURDOKU_CASES) {
      const puzzle = loadMurdokuLevel(entry.level);
      const text = createMurdokuText(puzzle, "en");

      for (const suspect of puzzle.suspects) {
        for (const clue of suspect.clues) {
          const sentence = text.clue(clue, suspect.id);
          expect(sentence).toMatch(/^[A-Z].*\.$/);
          expect(sentence).not.toMatch(/\b(?:clue|room|object|attr|dir)\.[a-z]|[[{]/);
          expect(sentence).not.toMatch(/\b(?:stond|naast|een|kamer|de|het)\b/);
        }
      }
      for (const room of puzzle.board.rooms.values()) {
        expect(text.roomName(room.nameKey)).not.toMatch(/^(?:room\.|the )/);
        expect(text.roomPhrase(room.id)).toMatch(/^the /);
      }
    }
  });
});
