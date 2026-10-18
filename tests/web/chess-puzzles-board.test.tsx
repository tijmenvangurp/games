import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PUZZLES, PuzzlePlay } from "@features/chess-puzzles";

afterEach(cleanup);

describe("PuzzlePlay", () => {
  it("shows the puzzle, coordinates and navigation", () => {
    const onNext = vi.fn();
    render(
      <PuzzlePlay
        difficulty="easy"
        index={0}
        puzzle={PUZZLES[0]}
        total={12}
        onDifficultyChange={vi.fn()}
        onNext={onNext}
      />,
    );

    expect(screen.getByRole("heading", { name: "Zet schaakmat!" })).toBeTruthy();
    expect(screen.getByText(/Puzzel 1 van 12/)).toBeTruthy();
    expect(screen.getByRole("group", { name: /coördinaten/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hint" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Opnieuw" })).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Volgende puzzel" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(onNext).not.toHaveBeenCalled();
  });

  it("shows the tactic prompt for a best-move puzzle", () => {
    const puzzle = PUZZLES.find((candidate) => candidate.kind === "tactic");
    if (!puzzle) {
      throw new Error("Tactic puzzle not found");
    }

    render(
      <PuzzlePlay
        difficulty={puzzle.difficulty}
        index={0}
        puzzle={puzzle}
        total={1}
        onDifficultyChange={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Vind de beste zet!" })).toBeTruthy();
    expect(screen.getByText(/Welke zet is de beste\?/)).toBeTruthy();
  });
});
