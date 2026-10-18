import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";

afterEach(() => {
  cleanup();
});

describe("illustratievergelijking", () => {
  it("toont de drie sets en wisselt tussen licht en donker", async () => {
    const router = createAppRouter(createMemoryHistory({ initialEntries: ["/illustraties"] }));
    render(<App router={router} />);

    expect(
      await screen.findByRole("heading", { name: "Welke set past bij de spellen?" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Fluent Emoji Flat" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Phosphor Duotone" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Phosphor Fill" })).toBeTruthy();
    expect(screen.getAllByText("Sudoku")).toHaveLength(3);

    const toggle = screen.getByRole("button", { name: "Donkere achtergrond" });
    fireEvent.click(toggle);

    expect(screen.getByRole("button", { name: "Lichte achtergrond" })).toBeTruthy();
  });
});
