import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TutorialBoard } from "@features/chess-tutorial";

afterEach(cleanup);

describe("TutorialBoard", () => {
  it("starts with a visual preview and one short instruction", () => {
    const { container } = render(<TutorialBoard />);

    expect(screen.getByRole("heading", { name: "De Toren-trein" })).toBeTruthy();
    expect(screen.getByText("Kijk! Zo rijdt de toren. Tik op een blauwe stip.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Kijk" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Toon zet" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Opnieuw" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Volgende les" })).toBeNull();
    expect(screen.getByRole("group", { name: /coördinaten/i })).toBeTruthy();
    expect(
      container.querySelector('[data-square="e5"] [data-target-square="true"]'),
    ).not.toBeNull();
    expect(screen.getByText("Waarom?")).toBeTruthy();
  });

  it("switches between the preview and the task", () => {
    render(<TutorialBoard />);

    fireEvent.click(screen.getByRole("button", { name: "Kijk" }));
    expect(screen.getByText("Rijd met de toren naar de ster.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Kijk" }).getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "Kijk" }));
    expect(screen.getByText("Kijk! Zo rijdt de toren. Tik op een blauwe stip.")).toBeTruthy();
  });

  it("lets the child pick another lesson without showing all titles at once", () => {
    render(<TutorialBoard />);

    fireEvent.click(screen.getByText("Kies een les"));
    fireEvent.click(screen.getByRole("button", { name: "Les 4: De Paardensprong" }));

    expect(screen.getByRole("heading", { name: "De Paardensprong" })).toBeTruthy();
    expect(
      screen.getByText("Kijk! Het paard springt in een L. Tik op een blauwe stip."),
    ).toBeTruthy();
  });
});
