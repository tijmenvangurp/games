import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadMurdokuLevel } from "@entities/murdoku";
import { MURDOKU_INTRO_LEVEL, MURDOKU_INTRO_SOLUTION, MurdokuBoard } from "@features/murdoku-game";

/**
 * jsdom tekent geen canvas. Voor de mount- en aria-test is een stille 2D-context
 * genoeg: het bord roept alleen tekenmethodes aan. De pixels zijn bewust geen
 * testseam; het testbeeld op 390 px en 1024 px komt uit Playwright.
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

const puzzle = loadMurdokuLevel(MURDOKU_INTRO_LEVEL);

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => silentContext());
  Object.defineProperty(window, "devicePixelRatio", {
    configurable: true,
    value: 2,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Object.defineProperty(window, "devicePixelRatio", {
    configurable: true,
    value: 1,
  });
});

describe("MurdokuBoard", () => {
  it("toont één canvas met een beschrijvend label", () => {
    render(
      <MurdokuBoard
        placements={MURDOKU_INTRO_SOLUTION}
        puzzle={puzzle}
        title="De verdwenen taart"
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "Plattegrond van De verdwenen taart, 4 bij 4",
      }),
    ).toBeTruthy();
    expect(document.querySelectorAll("canvas")).toHaveLength(1);
  });

  it("tekent op device-pixel-ratio en schaalt het canvas mee", () => {
    render(<MurdokuBoard puzzle={puzzle} title="De verdwenen taart" />);

    const canvas = screen.getByRole("img") as HTMLCanvasElement;
    // jsdom meet geen breedte: de fallback van 320 px min 22 px rijlabels geeft
    // 4 × 74 px vakjes, op dpr 2 dus 592 × 592 pixels.
    expect(canvas.width).toBe(592);
    expect(canvas.height).toBe(592);
    expect(canvas.style.width).toBe("296px");
    expect(canvas.style.height).toBe("296px");
  });

  it("blijft werken zonder plaatsingen", () => {
    render(<MurdokuBoard puzzle={puzzle} title="De verdwenen taart" />);

    expect(screen.getByRole("img")).toBeTruthy();
  });
});
