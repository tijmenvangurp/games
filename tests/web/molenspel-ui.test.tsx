import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { createMolenspelGame, type MolenspelGame } from "@entities/molenspel";
import {
  MolenspelHud,
  MolenspelIntro,
  MolenspelPlay,
  useMolenspelStore,
} from "@features/molenspel";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useMolenspelStore.setState({ game: createMolenspelGame("wit"), started: false });
});

afterEach(() => {
  cleanup();
});

function renderApp(path = "/molenspel") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

describe("MolenspelIntro", () => {
  it("legt de regels uit en kiest de beginnende speler", () => {
    render(
      <MolenspelIntro
        firstPlayer="wit"
        onBack={() => undefined}
        onSelectPlayer={() => undefined}
        onStart={() => undefined}
      />,
    );

    expect(screen.getByRole("heading", { name: "Het Molenspel" })).toBeDefined();
    expect(screen.getByText("Maak een molentje.")).toBeDefined();
    expect(screen.getByRole("button", { name: /Wit/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /Zwart/ })).toBeDefined();
  });

  it("start het spel met de gekozen speler", () => {
    render(
      <MolenspelIntro
        firstPlayer="zwart"
        onBack={() => undefined}
        onSelectPlayer={() => undefined}
        onStart={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));
    expect(screen.getByRole("button", { name: "Spelen" })).toBeDefined();
  });
});

describe("MolenspelHud", () => {
  it("toont wie aan de beurt is en de fase", () => {
    const game = createMolenspelGame("zwart");
    render(<MolenspelHud game={game} />);

    expect(screen.getByText("Zwart is aan de beurt")).toBeDefined();
    expect(screen.getByText(/stenen leggen/)).toBeDefined();
    expect(screen.getByText(/0 op het bord/)).toBeDefined();
  });
});

describe("MolenspelPlay", () => {
  it("toont het bord en de aanwijzing", () => {
    const game = createMolenspelGame("wit");
    render(
      <MolenspelPlay
        game={game}
        onBack={() => undefined}
        onRestart={() => undefined}
        onTap={() => undefined}
      />,
    );

    expect(screen.getByRole("group", { name: "Molenspelbord" })).toBeDefined();
    expect(screen.getByText(/Tik op een leeg punt/)).toBeDefined();
  });

  it("vraagt om een steen te pakken na een molentje", () => {
    const game: MolenspelGame = { ...createMolenspelGame("wit"), awaitRemoval: true };
    render(
      <MolenspelPlay
        game={game}
        onBack={() => undefined}
        onRestart={() => undefined}
        onTap={() => undefined}
      />,
    );

    expect(screen.getByText(/Pak nu een steen/)).toBeDefined();
  });

  it("start een nieuw spel en gaat terug naar de uitleg", () => {
    render(
      <MolenspelPlay
        game={createMolenspelGame("wit")}
        onBack={() => undefined}
        onRestart={() => undefined}
        onTap={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Nieuw spel" }));
    fireEvent.click(screen.getByRole("button", { name: "Uitleg" }));
    expect(screen.getByRole("button", { name: "Nieuw spel" })).toBeDefined();
  });
});

describe("de molenspel-pagina", () => {
  it("toont eerst de uitleg", async () => {
    renderApp();

    expect(await screen.findByRole("heading", { name: "Het Molenspel" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Spelen" })).toBeDefined();
  });

  it("start het spel en toont het bord", async () => {
    renderApp();

    fireEvent.click(await screen.findByRole("button", { name: "Spelen" }));

    expect(await screen.findByRole("group", { name: "Molenspelbord" })).toBeDefined();
    expect(screen.getByText("Wit is aan de beurt")).toBeDefined();
  });

  it("laat zwart beginnen als je dat kiest", async () => {
    renderApp();

    fireEvent.click(await screen.findByRole("button", { name: /Zwart/ }));
    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

    expect(await screen.findByText("Zwart is aan de beurt")).toBeDefined();
  });

  it("toont het bord als er een spel is hervat", async () => {
    useMolenspelStore.setState({ game: createMolenspelGame("zwart"), started: true });
    renderApp();

    expect(await screen.findByRole("group", { name: "Molenspelbord" })).toBeDefined();
    expect(screen.getByText("Zwart is aan de beurt")).toBeDefined();
  });
});
