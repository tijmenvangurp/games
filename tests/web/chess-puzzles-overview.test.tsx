import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PUZZLES, PuzzleOverview } from "@features/chess-puzzles";

afterEach(cleanup);

const easyPuzzles = PUZZLES.filter((puzzle) => puzzle.difficulty === "easy");

describe("PuzzleOverview", () => {
  it("shows progress, solved puzzles and a continuation", () => {
    const onSelect = vi.fn();
    const firstSolved = easyPuzzles[0];
    const second = easyPuzzles[1];

    render(
      <PuzzleOverview
        difficulty="easy"
        puzzles={easyPuzzles}
        solved={new Set([firstSolved.id])}
        onDifficultyChange={vi.fn()}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole("heading", { name: "Kies een puzzel" })).toBeTruthy();
    expect(screen.getByText(`1 van ${easyPuzzles.length} opgelost`)).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Voortgang" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Puzzel 1, opgelost" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Puzzel 2, nog niet opgelost" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Puzzel 2, nog niet opgelost" }));
    expect(onSelect).toHaveBeenCalledWith(second.id);

    fireEvent.click(screen.getByRole("button", { name: "Verder" }));
    expect(onSelect).toHaveBeenLastCalledWith(second.id);
  });

  it("changes difficulty from the overview", () => {
    const onDifficultyChange = vi.fn();

    render(
      <PuzzleOverview
        difficulty="easy"
        puzzles={easyPuzzles}
        solved={new Set()}
        onDifficultyChange={onDifficultyChange}
        onSelect={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Lastig/ }));
    expect(onDifficultyChange).toHaveBeenCalledWith("medium");
  });
});
