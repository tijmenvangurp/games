import { act, cleanup, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { LESSONS } from "@entities/typepret";
import { useDraaiwerkStore } from "@features/draaiwerk";
import { useGeheimeCodeStore } from "@features/geheime-code";
import { useTypepretStore } from "@features/typepret";
import {
  DEFAULT_WORD_SEARCH_SETTINGS,
  loadWordSearchState,
  useWordSearchStore,
} from "@features/word-search";
import { setLanguage } from "@shared/i18n";

function renderApp(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

function resetStores(): void {
  useWordSearchStore.setState({
    language: "nl",
    puzzle: null,
    found: [],
    lastFound: null,
    selected: [],
    dragStart: null,
    wrong: false,
    hint: null,
    settings: DEFAULT_WORD_SEARCH_SETTINGS,
  });
  useTypepretStore.setState({ language: null, lessonId: null, round: null, result: null });
  useGeheimeCodeStore.setState({
    language: null,
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
  });
  useDraaiwerkStore.setState({ feedback: null, feedbackTone: null });
}

beforeEach(() => {
  cleanup();
  act(() => setLanguage("nl"));
  localStorage.clear();
  resetStores();
});

afterEach(() => {
  cleanup();
  act(() => setLanguage("nl"));
  localStorage.clear();
  resetStores();
});

describe("taalwissel met een lopend spel", () => {
  it("zet een lopende Woordzoeker terug en bewaart de instellingen", async () => {
    renderApp("/woordzoeker");
    await screen.findByText("Kies je thema");

    act(() => useWordSearchStore.getState().start());
    const settings = useWordSearchStore.getState().settings;
    expect(useWordSearchStore.getState().puzzle).not.toBeNull();

    act(() => setLanguage("en"));

    expect(useWordSearchStore.getState().puzzle).toBeNull();
    expect(useWordSearchStore.getState().settings).toEqual(settings);
    expect(loadWordSearchState().puzzle).toBeNull();
    expect(await screen.findByText("Choose your theme")).toBeTruthy();
  });

  it("hervat geen Nederlandse Woordzoeker-puzzel in het Engels", () => {
    useWordSearchStore.getState().start();
    const puzzle = useWordSearchStore.getState().puzzle;
    expect(puzzle).not.toBeNull();

    act(() => setLanguage("en"));
    localStorage.setItem(
      "games.word-search.v2",
      JSON.stringify({
        language: "nl",
        settings: useWordSearchStore.getState().settings,
        puzzle,
        found: [],
      }),
    );

    expect(loadWordSearchState().puzzle).toBeNull();
  });

  it("zet een lopende Typepret-ronde terug", async () => {
    renderApp("/typepret");
    await screen.findByRole("heading", { name: "Kies je les" });

    const lesson = LESSONS[0];
    expect(lesson).toBeDefined();
    act(() => useTypepretStore.getState().start(lesson!.id));
    expect(useTypepretStore.getState().round).not.toBeNull();

    act(() => setLanguage("en"));

    expect(useTypepretStore.getState().lessonId).toBeNull();
    expect(useTypepretStore.getState().round).toBeNull();
    expect(useTypepretStore.getState().result).toBeNull();
    expect(await screen.findByRole("heading", { name: "Choose your lesson" })).toBeTruthy();
  });

  it("zet een lopende Geheime Code-puzzel terug", async () => {
    renderApp("/geheime-code");
    await screen.findByRole("heading", { name: "Geheime Code" });

    act(() => useGeheimeCodeStore.getState().start());
    expect(useGeheimeCodeStore.getState().puzzle).not.toBeNull();

    act(() => setLanguage("en"));

    expect(useGeheimeCodeStore.getState().puzzle).toBeNull();
    expect(useGeheimeCodeStore.getState().entries).toEqual([]);
    expect(useGeheimeCodeStore.getState().result).toBeNull();
    expect(await screen.findByRole("heading", { name: "Secret Code" })).toBeTruthy();
  });

  it("laat Draaiwerk-feedback in de oude taal verdwijnen", async () => {
    renderApp("/draaiwerk");
    await screen.findByRole("heading", { name: "Draaiwerk" });
    act(() =>
      useDraaiwerkStore.setState({ feedback: "Dat past hier niet.", feedbackTone: "warn" }),
    );

    act(() => setLanguage("en"));

    expect(useDraaiwerkStore.getState().feedback).toBeNull();
    expect(useDraaiwerkStore.getState().feedbackTone).toBeNull();
  });
});
