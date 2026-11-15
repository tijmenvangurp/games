import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";

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
    expect(screen.getByText("Anna stond in de keuken.")).toBeTruthy();
    expect(screen.getByText("Bram stond op een stoel.")).toBeTruthy();
    expect(screen.getByText("Cato stond in de badkamer.")).toBeTruthy();
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
});
