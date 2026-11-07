import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { currentTarget, emptyProgress, LESSONS } from "@entities/typepret";
import { loadTypepretProgress, useTypepretStore } from "@features/typepret";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useTypepretStore.setState({
    progress: emptyProgress(),
    lessonId: null,
    round: null,
    result: null,
  });
});

afterEach(() => {
  cleanup();
});

function renderTypepret() {
  const router = createAppRouter(createMemoryHistory({ initialEntries: ["/typepret"] }));
  render(<App router={router} />);
}

function press(key: string, init: KeyboardEventInit = {}) {
  act(() => {
    fireEvent.keyDown(window, { key, ...init });
  });
}

function target(): string {
  return currentTarget(useTypepretStore.getState().round ?? (undefined as never)) ?? "";
}

describe("typepret scherm", () => {
  it("toont lessen en houdt volgende lessen dicht", async () => {
    renderTypepret();
    expect(await screen.findByRole("heading", { name: "Kies je les" })).toBeTruthy();
    const first = screen.getByRole("button", { name: /F en J/ }) as HTMLButtonElement;
    expect(first.disabled).toBe(false);
    const second = screen.getByRole("button", { name: /D en K/ }) as HTMLButtonElement;
    expect(second.disabled).toBe(true);
    expect(LESSONS.length).toBe(8);
  });

  it("speelt een ronde, blijft bij een fout en slaat de voortgang lokaal op", async () => {
    renderTypepret();
    fireEvent.click(await screen.findByRole("button", { name: /F en J/ }));

    const first = target();
    press(first === "f" ? "j" : "f");
    expect(useTypepretStore.getState().round?.index).toBe(0);
    expect(screen.getByText(/Probeer nog eens/)).toBeTruthy();

    // Modifiers, Shift en Backspace doen niets; hoofdletters tellen wel.
    press(first, { ctrlKey: true });
    press("Shift");
    press("Backspace");
    expect(useTypepretStore.getState().round?.index).toBe(0);
    press(first.toUpperCase());
    expect(useTypepretStore.getState().round?.index).toBe(1);

    for (let count = 1; count < 20; count += 1) {
      press(target());
    }

    // Eén fout in twintig toetsen is 95%: genoeg om door te gaan.
    expect(await screen.findByText("Goed geoefend!")).toBeTruthy();
    expect(loadTypepretProgress().log).toHaveLength(1);
  });

  it("zegt bijna bij 71% en stelt dezelfde les nog eens voor", async () => {
    renderTypepret();
    fireEvent.click(await screen.findByRole("button", { name: /F en J/ }));

    for (let count = 0; count < 20; count += 1) {
      const key = target();
      if (count < 8) {
        press(key === "f" ? "j" : "f");
      }
      press(key);
    }

    expect(await screen.findByText("Bijna!")).toBeTruthy();
    expect(useTypepretStore.getState().result?.verdict).toBe("bijna");
    expect(loadTypepretProgress().completed).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Nog een ronde" }));
    expect(useTypepretStore.getState().round?.index).toBe(0);
    expect(useTypepretStore.getState().result).toBeNull();
  });

  it("ontgrendelt de volgende les na een foutloze ronde", async () => {
    renderTypepret();
    fireEvent.click(await screen.findByRole("button", { name: /F en J/ }));
    for (let count = 0; count < 20; count += 1) {
      press(target());
    }

    expect(await screen.findByText("Goed geoefend!")).toBeTruthy();
    expect(loadTypepretProgress().completed).toEqual(["f-j"]);

    fireEvent.click(screen.getByRole("button", { name: "Andere les" }));
    const second = (await screen.findByRole("button", { name: /D en K/ })) as HTMLButtonElement;
    expect(second.disabled).toBe(false);
  });

  it("negeert toetsen als er geen ronde loopt", () => {
    renderTypepret();
    press("f");
    expect(useTypepretStore.getState().round).toBeNull();
  });
});
