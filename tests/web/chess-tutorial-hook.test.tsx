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

  it("starts with a preview of all legal moves and no selection", () => {
    const { result } = renderHook(() => useChessTutorial({ initialLevelId: "rook-train" }));

    expect(result.current.preview?.square).toBe("h1");
    expect(result.current.preview?.targets).toEqual(expect.arrayContaining(["e1", "h8", "a1"]));
    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.legalTargets).toEqual([]);
  });

  it("toggles the move preview", () => {
    const { result } = renderHook(() => useChessTutorial({ initialLevelId: "rook-train" }));

    act(() => {
      result.current.togglePreview();
    });
    expect(result.current.preview).toBeNull();

    act(() => {
      result.current.togglePreview();
    });
    expect(result.current.preview?.square).toBe("h1");
  });

  it("moves when the child taps a preview target", () => {
    const { result } = renderHook(() => useChessTutorial({ initialLevelId: "rook-train" }));

    act(() => {
      result.current.onSquareClick("e1");
    });

    expect(result.current.status).toBe("completed");
    expect(result.current.lastMove?.san).toBe("Re1");
  });

  it("keeps the preview when the child taps an unrelated square", () => {
    const { result } = renderHook(() => useChessTutorial({ initialLevelId: "rook-train" }));

    act(() => {
      result.current.onSquareClick("e5");
    });

    expect(result.current.preview?.square).toBe("h1");
    expect(result.current.selectedSquare).toBeNull();
  });

  it("nudges when the child taps the star before it is reachable", () => {
    const { result } = renderHook(() => useChessTutorial({ initialLevelId: "queen-dance" }));

    act(() => {
      result.current.onSquareClick("e5");
    });

    expect(result.current.feedback).toBe("blocked");
    expect(result.current.preview?.square).toBe("d1");
  });

  it("shows the new preview after a multi-step move", () => {
    const { result } = renderHook(() => useChessTutorial({ initialLevelId: "queen-dance" }));

    act(() => {
      result.current.onPieceDrop("d1", "d4");
    });

    expect(result.current.preview?.square).toBe("d4");
    expect(result.current.preview?.targets).toContain("e5");
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
    expect(result.current.status).toBe("completed");
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

  it("keeps the lesson piece selected after a wrong move", () => {
    const { result } = renderHook(() => useChessTutorial({ initialLevelId: "rook-train" }));

    act(() => {
      result.current.onPieceDrop("h1", "e5");
    });

    expect(result.current.selectedSquare).toBe("h1");
    expect(result.current.legalTargets).toEqual(expect.arrayContaining(["e1", "h8", "a1"]));
  });

  it("shows a hint and clears it on reset", () => {
    const { result } = renderHook(() => useChessTutorial({ initialLevelId: "rook-train" }));

    act(() => {
      result.current.showHint();
    });

    const hint = result.current.hintMove;
    expect(hint).not.toBeNull();
    expect(hint?.from).toBe("h1");
    expect(result.current.selectedSquare).toBe("h1");
    expect(result.current.legalTargets).toEqual([hint?.to]);
    expect(result.current.feedback).toBe("hint");

    act(() => {
      result.current.resetLevel();
    });

    expect(result.current.hintMove).toBeNull();
    expect(result.current.selectedSquare).toBeNull();
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
    expect(vibrate).toHaveBeenLastCalledWith([20, 40, 20]);
  });

  it("stops the castling lesson when the goal becomes impossible", () => {
    const { result } = renderHook(() => useChessTutorial({ initialLevelId: "castling" }));

    act(() => {
      result.current.onPieceDrop("e1", "f1");
    });

    expect(result.current.status).toBe("stuck");

    let accepted = true;
    act(() => {
      accepted = result.current.onPieceDrop("f1", "g1");
    });
    expect(accepted).toBe(false);

    act(() => {
      result.current.resetLevel();
    });
    expect(result.current.status).toBe("playing");
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
