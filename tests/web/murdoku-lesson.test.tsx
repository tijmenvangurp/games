import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { useMurdokuStore } from "@features/murdoku-game";

/**
 * jsdom tekent geen canvas. De speelpagina roept alleen tekenmethodes aan; de
 * pixels zijn geen testseam. De uitleg zelf gebruikt geen canvas.
 */
function silentContext(): CanvasRenderingContext2D {
  const target: Record<string, unknown> = {
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    measureText: (text: string) => ({ width: String(text).length * 6 }),
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    createRadialGradient: () => ({ addColorStop: () => undefined }),
  };
  return new Proxy(target, {
    get: (object, property: string) => (property in object ? object[property] : () => undefined),
    set: (object, property: string, value) => {
      object[property] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useMurdokuStore.setState({ puzzle: null, play: null, history: [] });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => silentContext());
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderApp(path = "/") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

/** De zes schermen in de volgorde van de uitleg. */
const STEP_TITLES = [
  "Het doel",
  "Eén per rij en kolom",
  "Wat mag je bezetten?",
  "Wat betekent naast?",
  "Plaatsen, kruisen en terug",
  "De onthulling",
];

/** De woordenlijst met alle aanwijzingen van de eerste versie. */
const GLOSSARY_TERMS = [
  "alleen",
  "alleen met",
  "leeg",
  "naast",
  "hoek",
  "voor een raam",
  "rij en kolom",
  "links en rechts",
  "boven en onder",
  "de enige op een stoel",
  "twee personen naast een tafel",
  "ruimte",
];

describe("Wie was het? — de uitleg is bereikbaar", () => {
  it("opent de uitleg met de ?-knop op de speelpagina", async () => {
    renderApp("/mysterie");

    await screen.findByRole("heading", { name: "Wie was het?" });
    fireEvent.click(screen.getByRole("button", { name: "Uitleg en woordenlijst" }));

    expect(await screen.findByRole("heading", { name: "Zo werkt het" })).toBeTruthy();
    expect(screen.getByText("Stap 1 van 6")).toBeTruthy();
  });

  it("houdt de uitleg ook bij het eerste bezoek zichtbaar", async () => {
    renderApp("/mysterie");

    await screen.findByRole("heading", { name: "Wie was het?" });
    const link = screen.getByRole("link", { name: "Zo werkt het" });
    expect(link.getAttribute("href")).toBe("/mysterie/les");
  });

  it("opent de uitleg rechtstreeks op de eigen route", async () => {
    renderApp("/mysterie/les");

    expect(await screen.findByRole("heading", { name: "Zo werkt het" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Het doel" })).toBeTruthy();
  });
});

describe("Wie was het? — de zes schermen", () => {
  it("bladert met één stap per scherm door de uitleg", async () => {
    renderApp("/mysterie/les");
    await screen.findByRole("heading", { name: "Zo werkt het" });

    for (const [index, title] of STEP_TITLES.entries()) {
      expect(screen.getByText(`Stap ${index + 1} van 6`)).toBeTruthy();
      expect(screen.getByRole("heading", { name: title })).toBeTruthy();
      if (index < STEP_TITLES.length - 1) {
        fireEvent.click(screen.getByRole("button", { name: "Volgende stap" }));
      }
    }

    // Op het laatste scherm is er geen volgende stap meer.
    expect(
      (screen.getByRole("button", { name: "Volgende stap" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("gaat met de stapknoppen meteen naar een scherm", async () => {
    renderApp("/mysterie/les");
    await screen.findByRole("heading", { name: "Zo werkt het" });

    fireEvent.click(screen.getByRole("button", { name: "Stap 4: Wat betekent naast?" }));

    expect(screen.getByText("Stap 4 van 6")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Wat betekent naast?" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Vorige stap" }));
    expect(screen.getByText("Stap 3 van 6")).toBeTruthy();
  });

  it("toont bij elke stap een diagram met een beschrijving", async () => {
    renderApp("/mysterie/les");
    await screen.findByRole("heading", { name: "Zo werkt het" });

    for (const [index, title] of STEP_TITLES.entries()) {
      const step = screen.getByRole("region", { name: title });
      const diagram = within(step).getByRole("img");
      expect(diagram.getAttribute("aria-label")?.length).toBeGreaterThan(10);
      if (index < STEP_TITLES.length - 1) {
        fireEvent.click(screen.getByRole("button", { name: "Volgende stap" }));
      }
    }
  });
});

describe("Wie was het? — de woordenlijst", () => {
  it("bevat alle aanwijzingen van de eerste versie, elk met een diagram", async () => {
    renderApp("/mysterie/les");
    await screen.findByRole("heading", { name: "Zo werkt het" });

    const glossary = screen.getByRole("region", { name: "Woordenlijst" });
    for (const term of GLOSSARY_TERMS) {
      expect(within(glossary).getByRole("heading", { name: term })).toBeTruthy();
    }

    const diagrams = within(glossary).getAllByRole("img");
    expect(diagrams.length).toBeGreaterThanOrEqual(GLOSSARY_TERMS.length);
    for (const diagram of diagrams) {
      expect(diagram.getAttribute("aria-label")?.length).toBeGreaterThan(10);
    }
  });

  it("legt de lastige woorden in gewone taal uit", async () => {
    renderApp("/mysterie/les");
    await screen.findByRole("heading", { name: "Zo werkt het" });

    const glossary = screen.getByRole("region", { name: "Woordenlijst" });
    expect(
      within(glossary).getByText(/Aan de andere kant van de muur is niet naast/i),
    ).toBeTruthy();
    expect(within(glossary).getByText(/Het slachtoffer telt gewoon mee/i)).toBeTruthy();
  });
});

describe("Wie was het? — de objectlegenda in de uitleg", () => {
  it("toont bezetbare en niet-bezetbare objecten", async () => {
    renderApp("/mysterie/les");
    await screen.findByRole("heading", { name: "Zo werkt het" });

    const legend = screen.getByRole("region", { name: "Waar mag je staan?" });
    const magWel = within(legend).getByRole("list", { name: "Hier mag je staan" });
    expect(within(magWel).getByText("Bed")).toBeTruthy();
    expect(within(magWel).getByText("Stoel")).toBeTruthy();
    expect(within(magWel).getByText("Tapijt")).toBeTruthy();

    const magNiet = within(legend).getByRole("list", { name: "Hier mag je niet staan" });
    expect(within(magNiet).getByText("Tafel")).toBeTruthy();
    expect(within(magNiet).getByText("Plant")).toBeTruthy();
    expect(within(magNiet).getByText("Tv")).toBeTruthy();
    expect(within(magNiet).getByText("Boekenkast")).toBeTruthy();
    expect(within(magNiet).getByText("Doos")).toBeTruthy();

    expect(within(legend).getByText(/Een raam is geen vakje/)).toBeTruthy();
  });
});
