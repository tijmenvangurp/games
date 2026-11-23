import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import {
  createPuzzle,
  emptyProgress,
  ENGLISH_WORD_SETS,
  LEVELS,
  setFor,
  setsFor,
  symbolName,
  THEMES,
  WORD_SETS,
} from "@entities/geheime-code";
import { useGeheimeCodeStore } from "@features/geheime-code";
import { setLanguage } from "@shared/i18n";
import { mulberry32 } from "@shared/lib";

function resetStore() {
  useGeheimeCodeStore.setState({
    theme: "sinterklaas",
    level: 1,
    round: 1,
    puzzle: null,
    entries: [],
    activeRow: 0,
    activeCell: 0,
    hintLetter: null,
    wrongCell: null,
    wordMistakes: 0,
    wordHints: 0,
    firstTry: 0,
    wordDone: false,
    result: null,
    progress: emptyProgress(),
  });
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  resetStore();
  act(() => setLanguage("en"));
});

afterEach(() => {
  cleanup();
  act(() => setLanguage("nl"));
  localStorage.clear();
});

describe("Geheime Code in English", () => {
  it("has an English set for every Dutch set, within the same rules", () => {
    expect(ENGLISH_WORD_SETS.map((set) => set.id)).toEqual(WORD_SETS.map((set) => set.id));
    for (const set of ENGLISH_WORD_SETS) {
      const maxLength = set.level === 1 ? 4 : 6;
      expect(new Set(set.words).size).toBe(set.words.length);
      expect(set.words.length).toBeGreaterThanOrEqual(4);
      expect(set.words.length).toBeLessThanOrEqual(6);
      for (const word of set.words) {
        expect(word).toMatch(/^[a-z]{3,6}$/);
        expect(word.length).toBeLessThanOrEqual(maxLength);
      }
      const letters = new Set(set.words.join(""));
      expect(letters.size).toBeLessThanOrEqual(set.level === 1 ? 12 : 14);
      expect(createPuzzle(set, mulberry32(3)).rows).toHaveLength(set.words.length);
    }
  });

  it("picks the word sets and symbol names of the active language", () => {
    for (const theme of THEMES) {
      for (const level of LEVELS) {
        expect(setsFor(theme, level)).toHaveLength(2);
      }
    }
    expect(setFor("tuin", 1, 1)?.words).toContain("rose");
    expect(symbolName("gift")).toBe("present");

    act(() => setLanguage("nl"));
    expect(setFor("tuin", 1, 1)?.words).toContain("roos");
    expect(symbolName("gift")).toBe("cadeau");
  });

  it("shows the setup and play screen in English", async () => {
    const router = createAppRouter(createMemoryHistory({ initialEntries: ["/geheime-code"] }));
    render(<App router={router} />);

    expect(await screen.findByRole("heading", { name: "Choose your code" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Garden/ }));
    fireEvent.click(screen.getByRole("button", { name: /Look & write/ }));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    const puzzle = useGeheimeCodeStore.getState().puzzle;
    expect(puzzle?.set.words).toEqual(setFor("tuin", 1, 1)?.words);
    expect(screen.getByText("Secret Code")).toBeTruthy();
    expect(screen.getByText("Garden · Look & write")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Choose a letter" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Erase" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /, empty$/ }).length).toBeGreaterThan(0);
  });
});
