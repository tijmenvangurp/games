import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TutorialBoard } from "@features/chess-tutorial";

afterEach(cleanup);

describe("TutorialBoard", () => {
  it("shows the level, coordinates and navigation", () => {
    render(<TutorialBoard />);

    expect(screen.getByRole("heading", { name: "De Toren-trein" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Opnieuw" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Volgende" })).toBeTruthy();
    expect(screen.getByRole("group", { name: /coördinaten/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "De Paardensprong" }));
    expect(screen.getByRole("heading", { name: "De Paardensprong" })).toBeTruthy();
  });
});
