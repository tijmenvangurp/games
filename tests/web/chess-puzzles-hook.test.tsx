import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PUZZLES, useChessPuzzle } from "@features/chess-puzzles";

afterEach(cleanup);

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

  it("shows a hint, supports tapping and resets", () => {
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
    expect(result.current.status).toBe("solved");

    act(() => {
      result.current.resetPuzzle();
    });

    expect(result.current.status).toBe("playing");
    expect(result.current.feedback).toBe("idle");
    expect(result.current.hintMove).toBeNull();
    expect(result.current.fen).toBe(initialFen);
  });
});
