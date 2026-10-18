import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { PUZZLES, attemptPuzzleMove, createPuzzleState, hintFor } from "@features/chess-puzzles";

const uci = (value: string) => ({
  from: value.slice(0, 2),
  to: value.slice(2, 4),
  ...(value[4] ? { promotion: value[4] } : {}),
});

describe("Lichess puzzle data", () => {
  it("contains 25 unique curated puzzles", () => {
    expect(PUZZLES).toHaveLength(25);
    expect(new Set(PUZZLES.map((puzzle) => puzzle.id)).size).toBe(PUZZLES.length);
    expect(PUZZLES.filter((puzzle) => puzzle.kind === "mate")).toHaveLength(20);
    expect(PUZZLES.filter((puzzle) => puzzle.kind === "capture")).toHaveLength(5);
  });

  it("loads every puzzle and verifies the recorded solution", () => {
    for (const puzzle of PUZZLES) {
      const chess = new Chess(puzzle.fen);
      const [setup, ...solution] = puzzle.moves;

      expect(setup).toBeDefined();
      expect(solution).toHaveLength(1);
      if (!setup || !solution[0]) {
        throw new Error(`Puzzle ${puzzle.id} is incomplete`);
      }

      chess.move(uci(setup));
      expect(chess.turn()).toBe("w");

      const move = chess.move(uci(solution[0]));

      if (puzzle.kind === "mate") {
        expect(chess.isCheckmate(), puzzle.id).toBe(true);
      } else {
        expect(move.captured, puzzle.id).toBeDefined();
      }
    }
  });
});

describe("puzzle engine", () => {
  it("applies the opponent setup move before the player starts", () => {
    const state = createPuzzleState(PUZZLES[0]);

    expect(state.playerColor).toBe("w");
    expect(state.fen).toContain(" w ");
    expect(state.remainingMoves).toEqual(["a1a8"]);
    expect(state.lastMove?.san).toBe("Re2");
    expect(hintFor(state)).toEqual({ from: "a1", to: "a8" });
  });

  it("rejects a legal but wrong move without changing the position", () => {
    const state = createPuzzleState(PUZZLES[0]);
    const attempt = attemptPuzzleMove(state, "a1", "a2");

    expect(attempt).toEqual({ ok: false, reason: "wrong-solution" });
    expect(state.fen).toContain("R7");
  });

  it("solves the first mate-in-one", () => {
    const state = createPuzzleState(PUZZLES[0]);
    const attempt = attemptPuzzleMove(state, "a1", "a8");

    expect(attempt.ok).toBe(true);
    if (!attempt.ok) throw new Error("expected mate");

    expect(attempt.playerMove.san).toBe("Ra8#");
    expect(attempt.solved).toBe(true);
    expect(attempt.remainingMoves).toEqual([]);
  });

  it("solves a hanging-piece capture", () => {
    const state = createPuzzleState(PUZZLES[20]);
    const attempt = attemptPuzzleMove(state, "e7", "f6");

    expect(attempt.ok).toBe(true);
    if (!attempt.ok) throw new Error("expected capture");

    expect(attempt.playerMove.san).toBe("Bxf6");
    expect(attempt.playerMove.captured).toBe("n");
    expect(attempt.solved).toBe(true);
  });

  it("rejects empty squares, the wrong colour and illegal moves", () => {
    const state = createPuzzleState(PUZZLES[0]);

    expect(attemptPuzzleMove(state, "a2", "a3")).toEqual({
      ok: false,
      reason: "no-piece",
    });
    expect(attemptPuzzleMove(state, "e2", "e8")).toEqual({
      ok: false,
      reason: "wrong-color",
    });
    expect(attemptPuzzleMove(state, "a1", "b2")).toEqual({
      ok: false,
      reason: "illegal-move",
    });
    expect(attemptPuzzleMove(state, "z9", "a8")).toEqual({
      ok: false,
      reason: "invalid-square",
    });
  });
});
