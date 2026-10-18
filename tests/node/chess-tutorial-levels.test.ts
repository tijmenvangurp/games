import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import {
  TUTORIAL_LEVELS,
  TUTORIAL_LEVEL_IDS,
  isGoalReached,
  legalMovesFor,
  levelFor,
  nextLevelId,
  playTutorialMove,
  rearmWhite,
} from "@features/chess-tutorial";

describe("tutorial levels", () => {
  it("defines exactly the three ordered levels", () => {
    expect(Object.keys(TUTORIAL_LEVELS)).toEqual([...TUTORIAL_LEVEL_IDS]);
    expect(nextLevelId("rook-train")).toBe("knight-jump");
    expect(nextLevelId("knight-jump")).toBe("pawn-crossing");
    expect(nextLevelId("pawn-crossing")).toBeNull();
  });

  it("loads every FEN with only the lesson pieces and white to move", () => {
    for (const levelId of TUTORIAL_LEVEL_IDS) {
      const level = levelFor(levelId);
      const chess = new Chess(level.initialFen, { skipValidation: true });
      const pieces = chess
        .board()
        .flat()
        .filter((piece) => piece !== null);

      expect(chess.turn()).toBe("w");
      expect(pieces.length).toBeGreaterThan(0);
      expect(pieces.every((piece) => piece.type !== "k")).toBe(true);
      expect(pieces.some((piece) => piece.color === "w" && piece.type === level.playerPiece)).toBe(
        true,
      );
    }
  });

  it("keeps the target square empty at the start", () => {
    for (const levelId of TUTORIAL_LEVEL_IDS) {
      const level = levelFor(levelId);
      const chess = new Chess(level.initialFen, { skipValidation: true });

      if (level.targetSquare) {
        expect(chess.get(level.targetSquare)).toBeUndefined();
      }
    }
  });
});

describe("rearmWhite", () => {
  it("keeps the placement and puts white back on move", () => {
    const fen = "8/8/8/8/8/1p1P4/P7/8 b - - 4 9";
    expect(rearmWhite(fen)).toBe("8/8/8/8/8/1p1P4/P7/8 w - - 0 1");
  });

  it("is idempotent", () => {
    const once = rearmWhite("8/8/8/8/8/8/8/7R b - - 4 9");
    expect(rearmWhite(once)).toBe(once);
  });
});

describe("tutorial engine", () => {
  it("only exposes legal moves of the lesson piece", () => {
    const level = levelFor("rook-train");
    expect(legalMovesFor(level, level.initialFen, "h1")).toEqual(
      expect.arrayContaining(["h2", "h8", "e1", "a1"]),
    );
    expect(legalMovesFor(level, level.initialFen, "e5")).toEqual([]);
    expect(legalMovesFor(level, level.initialFen, "z9")).toEqual([]);
  });

  it("plays a two-move rook route to the star", () => {
    const level = levelFor("rook-train");
    const first = playTutorialMove(level, level.initialFen, "h1", "e1", 0);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error("expected legal move");

    expect(first.completed).toBe(false);
    expect(first.move.san).toBe("Re1");
    expect(first.nextFen.endsWith(" w - - 0 1")).toBe(true);

    const second = playTutorialMove(level, first.nextFen, "e1", "e5", 1);
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error("expected legal move");

    expect(second.completed).toBe(true);
    expect(second.move.san).toBe("Re5");
  });

  it("plays the knight L-jump to the star", () => {
    const level = levelFor("knight-jump");
    const result = playTutorialMove(level, level.initialFen, "b1", "d2", 0);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected legal move");

    expect(result.completed).toBe(true);
    expect(result.move.san).toBe("Nd2");
  });

  it("captures diagonally and then moves forward to the star", () => {
    const level = levelFor("pawn-crossing");
    const capture = playTutorialMove(level, level.initialFen, "e2", "d3", 0);
    expect(capture.ok).toBe(true);
    if (!capture.ok) throw new Error("expected legal capture");

    expect(capture.move.san).toBe("exd3");
    expect(capture.move.captured).toBe("p");
    expect(capture.completed).toBe(false);

    const forward = playTutorialMove(level, capture.nextFen, "d3", "d4", 1);
    expect(forward.ok).toBe(true);
    if (!forward.ok) throw new Error("expected legal move");

    expect(forward.completed).toBe(true);
    expect(forward.move.san).toBe("d4");
  });

  it("rejects illegal moves", () => {
    const level = levelFor("pawn-crossing");
    expect(playTutorialMove(level, level.initialFen, "e2", "e5", 0)).toEqual({
      ok: false,
      reason: "illegal-move",
    });
    expect(playTutorialMove(level, level.initialFen, "b3", "b4", 0)).toEqual({
      ok: false,
      reason: "wrong-color",
    });
    expect(playTutorialMove(level, level.initialFen, "a1", "a2", 0)).toEqual({
      ok: false,
      reason: "no-piece",
    });
    expect(playTutorialMove(level, level.initialFen, "z9", "d4", 0)).toEqual({
      ok: false,
      reason: "invalid-square",
    });
  });

  it("rejects a white piece that is not the lesson piece", () => {
    const level = { ...levelFor("pawn-crossing"), playerPiece: "r" as const };
    expect(playTutorialMove(level, level.initialFen, "a2", "a3", 0)).toEqual({
      ok: false,
      reason: "wrong-piece",
    });
  });

  it("requires the minimum number of moves before the star counts", () => {
    const level = levelFor("rook-train");
    expect(isGoalReached(level, "e5", 1)).toBe(false);
    expect(isGoalReached(level, "e5", 2)).toBe(true);
    expect(isGoalReached(level, "e4", 2)).toBe(false);
  });
});
