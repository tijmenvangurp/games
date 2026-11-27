import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { GAME_CATEGORIES, gameCatalog, gameText, categoryLabel } from "@entities/game";
import { defineTexts, getTexts, setLanguage } from "@shared/i18n";
import { hasRecordedSpeech, praiseFor } from "@shared/lib";

const STORAGE_KEY = "games.language.v1";

function renderApp(path = "/") {
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
});

afterEach(() => {
  cleanup();
  resetToDutch();
});

describe("taalkeuze", () => {
  it("start in het Nederlands", async () => {
    renderApp("/");

    expect(await screen.findByRole("heading", { name: "Spellen" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Nederlands" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(document.documentElement.lang).toBe("nl");
  });

  it("wisselt het menu naar het Engels en onthoudt de keuze", async () => {
    renderApp("/");
    await screen.findByRole("heading", { name: "Spellen" });

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(await screen.findByRole("heading", { name: "Games" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Surprise me!" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Puzzles & Logic" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Word Search/ })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Language" })).toBeTruthy();
    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toBe("Games");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("en");

    fireEvent.click(screen.getByRole("button", { name: "Nederlands" }));
    expect(await screen.findByRole("heading", { name: "Spellen" })).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("nl");
  });

  it("werkt de meta description bij", () => {
    const meta = document.createElement("meta");
    meta.name = "description";
    document.head.append(meta);

    try {
      act(() => setLanguage("en"));
      expect(meta.content).toBe("Sudoku and other games for kids. Works on phone and tablet.");

      act(() => setLanguage("nl"));
      expect(meta.content).toBe(
        "Sudoku en andere spelletjes voor kinderen. Werkt op telefoon en tablet.",
      );
    } finally {
      meta.remove();
    }
  });

  it("vertaalt de gedeelde spelknoppen", async () => {
    act(() => setLanguage("en"));
    renderApp("/sudoku");

    expect(await screen.findByRole("button", { name: "Back to the menu" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Turn sound (on|off)/ })).toBeTruthy();
  });

  it("heeft voor elk spel en elke categorie een Engelse tekst", () => {
    for (const game of gameCatalog) {
      expect(gameText(game, "nl")).toMatchObject({ name: game.name });
      expect(gameText(game, "en").name.length).toBeGreaterThan(0);
      expect(gameText(game, "en").description.length).toBeGreaterThan(0);
    }
    for (const category of GAME_CATEGORIES) {
      expect(categoryLabel(category.id, "nl")).toBe(category.label);
      expect(categoryLabel(category.id, "en")).not.toBe(category.label);
    }
  });

  it("geeft bemoediging in de gekozen taal", () => {
    expect(praiseFor(0)).toBe("Goedzo!");
    act(() => setLanguage("en"));
    expect(praiseFor(0)).toBe("Well done!");
  });

  it("kiest de teksten van een spel in de actieve taal", () => {
    const texts = defineTexts(
      { start: "Spelen", stars: (count: number) => `${count} sterren` },
      { start: "Play", stars: (count: number) => `${count} stars` },
    );
    expect(getTexts(texts).stars(3)).toBe("3 sterren");
    act(() => setLanguage("en"));
    expect(getTexts(texts).start).toBe("Play");
    expect(getTexts(texts).stars(3)).toBe("3 stars");
  });

  it("zet de Nederlandse voorleesstem uit in het Engels", async () => {
    expect(hasRecordedSpeech()).toBe(true);
    act(() => setLanguage("en"));
    expect(hasRecordedSpeech()).toBe(false);

    renderApp("/rekenen");
    await screen.findByRole("button", { name: "Back to the menu" });
    expect(screen.queryByRole("button", { name: /reading aloud/ })).toBeNull();
  });
});
