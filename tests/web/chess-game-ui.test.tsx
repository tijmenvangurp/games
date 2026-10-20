import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChessStore } from "@features/chess-game";
import {
  ChessGame,
  createDefaultState,
  disposeChessEngine,
  useChessGameStore,
} from "@features/chess-game";
import { INITIAL_FEN } from "@entities/chess";

const rect = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 40,
  bottom: 40,
  width: 40,
  height: 40,
  toJSON: () => ({}),
} as DOMRect;

function resetStore(overrides: Partial<ChessStore> = {}): void {
  useChessGameStore.setState({
    ...createDefaultState(),
    selectedSquare: null,
    legalTargets: [],
    lastMove: null,
    pendingPromotion: null,
    thinking: false,
    hint: null,
    hintTarget: false,
    hintThinking: false,
    feedback: "idle",
    gameId: 0,
    ...overrides,
  });
}

beforeEach(() => {
  localStorage.clear();
  disposeChessEngine();
  resetStore();
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(rect);
});

afterEach(() => {
  cleanup();
  disposeChessEngine();
  vi.restoreAllMocks();
});

describe("ChessGameSetup", () => {
  it("shows the friend mode by default and hides computer options", () => {
    render(<ChessGame onHome={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Nieuwe partij" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Samen spelen/ }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.queryByText("Hoe sterk is de computer?")).toBeNull();
    expect(screen.getByLabelText("Naam voor wit")).toBeTruthy();
    expect(screen.getByLabelText("Naam voor zwart")).toBeTruthy();
  });

  it("updates the avatar and the name locally", () => {
    render(<ChessGame onHome={vi.fn()} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Avatar 🦁" })[0] as HTMLButtonElement);
    fireEvent.change(screen.getByLabelText("Naam voor wit"), { target: { value: "Noa" } });

    expect(useChessGameStore.getState().players.w).toEqual({ name: "Noa", avatar: "🦁" });
  });

  it("reveals the computer settings and starts a friend game", () => {
    render(<ChessGame onHome={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Computer" }));
    expect(screen.getByRole("button", { name: "Computer" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByText("Hoe sterk is de computer?")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Moeilijk/ }));
    expect(useChessGameStore.getState().level).toBe("moeilijk");

    fireEvent.click(screen.getByRole("button", { name: /Samen spelen/ }));
    fireEvent.click(screen.getByRole("button", { name: "Spelen" }));

    expect(useChessGameStore.getState().phase).toBe("playing");
    expect(useChessGameStore.getState().mode).toBe("friend");
    expect(useChessGameStore.getState().fen).toBe(INITIAL_FEN);
  });
});

describe("ChessGamePlay", () => {
  it("marks the player who is to move and moves by tapping", () => {
    resetStore({ phase: "playing", fen: INITIAL_FEN });
    const { container } = render(<ChessGame onHome={vi.fn()} />);

    expect(screen.getByRole("region", { name: /Sam|Wit.*aan zet/ })).toBeTruthy();
    expect(screen.getByText("Wit is aan zet.")).toBeTruthy();
    expect(container.querySelector('[data-player="w"]')?.getAttribute("data-active")).toBe("true");
    expect(container.querySelector('[data-player="b"]')?.getAttribute("data-active")).toBe("false");

    const board = screen.getByRole("group", { name: /coördinaten/i });
    expect(board).toBeTruthy();

    fireEvent.click(container.querySelector('[data-square="e2"]') as Element);
    expect(useChessGameStore.getState().selectedSquare).toBe("e2");

    fireEvent.click(container.querySelector('[data-square="e4"]') as Element);

    expect(useChessGameStore.getState().history).toHaveLength(1);
    expect(screen.getByText("Zwart is aan zet.")).toBeTruthy();
    expect(screen.getByText("Zetten (1)")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Ongedaan" }));
    expect(screen.getByText("Wit is aan zet.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Ongedaan" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("returns to the setup screen", () => {
    resetStore({ phase: "playing" });
    render(<ChessGame onHome={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Instellingen" }));

    expect(useChessGameStore.getState().phase).toBe("setup");
    expect(screen.queryByText("Je partij is bewaard")).toBeNull();
  });

  it("keeps the board and resumes a paused game", () => {
    resetStore({
      phase: "playing",
      history: [{ from: "e2", to: "e4", san: "e4", color: "w" }],
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    });
    render(<ChessGame onHome={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Instellingen" }));

    expect(screen.getByText("Je partij is bewaard")).toBeTruthy();
    expect(screen.getByText("Er staat 1 zet op het bord.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Nieuwe partij" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Doorgaan/ }));

    expect(useChessGameStore.getState().phase).toBe("playing");
    expect(screen.getByText("Zetten (1)")).toBeTruthy();
    expect(screen.getByText("Zwart is aan zet.")).toBeTruthy();
  });

  it("shows a hint piece first and the destination after a second tap", () => {
    resetStore({
      phase: "playing",
      fen: INITIAL_FEN,
      hint: { from: "e2", to: "e4" },
    });
    render(<ChessGame onHome={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Toon zet" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Toon zet" }));
    expect(useChessGameStore.getState().hintTarget).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Wis hint" }));
    expect(useChessGameStore.getState().hint).toBeNull();
    expect(screen.getByRole("button", { name: "Hint" })).toBeTruthy();
  });

  it("shows the promotion picker and applies the chosen piece", () => {
    resetStore({
      phase: "playing",
      fen: "7k/P7/8/8/8/8/8/7K w - - 0 1",
      pendingPromotion: { from: "a7", to: "a8" },
    });
    render(<ChessGame onHome={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Kies een stuk" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Dame" }));

    expect(useChessGameStore.getState().history[0]?.promotion).toBe("q");
    expect(screen.queryByRole("dialog", { name: "Kies een stuk" })).toBeNull();
  });

  it("shows the result dialog after a resignation", () => {
    resetStore({ phase: "playing", resignedBy: "w" });
    const onHome = vi.fn();
    render(<ChessGame onHome={onHome} />);

    expect(screen.getByRole("heading", { name: "Zwart wint!" })).toBeTruthy();
    expect(screen.getByText("De partij is gestopt omdat de ander opgaf.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Nieuwe tegenstander" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Naar het menu" }));
    expect(onHome).toHaveBeenCalledTimes(1);
  });

  it("starts a fresh game from the result dialog", () => {
    resetStore({ phase: "playing", resignedBy: "w" });
    render(<ChessGame onHome={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Nog een keer" }));

    expect(useChessGameStore.getState().resignedBy).toBeNull();
    expect(useChessGameStore.getState().history).toEqual([]);
    expect(useChessGameStore.getState().phase).toBe("playing");
  });
});
