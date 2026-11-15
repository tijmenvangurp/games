import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { useMurdokuStore } from "@features/murdoku-game";

/**
 * jsdom tekent geen canvas. Het bord roept alleen tekenmethodes aan; de pixels
 * zijn geen testseam. Dit is dezelfde stille context als in de bordtest.
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

describe("Wie was het? in de catalogus en de router", () => {
  it("opent de zaak vanuit het startscherm", async () => {
    renderApp("/");

    fireEvent.click(await screen.findByRole("link", { name: /wie was het/i }));

    expect(await screen.findByRole("heading", { name: "Wie was het?" })).toBeTruthy();
    expect(
      screen.getByRole("img", { name: "Plattegrond van De verdwenen taart, 4 bij 4" }),
    ).toBeTruthy();
  });

  it("toont per verdachte een kaart met de Nederlandse aanwijzing", async () => {
    renderApp("/mysterie");

    expect(await screen.findByRole("heading", { name: "Wie is wie?" })).toBeTruthy();
    const sentenceOf = (part: string) =>
      screen.getByText((content) => content.trim().startsWith(part));
    expect(sentenceOf("Anna stond in")).toBeTruthy();
    expect(sentenceOf("Bram stond op")).toBeTruthy();
    expect(sentenceOf("Cato stond in")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Toon de keuken op het bord" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Toon een stoel op het bord" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Toon de badkamer op het bord" })).toBeTruthy();
    expect(screen.getByText("Anna")).toBeTruthy();
    expect(screen.getByText("Bram")).toBeTruthy();
    expect(screen.getByText("Cato")).toBeTruthy();
  });

  it("toont de bordregel en de objectlegenda", async () => {
    renderApp("/mysterie");

    expect(await screen.findByRole("heading", { name: "Waar mag je staan?" })).toBeTruthy();
    expect(
      screen.getByText("Het slachtoffer is alleen in een kamer met precies één verdachte."),
    ).toBeTruthy();

    const magWel = screen.getByRole("list", { name: "Hier mag je staan" });
    expect(within(magWel).getByText("Bed")).toBeTruthy();
    expect(within(magWel).getByText("Stoel")).toBeTruthy();
    expect(within(magWel).getByText("Tapijt")).toBeTruthy();

    const magNiet = screen.getByRole("list", { name: "Hier mag je niet staan" });
    expect(within(magNiet).getByText("Tafel")).toBeTruthy();
    expect(within(magNiet).getByText("Boekenkast")).toBeTruthy();

    expect(screen.getByText(/Een raam is geen vakje/)).toBeTruthy();
  });

  it("start met een leeg bord en toont rij- en kolomlabels", async () => {
    renderApp("/mysterie");

    expect(await screen.findByRole("heading", { name: "Wie was het?" })).toBeTruthy();
    expect(screen.getByText("R1")).toBeTruthy();
    expect(screen.getByText("K1")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Anna, rij/ })).toBeNull();
    expect(screen.getByRole("button", { name: /^leeg, rij 1, kolom 2/ })).toBeTruthy();
  });

  it("plaatst een gekozen persoon en haalt hem met een tweede tik weg", async () => {
    renderApp("/mysterie");

    await screen.findByRole("heading", { name: "Wie is wie?" });
    fireEvent.click(screen.getByRole("button", { name: "Anna" }));

    const cell = screen.getByRole("button", { name: /^leeg, rij 1, kolom 2/ });
    fireEvent.click(cell);

    expect(useMurdokuStore.getState().play?.placements.get("A")).toBe(1);
    expect(screen.getByRole("button", { name: /^Anna, rij 1, kolom 2/ })).toBeTruthy();
    // Auto-kruis: de rij en kolom van Anna zijn weggestreept.
    expect(screen.getByRole("button", { name: /^kruisje, rij 2, kolom 2/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^Anna, rij 1, kolom 2/ }));

    expect(useMurdokuStore.getState().play?.placements.has("A")).toBe(false);
    expect(screen.getByRole("button", { name: /^leeg, rij 1, kolom 2/ })).toBeTruthy();
  });

  it("kruist een vrij vakje weg en weigert een niet-bezetbaar vakje", async () => {
    renderApp("/mysterie");

    await screen.findByRole("heading", { name: "Wie was het?" });
    fireEvent.click(screen.getByRole("button", { name: "Kruisjesstand" }));

    fireEvent.click(screen.getByRole("button", { name: /^leeg, rij 3, kolom 1/ }));
    expect(screen.getByRole("button", { name: /^kruisje, rij 3, kolom 1/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /rij 1, kolom 3/ }));
    expect(
      screen.getByRole("button", { name: /hier mag niemand staan, rij 1, kolom 3/ }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^kruisje, rij 1, kolom 3/ })).toBeNull();
  });

  it("maakt de laatste stap ongedaan", async () => {
    renderApp("/mysterie");

    await screen.findByRole("heading", { name: "Wie is wie?" });
    const undo = screen.getByRole("button", { name: "Ongedaan maken" });
    expect((undo as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Anna" }));
    fireEvent.click(screen.getByRole("button", { name: /^leeg, rij 1, kolom 2/ }));
    expect((undo as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(undo);

    expect(useMurdokuStore.getState().play?.placements.size).toBe(0);
    expect(screen.getByRole("button", { name: /^leeg, rij 1, kolom 2/ })).toBeTruthy();
    expect((undo as HTMLButtonElement).disabled).toBe(true);
  });
});

/** De drie verdachten van de instapzaak op hun oplossingsvakje. */
function placeIntroSolution(): void {
  fireEvent.click(screen.getByRole("button", { name: "Anna" }));
  fireEvent.click(screen.getByRole("button", { name: /^leeg, rij 1, kolom 2/ }));
  fireEvent.click(screen.getByRole("button", { name: "Bram" }));
  fireEvent.click(screen.getByRole("button", { name: /^leeg, rij 2, kolom 1/ }));
  fireEvent.click(screen.getByRole("button", { name: "Cato" }));
  fireEvent.click(screen.getByRole("button", { name: /^leeg, rij 3, kolom 4/ }));
}

