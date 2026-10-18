import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import {
  TUTORIAL_LEVELS,
  TUTORIAL_LEVEL_IDS,
  hintFor,
  legalMovesFor,
  levelFor,
  nextLevelId,
  playTutorialMove,
  previewFor,
  rearmWhite,
} from "@features/chess-tutorial";

describe("tutorial levels", () => {
  it("defines the complete ordered chess basis", () => {
    expect(TUTORIAL_LEVEL_IDS).toHaveLength(9);
    expect(Object.keys(TUTORIAL_LEVELS)).toEqual([...TUTORIAL_LEVEL_IDS]);
    expect(TUTORIAL_LEVEL_IDS.map((levelId) => nextLevelId(levelId))).toEqual([
      ...TUTORIAL_LEVEL_IDS.slice(1),
      null,
    ]);
  });

  it("loads every FEN with white to move and the lesson piece", () => {
    for (const levelId of TUTORIAL_LEVEL_IDS) {
      const level = levelFor(levelId);
      const chess = new Chess(level.initialFen, { skipValidation: true });
      const pieces = chess
        .board()
        .flat()
        .filter((piece) => piece !== null);

      expect(chess.turn()).toBe("w");
      expect(chess.isCheck()).toBe(false);
      expect(pieces.length).toBeGreaterThan(0);
      expect(pieces.some((piece) => piece.color === "w" && piece.type === level.playerPiece)).toBe(
        true,
      );
      expect(Boolean(level.targetSquare || level.goal)).toBe(true);
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

  it("keeps every star at least two moves away", () => {
    for (const levelId of TUTORIAL_LEVEL_IDS) {
      const level = levelFor(levelId);
      if (!level.targetSquare || level.goal) {
        continue;
      }

      expect(level.minimumMoves ?? 1, levelId).toBeGreaterThanOrEqual(2);
      expect(previewFor(level, level.initialFen)?.targets, levelId).not.toContain(
        level.targetSquare,
      );
    }
  });

  it("blocks the pawn's forward move so the child cannot get stuck", () => {
    const level = levelFor("pawn-crossing");
    expect(legalMovesFor(level, level.initialFen, "e2")).toEqual(["d3"]);
  });

  it("hints a legal next move for every level", () => {
    for (const levelId of TUTORIAL_LEVEL_IDS) {
      const level = levelFor(levelId);
      const hint = hintFor(level, level.initialFen);

      expect(hint, levelId).not.toBeNull();
      if (!hint) throw new Error(`No hint for ${levelId}`);

      const result = playTutorialMove(level, level.initialFen, hint.from, hint.to, 0);
      expect(result.ok, levelId).toBe(true);
      if (!result.ok) throw new Error(`Hint for ${levelId} is not legal`);

      if (level.goal) {
        expect(result.completed, levelId).toBe(true);
      }
    }
  });

  it("hints the first step of every two-move route", () => {
    const rook = levelFor("rook-train");
    expect(hintFor(rook, rook.initialFen)).toEqual({ from: "h1", to: "h5" });

    const bishop = levelFor("bishop-line");
    expect(hintFor(bishop, bishop.initialFen)).toEqual({ from: "c1", to: "f4" });

    const queen = levelFor("queen-dance");
    expect(hintFor(queen, queen.initialFen)).toEqual({ from: "d1", to: "d4" });

    const knight = levelFor("knight-jump");
    expect(hintFor(knight, knight.initialFen)).toEqual({ from: "b1", to: "a3" });

    const king = levelFor("king-step");
    expect(hintFor(king, king.initialFen)).toEqual({ from: "e1", to: "d2" });
  });

  it("hints the special goal moves", () => {
    const castling = levelFor("castling");
    expect(hintFor(castling, castling.initialFen)).toEqual({ from: "e1", to: "g1" });

    const check = levelFor("check");
    expect(hintFor(check, check.initialFen)).toEqual({ from: "a1", to: "a8" });

    const checkmate = levelFor("checkmate");
    expect(hintFor(checkmate, checkmate.initialFen)).toEqual({ from: "g6", to: "g7" });
  });

  it("previews every legal move of the lesson piece", () => {
    for (const levelId of TUTORIAL_LEVEL_IDS) {
      const level = levelFor(levelId);
      const preview = previewFor(level, level.initialFen);

      expect(preview, levelId).not.toBeNull();
      if (!preview) throw new Error(`No preview for ${levelId}`);

      expect(preview.targets.length, levelId).toBeGreaterThan(0);
      expect(preview.targets, levelId).toEqual(
        legalMovesFor(level, level.initialFen, preview.square),
      );
    }
  });

  it("previews the new options after a pawn capture", () => {
    const level = levelFor("pawn-crossing");
    const capture = playTutorialMove(level, level.initialFen, "e2", "d3", 0);
    if (!capture.ok) throw new Error("expected legal capture");

    expect(previewFor(level, capture.nextFen)).toEqual({ square: "d3", targets: ["d4"] });
  });
});

describe("rearmWhite", () => {
  it("keeps the placement and puts white back on move", () => {
    const fen = "8/8/8/8/8/1p1P4/P7/8 b - - 4 9";
    expect(rearmWhite(fen)).toBe("8/8/8/8/8/1p1P4/P7/8 w - - 0 1");
  });

  it("preserves castling rights", () => {
    const fen = "4k3/8/8/8/8/8/8/4K2R b K - 4 9";
    expect(rearmWhite(fen)).toBe("4k3/8/8/8/8/8/8/4K2R w K - 0 1");
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

  it("plays the rook to the star in two moves", () => {
    const level = levelFor("rook-train");
    const first = playTutorialMove(level, level.initialFen, "h1", "e1", 0);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error("expected legal move");

    expect(first.completed).toBe(false);
    expect(first.move.san).toBe("Re1");

    const second = playTutorialMove(level, first.nextFen, "e1", "e5", 1);
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error("expected legal move");

    expect(second.completed).toBe(true);
    expect(second.move.san).toBe("Re5");
    expect(second.nextFen.endsWith(" w - - 0 1")).toBe(true);
  });

  it("plays the bishop diagonal to the star in two moves", () => {
    const level = levelFor("bishop-line");
    const first = playTutorialMove(level, level.initialFen, "c1", "f4", 0);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error("expected legal move");

    expect(first.completed).toBe(false);

    const second = playTutorialMove(level, first.nextFen, "f4", "e5", 1);
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error("expected legal move");

    expect(second.move.san).toBe("Be5");
    expect(second.completed).toBe(true);
  });

  it("plays the queen route to the star", () => {
    const level = levelFor("queen-dance");
    const first = playTutorialMove(level, level.initialFen, "d1", "d5", 0);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error("expected legal move");

    expect(first.move.san).toBe("Qd5");
    expect(first.completed).toBe(false);

    const second = playTutorialMove(level, first.nextFen, "d5", "e5", 1);
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error("expected legal move");

    expect(second.move.san).toBe("Qe5");
    expect(second.completed).toBe(true);
  });

  it("plays the knight L-jump to the star in two moves", () => {
    const level = levelFor("knight-jump");
    const first = playTutorialMove(level, level.initialFen, "b1", "a3", 0);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error("expected legal move");

    expect(first.completed).toBe(false);
    expect(first.move.san).toBe("Na3");

    const second = playTutorialMove(level, first.nextFen, "a3", "c4", 1);
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error("expected legal move");

    expect(second.completed).toBe(true);
    expect(second.move.san).toBe("Nc4");
  });

  it("plays the king step to the star in two moves", () => {
    const level = levelFor("king-step");
    const first = playTutorialMove(level, level.initialFen, "e1", "d2", 0);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error("expected legal move");

    expect(first.completed).toBe(false);
    expect(first.move.san).toBe("Kd2");

    const second = playTutorialMove(level, first.nextFen, "d2", "c3", 1);
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error("expected legal move");

    expect(second.completed).toBe(true);
    expect(second.move.san).toBe("Kc3");
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

  it("completes the kingside castle", () => {
    const level = levelFor("castling");
    const result = playTutorialMove(level, level.initialFen, "e1", "g1", 0);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected legal castle");

    expect(result.move.san).toBe("O-O");
    expect(result.completed).toBe(true);
    expect(result.stuck).toBe(false);
  });

  it("marks the castling lesson as stuck after a king step", () => {
    const level = levelFor("castling");
    const result = playTutorialMove(level, level.initialFen, "e1", "f1", 0);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected legal king step");

    expect(result.completed).toBe(false);
    expect(result.stuck).toBe(true);
  });

  it("completes a check against the black king", () => {
    const level = levelFor("check");
    const result = playTutorialMove(level, level.initialFen, "a1", "a8", 0);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected legal check");

    expect(result.move.san).toBe("Ra8+");
    expect(result.completed).toBe(true);
  });

  it("completes checkmate with the queen", () => {
    const level = levelFor("checkmate");
    const result = playTutorialMove(level, level.initialFen, "g6", "g7", 0);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected legal mate");

    expect(result.move.san).toBe("Qg7#");
    expect(result.completed).toBe(true);
  });

  it("rejects illegal moves", () => {
    const level = levelFor("pawn-crossing");
    expect(playTutorialMove(level, level.initialFen, "e2", "e5", 0)).toEqual({
      ok: false,
      reason: "illegal-move",
    });
    expect(playTutorialMove(level, level.initialFen, "d3", "d4", 0)).toEqual({
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
    expect(playTutorialMove(level, level.initialFen, "e2", "e3", 0)).toEqual({
      ok: false,
      reason: "wrong-piece",
    });
  });
});
