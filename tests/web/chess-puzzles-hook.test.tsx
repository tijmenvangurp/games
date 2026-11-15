import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PUZZLES,
  PUZZLE_PROGRESS_STORAGE_KEY,
  useChessPuzzle,
  usePuzzleProgress,
} from "@features/chess-puzzles";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, "vibrate");
});

describe("usePuzzleProgress", () => {
  it("marks a puzzle solved and stores it locally", () => {
    const { result } = renderHook(() => usePuzzleProgress());
    const puzzleId = PUZZLES[0].id;

    act(() => {
      result.current.markSolved(puzzleId);
    });

    expect(result.current.solved.has(puzzleId)).toBe(true);
    expect(JSON.parse(localStorage.getItem(PUZZLE_PROGRESS_STORAGE_KEY) ?? "{}")).toEqual({
      solved: [puzzleId],
    });
  });
});

describe("useChessPuzzle", () => {
  it("rejects a wrong move and solves the puzzle with the right move", () => {
    const { result } = renderHook(() => useChessPuzzle(PUZZLES[0]));
    const initialFen = result.current.fen;

    let accepted = true;
    act(() => {
      accepted = result.current.onPieceDrop("a1", "a2");
    });

    expect(accepted).toBe(false);
    expect(result.current.feedback).toBe("wrong");
    expect(result.current.fen).toBe(initialFen);

    act(() => {
      accepted = result.current.onPieceDrop("a1", "a8");
    });

    expect(accepted).toBe(true);
    expect(result.current.status).toBe("solved");
    expect(result.current.feedback).toBe("solved");
  });

  it("plays a mate-in-two through both player moves", () => {
    const puzzle = PUZZLES.find(
      (candidate) => candidate.moves.length === 4 && candidate.kind === "mate",
    );
    if (!puzzle) {
      throw new Error("Mate-in-two puzzle not found");
    }

    const { result } = renderHook(() => useChessPuzzle(puzzle));
    const firstMove = puzzle.moves[1];
    if (!firstMove) {
      throw new Error("Mate-in-two puzzle has no first move");
    }

    act(() => {
      result.current.onPieceDrop(firstMove.slice(0, 2), firstMove.slice(2, 4));
    });

    expect(result.current.status).toBe("playing");
    expect(result.current.feedback).toBe("correct");

    act(() => {
      result.current.showHint();
    });

    const hint = result.current.hintMove;
    expect(hint).not.toBeNull();
    if (!hint) {
      throw new Error("Mate-in-two puzzle has no second hint");
    }

    act(() => {
      result.current.onPieceDrop(hint.from, hint.to);
    });

    expect(result.current.status).toBe("solved");
    expect(result.current.feedback).toBe("solved");
  });

  it("gives a neutral haptic for a wrong move, a hint and a solve", () => {
    const vibrate = vi.fn(() => true);
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    });

    const { result } = renderHook(() => useChessPuzzle(PUZZLES[0]));

    act(() => {
      result.current.onPieceDrop("a1", "a2");
    });
    expect(vibrate).toHaveBeenLastCalledWith(10);

    act(() => {
      result.current.showHint();
    });
    expect(vibrate).toHaveBeenLastCalledWith(20);

    act(() => {
      result.current.onPieceDrop("a1", "a8");
    });
    expect(vibrate).toHaveBeenLastCalledWith([20, 40, 20]);
  });

  it("shows a hint, previews by tapping and only moves after a drop", () => {
    const { result } = renderHook(() => useChessPuzzle(PUZZLES[0]));
    const initialFen = result.current.fen;

    act(() => {
      result.current.showHint();
    });
    expect(result.current.hintMove).toEqual({ from: "a1", to: "a8" });

    act(() => {
      result.current.onSquareClick("a1");
    });
    expect(result.current.selectedSquare).toBe("a1");
    expect(result.current.legalTargets).toContain("a8");

    act(() => {
      result.current.onSquareClick("a8");
    });

    expect(result.current.status).toBe("playing");
    expect(result.current.feedback).toBe("idle");
    expect(result.current.fen).toBe(initialFen);

    act(() => {
      result.current.onPieceDrop("a1", "a8");
    });
    expect(result.current.status).toBe("solved");

    act(() => {
      result.current.resetPuzzle();
    });

    expect(result.current.status).toBe("playing");
    expect(result.current.feedback).toBe("idle");
    expect(result.current.hintMove).toBeNull();
    expect(result.current.fen).toBe(initialFen);
  });

  it("shows where an opponent piece can go without playing a move", () => {
    const { result } = renderHook(() => useChessPuzzle(PUZZLES[0]));
    const initialFen = result.current.fen;

    act(() => {
      result.current.onSquareClick("d8");
    });

    expect(result.current.selectedSquare).toBe("d8");
    expect(result.current.selectedColor).toBe("b");
    expect(result.current.legalTargets.length).toBeGreaterThan(0);
    expect(result.current.fen).toBe(initialFen);
    expect(result.current.feedback).toBe("idle");
    expect(result.current.status).toBe("playing");
  });
});
