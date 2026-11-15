import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// De ketting kiest zijn animatie op basis van `useReducedMotion`. Motion leest
// die voorkeur één keer bij de eerste mount, dus de stub moet vóór de imports
// staan. Dit bestand heeft daarom een eigen module-register.
vi.hoisted(() => {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

import { drive, levelAt } from "@entities/gear";
import { useDraaiwerkStore } from "@features/draaiwerk";
import { DraaiwerkScreen } from "@pages/draaiwerk";
import { MotionProvider } from "@shared/ui";

function renderGame() {
  render(
    <MotionProvider>
      <DraaiwerkScreen onHome={() => {}} />
    </MotionProvider>,
  );
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useDraaiwerkStore.setState({ unlocked: 4, finished: false });
  useDraaiwerkStore.getState().startLevel(3);
});

afterEach(() => {
  cleanup();
});

describe("draaiwerk: reduced motion", () => {
  it("toont een stilstaande ketting zonder animateMotion", () => {
    const level = levelAt(3);
    const chain = level.tray.find((item) => item.kind === "chain");
    if (!chain) {
      throw new Error("Level 4 has no chain");
    }

    useDraaiwerkStore.getState().selectTray(chain.id);
    useDraaiwerkStore.getState().tapGear("motor");
    useDraaiwerkStore.getState().tapGear("output:target-1");
    expect(useDraaiwerkStore.getState().status).toBe("solved");

    const connection = drive(level, useDraaiwerkStore.getState().placements).connections[0];
    if (!connection) {
      throw new Error("Level 4 has no chain connection");
    }
    const count = Math.max(
      8,
      Math.round(connection.length / (connection.chainPitch ?? connection.length)),
    );

    renderGame();

    const band = document.querySelector('[data-kind="chain"]');
    expect(band).toBeTruthy();
    expect(document.querySelectorAll("animateMotion")).toHaveLength(0);
    expect(band?.querySelector('[data-chain-static="true"]')).toBeTruthy();
    const chainBand = band?.querySelector("[data-chain-links]");
    expect(chainBand?.getAttribute("data-moving")).toBe("false");
    expect(chainBand?.getAttribute("data-chain-links")).toBe(String(count));
    expect(band?.querySelectorAll("[data-chain-link]")).toHaveLength(0);
  });
});
