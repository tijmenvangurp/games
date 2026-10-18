import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PUZZLES, PuzzlePlay } from "@features/chess-puzzles";

afterEach(cleanup);

describe("PuzzlePlay", () => {
  it("shows the puzzle, coordinates and navigation", () => {
    const onNext = vi.fn();
    render(<PuzzlePlay index={0} puzzle={PUZZLES[0]} total={25} onNext={onNext} />);

    expect(screen.getByRole("heading", { name: "Zet schaakmat!" })).toBeTruthy();
    expect(screen.getByText(/Puzzel 1 van 25/)).toBeTruthy();
    expect(screen.getByRole("group", { name: /coördinaten/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hint" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Opnieuw" })).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Volgende puzzel" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(onNext).not.toHaveBeenCalled();
  });
});
