import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@app/app";
import { createAppRouter } from "@app/router";
import { INITIAL_FEN, type ChessPlayer } from "@entities/chess";
import {
  ChessGame,
  createDefaultState,
  disposeChessEngine,
  displayName,
  feedbackText,
  resultCopy,
  statusText,
  useChessGameStore,
  type ChessStore,
} from "@features/chess-game";
import { PUZZLES, PuzzleOverview, PuzzlePlay } from "@features/chess-puzzles";
import { TutorialBoard, coachSpeechFor, levelFor } from "@features/chess-tutorial";
import { setLanguage } from "@shared/i18n";

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

function renderApp(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  disposeChessEngine();
  resetStore();
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(rect);
  act(() => setLanguage("en"));
});

afterEach(() => {
  cleanup();
  disposeChessEngine();
  vi.restoreAllMocks();
  act(() => setLanguage("nl"));
  localStorage.clear();
});

describe("chess in English", () => {
  it("shows the chess hub", async () => {
    renderApp("/schaken");

    expect(await screen.findByRole("heading", { name: "Chess", level: 1 })).toBeTruthy();
    expect(screen.getByText("Lessons, puzzles or a game")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Chess lessons/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Chess game/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Chess puzzles/ })).toBeTruthy();
  });

  it("shows the lesson, game and puzzle pages", async () => {
    renderApp("/schaken/les");
    expect(await screen.findByText("Get to know the pieces")).toBeTruthy();
    cleanup();

    renderApp("/schaken/partij");
    expect(await screen.findByText("Against the computer or together")).toBeTruthy();
    cleanup();

    renderApp("/puzzels");
    expect(await screen.findByText("Choose your difficulty")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Choose a puzzle" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tricky" })).toBeTruthy();
  });
});

