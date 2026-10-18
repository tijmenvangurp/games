import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useChessTutorial } from "@features/chess-tutorial";

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, "vibrate");
});

describe("useChessTutorial", () => {
  it("starts on the requested level and exposes its legal moves", () => {
    const { result } = renderHook(() => useChessTutorial({ initialLevelId: "rook-train" }));

    expect(result.current.level.id).toBe("rook-train");
    expect(result.current.fen).toBe("8/8/8/8/8/8/8/7R w - - 0 1");
    expect(result.current.getLegalMoves("h1")).toEqual(expect.arrayContaining(["e1", "h8", "a1"]));
    expect(result.current.getLegalMoves("e5")).toEqual([]);
  });

  it("accepts a legal drop and completes the level through the star", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useChessTutorial({ initialLevelId: "rook-train", onComplete }),
    );

    let accepted = false;
    act(() => {
      accepted = result.current.onPieceDrop("h1", "e1");
    });

    expect(accepted).toBe(true);
    expect(result.current.moveCount).toBe(1);
    expect(result.current.lastMove?.san).toBe("Re1");
    expect(result.current.status).toBe("playing");

    act(() => {
      accepted = result.current.onPieceDrop("e1", "e5");
    });

    expect(accepted).toBe(true);
    expect(result.current.status).toBe("completed");
    expect(result.current.lastMove?.san).toBe("Re5");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(result.current.level);
  });

  it("returns false and keeps the position on an illegal drop", () => {
    const { result } = renderHook(() => useChessTutorial({ initialLevelId: "rook-train" }));
    const before = result.current.fen;

    let accepted = true;
    act(() => {
      accepted = result.current.onPieceDrop("h1", "e5");
    });

    expect(accepted).toBe(false);
    expect(result.current.fen).toBe(before);
    expect(result.current.feedback).toBe("illegal");
    expect(result.current.moveCount).toBe(0);
  });

  it("selects a piece and moves by tapping a legal target", () => {
    const { result } = renderHook(() => useChessTutorial({ initialLevelId: "knight-jump" }));

    act(() => {
      result.current.onSquareClick("b1");
    });

    expect(result.current.selectedSquare).toBe("b1");
    expect(result.current.legalTargets).toEqual(expect.arrayContaining(["a3", "c3", "d2"]));

    act(() => {
      result.current.onSquareClick("d2");
    });

    expect(result.current.status).toBe("completed");
    expect(result.current.moveCount).toBe(1);
    expect(result.current.fen).toContain("3N4");
  });

  it("gives haptic feedback for selection, an illegal move and completion", () => {
    const vibrate = vi.fn(() => true);
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    });

    const { result } = renderHook(() => useChessTutorial({ initialLevelId: "rook-train" }));

    act(() => {
      result.current.onSquareClick("h1");
    });
    expect(vibrate).toHaveBeenLastCalledWith(10);

    act(() => {
      result.current.onPieceDrop("h1", "e5");
    });
    expect(vibrate).toHaveBeenLastCalledWith([30, 40, 30]);

    act(() => {
      result.current.onPieceDrop("h1", "e1");
    });
    expect(vibrate).toHaveBeenLastCalledWith(10);

    act(() => {
      result.current.onPieceDrop("e1", "e5");
    });
    expect(vibrate).toHaveBeenLastCalledWith([20, 40, 20]);
  });

  it("loads another level and resets it", () => {
    const { result } = renderHook(() => useChessTutorial({ initialLevelId: "rook-train" }));

    act(() => {
      result.current.loadLevel("pawn-crossing");
    });

    expect(result.current.level.id).toBe("pawn-crossing");
    expect(result.current.moveCount).toBe(0);
    expect(result.current.feedback).toBe("idle");

    act(() => {
      result.current.onPieceDrop("e2", "d3");
    });
    expect(result.current.moveCount).toBe(1);

    act(() => {
      result.current.resetLevel();
    });

    expect(result.current.level.id).toBe("pawn-crossing");
    expect(result.current.fen).toBe(result.current.level.initialFen);
    expect(result.current.moveCount).toBe(0);
    expect(result.current.lastMove).toBeNull();
  });
});