async function renderSolvedIntro() {
  renderApp("/mysterie");
  await screen.findByRole("heading", { name: "Wie is wie?" });
  placeIntroSolution();
  fireEvent.click(screen.getByRole("button", { name: "Controleer" }));
}

describe("Wie was het? controleren en de afloop", () => {
  it("zet de controle pas aan als iedereen staat", async () => {
    renderApp("/mysterie");

    await screen.findByRole("heading", { name: "Wie is wie?" });
    const check = screen.getByRole("button", { name: "Controleer" });
    expect((check as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Anna" }));
    fireEvent.click(screen.getByRole("button", { name: /^leeg, rij 1, kolom 2/ }));
    expect((check as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Bram" }));
    fireEvent.click(screen.getByRole("button", { name: /^leeg, rij 2, kolom 1/ }));
    expect((check as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Cato" }));
    fireEvent.click(screen.getByRole("button", { name: /^leeg, rij 3, kolom 4/ }));
    expect((check as HTMLButtonElement).disabled).toBe(false);
  });

  it("geeft neutrale feedback bij een fout en houdt het bord staan", async () => {
    renderApp("/mysterie");

    await screen.findByRole("heading", { name: "Wie is wie?" });
    fireEvent.click(screen.getByRole("button", { name: "Anna" }));
    fireEvent.click(screen.getByRole("button", { name: /^leeg, rij 1, kolom 2/ }));
    fireEvent.click(screen.getByRole("button", { name: "Bram" }));
    fireEvent.click(screen.getByRole("button", { name: /^leeg, rij 2, kolom 1/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cato" }));
    fireEvent.click(screen.getByRole("button", { name: /rij 3, kolom 1/ }));

    fireEvent.click(screen.getByRole("button", { name: "Controleer" }));

    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Nog niet helemaal");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("region", { name: "De dader" })).toBeNull();
    expect(useMurdokuStore.getState().play?.wrongCheck).toBe(true);
    expect(useMurdokuStore.getState().play?.placements.get("C")).toBe(8);
    expect(screen.getByRole("button", { name: /^Cato, rij 3, kolom 1/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /rij 3, kolom 4/ }));

    expect(screen.queryByText(/Nog niet helemaal/)).toBeNull();
    expect(useMurdokuStore.getState().play?.wrongCheck).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Controleer" }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("onthult de dader en de kamer van het slachtoffer", async () => {
    await renderSolvedIntro();

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Opgelost!" })).toBeTruthy();
    expect(within(dialog).getByText("Cato was als enige bij Vera in de badkamer.")).toBeTruthy();

    const reveal = screen.getByRole("region", { name: "De dader" });
    expect(within(reveal).getByText("Cato was als enige bij Vera in de badkamer.")).toBeTruthy();

    // Het slachtoffer staat nu op het bord en de dader is de enige in haar kamer.
    expect(screen.getByRole("button", { name: /^Vera, rij 4, kolom 3/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Cato, rij 3, kolom 4/ })).toBeTruthy();
    expect(useMurdokuStore.getState().play?.phase).toBe("solved");
    expect((screen.getByRole("button", { name: "Controleer" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    // De viering kan weg om de omlijnde kamer rustig te bekijken.
    fireEvent.click(within(dialog).getByRole("button", { name: "Bekijk de plattegrond" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("region", { name: "De dader" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Nog een keer" })).toBeTruthy();
    expect(useMurdokuStore.getState().play?.phase).toBe("solved");
  });

  it("begint na de viering een nieuwe poging", async () => {
    await renderSolvedIntro();

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Nog een keer" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(useMurdokuStore.getState().play?.phase).toBe("playing");
    expect(screen.getByRole("button", { name: /^leeg, rij 1, kolom 2/ })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "De dader" })).toBeNull();
  });
});

describe("Wie was het? hints en tikbare woorden", () => {
  it("licht de kamer op als je op het woord in de aanwijzing tikt", async () => {
    renderApp("/mysterie");

    await screen.findByRole("heading", { name: "Wie is wie?" });
    const word = screen.getByRole("button", { name: "Toon de keuken op het bord" });
    fireEvent.click(word);

    expect(word.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("status").textContent).toContain("De keuken licht op.");
    // Alle vier de vakjes van de keuken lichten op.
    expect(screen.getByRole("button", { name: /^leeg, licht op, rij 1, kolom 1/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^leeg, licht op, rij 1, kolom 2/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^leeg, licht op, rij 2, kolom 1/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^leeg, licht op, rij 2, kolom 2/ })).toBeTruthy();
    // Een vakje buiten de keuken blijft gewoon.
    expect(screen.getByRole("button", { name: /^leeg, rij 3, kolom 4/ })).toBeTruthy();

    fireEvent.click(word);

    expect(word.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByRole("button", { name: /licht op/ })).toBeNull();
    expect(screen.getByRole("status").textContent).not.toContain("licht op");
  });

  it("licht het object op als je op het woord in de aanwijzing tikt", async () => {
    renderApp("/mysterie");

    await screen.findByRole("heading", { name: "Wie is wie?" });
    fireEvent.click(screen.getByRole("button", { name: "Toon een stoel op het bord" }));

    expect(screen.getByRole("button", { name: /^leeg, licht op, rij 2, kolom 1/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^leeg, licht op, rij 1, kolom 1/ })).toBeNull();
  });

  it("geeft een hint in trapjes: eerst wijzen, dan één persoon", async () => {
    renderApp("/mysterie");

    await screen.findByRole("heading", { name: "Wie is wie?" });
    const hintButton = screen.getByRole("button", { name: "Aanwijzing" });

    fireEvent.click(hintButton);

    // Eerst alleen wijzen: de keuken licht op en er verandert niets op het bord.
    expect(screen.getByRole("status").textContent).toContain(
      "Kijk eens naar de keuken, waar Bram nog kan staan.",
    );
    expect(screen.getByRole("button", { name: /^leeg, licht op, rij 1, kolom 1/ })).toBeTruthy();
    expect(useMurdokuStore.getState().play?.placements.size).toBe(0);

    fireEvent.click(hintButton);

    // Daarna één gedwongen zet, met een korte reden.
    expect(screen.getByRole("status").textContent).toContain(
      "Zet Bram op R2/K1, want hij stond op een stoel.",
    );
    expect(useMurdokuStore.getState().play?.placements.get("B")).toBe(4);
    expect(screen.getByRole("button", { name: /^Bram, (licht op, )?rij 2, kolom 1/ })).toBeTruthy();
    expect(useMurdokuStore.getState().hintsUsed).toBe(2);
  });

  it("geeft nooit meteen het eindantwoord en straft een hint niet", async () => {
    renderApp("/mysterie");

    await screen.findByRole("heading", { name: "Wie is wie?" });
    const hintButton = screen.getByRole("button", { name: "Aanwijzing" });
    for (let press = 0; press < 3; press += 1) fireEvent.click(hintButton);

    // De eerste hint plaatst Bram; de laatste persoon blijft aan het kind.
    expect(useMurdokuStore.getState().play?.placements.size).toBe(1);
    expect(useMurdokuStore.getState().play?.placements.has("C")).toBe(false);
    expect(useMurdokuStore.getState().play?.wrongCheck).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("streept na de lichte cue één onmogelijk vakje weg", async () => {
    renderApp("/mysterie");

    await screen.findByRole("heading", { name: "Wie is wie?" });
    fireEvent.click(screen.getByRole("button", { name: "Anna" }));
    fireEvent.click(screen.getByRole("button", { name: /^leeg, rij 1, kolom 2/ }));
    fireEvent.click(screen.getByRole("button", { name: "Bram" }));
    fireEvent.click(screen.getByRole("button", { name: /^leeg, rij 2, kolom 1/ }));

    const hintButton = screen.getByRole("button", { name: "Aanwijzing" });
    fireEvent.click(hintButton);
    fireEvent.click(hintButton);

    expect(screen.getByRole("status").textContent).toContain("Streep R3/K3 weg.");
    expect(useMurdokuStore.getState().play?.manualCrosses.has(10)).toBe(true);
    expect(
      screen.getByRole("button", { name: /^kruisje, (licht op, )?rij 3, kolom 3/ }),
    ).toBeTruthy();
  });

  it("zet de hintknop uit als de zaak opgelost is", async () => {
    await renderSolvedIntro();

    expect((screen.getByRole("button", { name: "Aanwijzing" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