describe("chess game in English", () => {
  it("translates the setup screen", () => {
    render(<ChessGame onHome={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "New game" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Play together/ })).toBeTruthy();
    expect(screen.getByLabelText("Name for white")).toBeTruthy();
    expect((screen.getByLabelText("Name for black") as HTMLInputElement).value).toBe("Black");
    expect(screen.getByRole("group", { name: "Choose an avatar for white" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Computer" }));
    expect(screen.getByText("How strong is the computer?")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Hard/ })).toBeTruthy();
    expect(screen.getByText("Which colour do you want to play?")).toBeTruthy();
    expect(screen.getByText("Black · computer")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(useChessGameStore.getState().phase).toBe("playing");
    expect(screen.getByText("You play white · the computer plays black.")).toBeTruthy();
  });

  it("shows a saved game with the number of moves", () => {
    resetStore({
      history: [{ from: "e2", to: "e4", san: "e4", color: "w" }],
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    });
    render(<ChessGame onHome={vi.fn()} />);

    expect(screen.getByText("Your game has been saved")).toBeTruthy();
    expect(screen.getByText("There is 1 move on the board.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "New game" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByText("It's Black's turn.")).toBeTruthy();
    expect(screen.getByText("Moves (1)")).toBeTruthy();
  });

  it("translates the board, actions and hint", () => {
    resetStore({ phase: "playing", fen: INITIAL_FEN, hint: { from: "e2", to: "e4" } });
    render(<ChessGame onHome={vi.fn()} />);

    expect(screen.getByRole("region", { name: "White, plays white, to move" })).toBeTruthy();
    expect(screen.getByText("Your turn")).toBeTruthy();
    expect(screen.getByText("It's White's turn.")).toBeTruthy();
    expect(screen.getByText("Take turns on this screen.")).toBeTruthy();
    expect(screen.getByRole("group", { name: /Chessboard with coordinates/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Give up" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Settings" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Show move" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear hint" }));
    expect(screen.getByRole("button", { name: "Hint" })).toBeTruthy();
  });

  it("translates the promotion picker", () => {
    resetStore({
      phase: "playing",
      fen: "7k/P7/8/8/8/8/8/7K w - - 0 1",
      pendingPromotion: { from: "a7", to: "a8" },
    });
    render(<ChessGame onHome={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Choose a piece" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Rook" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Queen" }));
    expect(useChessGameStore.getState().history[0]?.promotion).toBe("q");
  });

  it("translates the result dialog", () => {
    resetStore({ phase: "playing", resignedBy: "w" });
    render(<ChessGame onHome={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Black wins!" })).toBeTruthy();
    expect(screen.getByText("The game ended because the other player gave up.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "New opponent" })).toBeTruthy();
  });

  it("translates every status, feedback and result", () => {
    const players: Record<"w" | "b", ChessPlayer> = {
      w: { name: "Sam", avatar: "🦊" },
      b: { name: "Computer", avatar: "🐼" },
    };
    const base = { players, turn: "w" as const, thinking: false };

    expect(displayName({ name: "Wit", avatar: "🦊" }, "w")).toBe("White");
    expect(displayName({ name: " ", avatar: "🦊" }, "b")).toBe("Black");
    expect(statusText({ ...base, result: { kind: "playing", check: true } })).toBe(
      "Check! It's Sam's turn.",
    );
    expect(statusText({ ...base, result: { kind: "playing", check: false }, thinking: true })).toBe(
      "The computer is thinking…",
    );
    expect(statusText({ ...base, result: { kind: "checkmate", winner: "b" } })).toBe(
      "Computer wins with checkmate.",
    );
    expect(statusText({ ...base, result: { kind: "stalemate" } })).toBe(
      "Stalemate! There are no legal moves left.",
    );
    expect(statusText({ ...base, result: { kind: "draw", reason: "draw" } })).toBe("It's a draw.");
    expect(statusText({ ...base, result: { kind: "resigned", winner: "w" } })).toBe(
      "Sam wins: the other player gave up.",
    );

    expect(feedbackText("illegal")).toBe("That move isn't allowed. Pick a green dot.");
    expect(feedbackText("not-your-turn")).toBe("It's not that piece's turn.");
    expect(feedbackText("engine-error")).toBe("The computer couldn't find a move. Try again.");
    expect(feedbackText("idle")).toBeNull();

    expect(resultCopy({ kind: "checkmate", winner: "w" }, players, "computer", "w")).toEqual({
      title: "Sam wins!",
      description: "Checkmate! The king has nowhere left to go.",
      confetti: true,
    });
    expect(resultCopy({ kind: "stalemate" }, players, "friend", "w").title).toBe("Stalemate!");
    expect(resultCopy({ kind: "draw", reason: "repetition" }, players, "friend", "w")).toEqual({
      title: "Draw",
      description: "The same position came back three times.",
      confetti: false,
    });
    expect(resultCopy({ kind: "playing", check: false }, players, "friend", "w").title).toBe(
      "The game is still going",
    );
  });
});

describe("chess puzzles in English", () => {
  it("translates the overview", () => {
    const puzzles = PUZZLES.filter((puzzle) => puzzle.difficulty === "easy").slice(0, 3);
    const solved = new Set([puzzles[0]?.id ?? ""]);
    render(
      <PuzzleOverview
        difficulty="easy"
        puzzles={puzzles}
        solved={solved}
        onDifficultyChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("1 of 3 solved")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Progress" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Choose a difficulty" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Challenging" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Puzzle 1, solved" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Puzzle 2, not solved yet" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Continue/ })).toBeTruthy();
  });

  it("offers to play again when everything is solved", () => {
    const puzzles = PUZZLES.slice(0, 2);
    render(
      <PuzzleOverview
        difficulty="easy"
        puzzles={puzzles}
        solved={new Set(puzzles.map((puzzle) => puzzle.id))}
        onDifficultyChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Play again/ })).toBeTruthy();
  });

  it("translates a puzzle and its feedback", () => {
    render(
      <PuzzlePlay
        difficulty="easy"
        index={0}
        puzzle={PUZZLES[0]}
        total={12}
        onDifficultyChange={vi.fn()}
        onNext={vi.fn()}
        onOverview={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Give checkmate!" })).toBeTruthy();
    expect(screen.getByText("Puzzle 1 of 12")).toBeTruthy();
    expect(screen.getByText("You are white. Checkmate the black king.")).toBeTruthy();
    expect(
      screen.getByText("Tap a piece to see where it can go. Drag your piece to a green dot."),
    ).toBeTruthy();
    expect(screen.getByRole("group", { name: /Chessboard with coordinates/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start again" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Overview" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next puzzle" })).toBeTruthy();
  });
});

describe("chess lessons in English", () => {
  it("translates the lesson board", () => {
    render(<TutorialBoard />);

    expect(screen.getByRole("heading", { name: "The Rook Train" })).toBeTruthy();
    expect(screen.getByText("Lesson 1 of 9")).toBeTruthy();
    expect(
      screen.getByText("Look! This is how the rook drives. Tap the piece to have a look."),
    ).toBeTruthy();
    expect(screen.getByRole("group", { name: /Goal: the star on e5\./ })).toBeTruthy();
    expect(screen.getByText("Why?")).toBeTruthy();
    expect(
      screen.getByText(
        "The rook drives in straight lines: along the rows and the columns. It can't go diagonally.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Tip: Drag the rook along the lines, not diagonally.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Show move" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start again" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Look" }));
    expect(screen.getByText("Drive the rook to the star.")).toBeTruthy();

    fireEvent.click(screen.getByText("Choose a lesson"));
    fireEvent.click(screen.getByRole("button", { name: "Lesson 4: The Knight's Jump" }));
    expect(screen.getByRole("heading", { name: "The Knight's Jump" })).toBeTruthy();
  });

  it("names the goal of a special lesson", () => {
    render(<TutorialBoard initialLevelId="check" />);

    expect(screen.getByRole("heading", { name: "Giving Check" })).toBeTruthy();
    expect(screen.getByRole("group", { name: /Goal: put the black king in check\./ })).toBeTruthy();
  });

  it("lets the coach speak English text in every state", () => {
    const rook = levelFor("rook-train");
    const check = levelFor("check");

    expect(coachSpeechFor(rook, "moved", null, null, null, "playing", 1).text).toBe(
      "Good! One more move to the star.",
    );
    expect(coachSpeechFor(check, "moved", null, null, null, "playing", 1).text).toBe(
      "Good! One more move.",
    );
    expect(coachSpeechFor(rook, "illegal", null, null, null, "playing", 1).text).toBe(
      "That's not allowed. Drag to a green dot.",
    );
    expect(coachSpeechFor(rook, "hint", null, null, null, "playing", 0).text).toBe(
      "Look! Drag to the green dot.",
    );
    expect(coachSpeechFor(rook, "idle", null, "w", "h1", "playing", 0).text).toBe(
      "Drag to a green dot.",
    );
    expect(coachSpeechFor(rook, "idle", null, "b", "h1", "playing", 0).text).toBe(
      "Look! This is a black piece. Drag your own piece to move.",
    );
    expect(coachSpeechFor(rook, "idle", null, null, null, "completed", 2).text).toBe(
      "Star! The rook drives in straight lines.",
    );
    expect(coachSpeechFor(rook, "idle", null, null, null, "stuck", 1).text).toBe(
      "Oops! Castling isn't possible any more. Press Start again.",
    );
    // De Nederlandse spraakregels blijven ongewijzigd.
    expect(coachSpeechFor(rook, "moved", null, null, null, "playing", 1).lines[0]?.text).toBe(
      "Goed! Nog één zet naar de ster.",
    );
  });
});
