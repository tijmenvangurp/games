import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileSwitcher, loadProfileState, useProfileStore } from "@features/profile-switcher";
import { PROFILE_STORAGE_KEY } from "@shared/lib";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useProfileStore.setState({ state: loadProfileState(), error: null });
});

afterEach(() => {
  cleanup();
});

function renderSwitcher() {
  const onProfileChanged = vi.fn();
  render(<ProfileSwitcher onProfileChanged={onProfileChanged} />);
  return onProfileChanged;
}

describe("profile switcher", () => {
  it("starts with profile 1 and marks it active", () => {
    renderSwitcher();

    expect(screen.getByRole("heading", { name: "Profiel" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Speler 1" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("creates a profile and switches to it", () => {
    const onProfileChanged = renderSwitcher();

    fireEvent.click(screen.getByRole("button", { name: "Profiel toevoegen" }));
    const name = screen.getByLabelText("Naam") as HTMLInputElement;
    expect(name.value).toBe("Speler 2");

    fireEvent.change(name, { target: { value: "Sam" } });
    fireEvent.click(screen.getByRole("button", { name: "Vos" }));
    fireEvent.click(screen.getByRole("button", { name: "Profiel maken" }));

    expect(onProfileChanged).toHaveBeenCalledTimes(1);
    expect(useProfileStore.getState().state.activeProfileId).toBe("p2");
    expect(useProfileStore.getState().state.profiles).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Sam" }).getAttribute("aria-pressed")).toBe("true");

    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? "null")).toMatchObject({
      activeProfileId: "p2",
      profiles: [{ name: "Speler 1" }, { name: "Sam", avatar: "fox" }],
    });
  });

  it("switches back to an existing profile", () => {
    const onProfileChanged = renderSwitcher();

    fireEvent.click(screen.getByRole("button", { name: "Profiel toevoegen" }));
    fireEvent.click(screen.getByRole("button", { name: "Profiel maken" }));
    expect(useProfileStore.getState().state.activeProfileId).toBe("p2");

    fireEvent.click(screen.getByRole("button", { name: "Speler 1" }));

    expect(onProfileChanged).toHaveBeenCalledTimes(2);
    expect(useProfileStore.getState().state.activeProfileId).toBe("p1");
    expect(screen.getByRole("button", { name: "Speler 1" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("renames an existing profile and changes its avatar", () => {
    const onProfileChanged = renderSwitcher();

    fireEvent.click(screen.getByText("Beheer"));
    fireEvent.click(screen.getByRole("button", { name: "Wijzig profiel Speler 1" }));

    const name = screen.getByLabelText("Naam") as HTMLInputElement;
    expect(name.value).toBe("Speler 1");
    fireEvent.change(name, { target: { value: "Emma" } });
    fireEvent.click(screen.getByRole("button", { name: "Vos" }));
    fireEvent.click(screen.getByRole("button", { name: "Opslaan" }));

    expect(onProfileChanged).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Emma" }).getAttribute("aria-pressed")).toBe("true");
    expect(useProfileStore.getState().state.profiles[0]).toMatchObject({
      id: "p1",
      name: "Emma",
      avatar: "fox",
    });

    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    expect(JSON.parse(raw ?? "null")).toMatchObject({
      profiles: [{ id: "p1", name: "Emma", avatar: "fox" }],
    });
  });

  it("deletes a profile after confirmation and keeps the last one", () => {
    const onProfileChanged = renderSwitcher();

    fireEvent.click(screen.getByRole("button", { name: "Profiel toevoegen" }));
    fireEvent.click(screen.getByRole("button", { name: "Profiel maken" }));
    fireEvent.click(screen.getByText("Beheer"));

    fireEvent.click(screen.getByRole("button", { name: "Verwijder profiel Speler 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Ja, verwijder" }));

    expect(onProfileChanged).toHaveBeenCalledTimes(2);
    expect(useProfileStore.getState().state.profiles).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Verwijder profiel Speler 1" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("shows an error and keeps the profiles when an import is invalid", async () => {
    const onProfileChanged = renderSwitcher();
    fireEvent.click(screen.getByText("Beheer"));

    const input = screen.getByLabelText("Profielen importeren") as HTMLInputElement;
    const file = new File(["not json"], "profiles.json", { type: "application/json" });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("geen geldig profielenbestand");
    });
    expect(onProfileChanged).not.toHaveBeenCalled();
    expect(useProfileStore.getState().state.profiles).toHaveLength(1);
  });
});
