import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";
import { describe, expect, it } from "vitest";
import {
  PUZZLES,
  attemptPuzzleMove,
  createPuzzleState,
  hintFor,
  type ChessPuzzle,
} from "@features/chess-puzzles";

const uci = (value: string) => ({
  from: value.slice(0, 2),
  to: value.slice(2, 4),
  ...(value[4] ? { promotion: value[4] } : {}),
});

function playPuzzle(puzzle: ChessPuzzle): {
  readonly chess: Chess;
  readonly playerColor: "w" | "b";
  readonly finalPiece: PieceSymbol | null;
  readonly lastMove: Move | null;
} {
  const chess = new Chess(puzzle.fen);
  const [setup, ...solution] = puzzle.moves;

  if (!setup || solution.length === 0) {
    throw new Error(`Puzzle ${puzzle.id} is incomplete`);
  }

  chess.move(uci(setup));
  const playerColor = chess.turn();
  let finalPiece: PieceSymbol | null = null;
  let lastMove: Move | null = null;

  for (const [index, move] of solution.entries()) {
    const parsed = uci(move);
    const piece = chess.get(parsed.from as Square);
    const applied = chess.move(parsed);

    if (index === solution.length - 1) {
      finalPiece = piece?.type ?? null;
      lastMove = applied;
    }
  }

  return { chess, playerColor, finalPiece, lastMove };
}

describe("Lichess puzzle data", () => {
  it("contains more than a hundred unique puzzles in three balanced tiers", () => {
    expect(PUZZLES).toHaveLength(124);
    expect(new Set(PUZZLES.map((puzzle) => puzzle.id)).size).toBe(PUZZLES.length);
    expect(PUZZLES.filter((puzzle) => puzzle.difficulty === "easy")).toHaveLength(42);
    expect(PUZZLES.filter((puzzle) => puzzle.difficulty === "medium")).toHaveLength(42);
    expect(PUZZLES.filter((puzzle) => puzzle.difficulty === "hard")).toHaveLength(40);
  });

  it("contains mate-in-two puzzles and varied pieces", () => {
    expect(
      PUZZLES.filter((puzzle: ChessPuzzle) => puzzle.themes.includes("mateIn2")).length,
    ).toBeGreaterThanOrEqual(25);
    expect(PUZZLES.some((puzzle) => puzzle.kind === "tactic")).toBe(true);

    const pieces = new Set<PieceSymbol>();
    const colors = new Set<"w" | "b">();

    for (const puzzle of PUZZLES) {
      const { playerColor, finalPiece } = playPuzzle(puzzle);
      colors.add(playerColor);
      if (finalPiece) {
        pieces.add(finalPiece);
      }
    }

    expect(colors).toEqual(new Set(["w", "b"]));
    for (const piece of ["p", "n", "b", "r", "q"] as const) {
      expect(pieces.has(piece), piece).toBe(true);
    }
  });

  it("loads every puzzle and verifies the recorded solution", () => {
    for (const puzzle of PUZZLES) {
      const { chess, lastMove, finalPiece } = playPuzzle(puzzle);

      expect(finalPiece, puzzle.id).not.toBeNull();
      expect(lastMove, puzzle.id).not.toBeNull();

      if (puzzle.kind === "mate") {
        expect(chess.isCheckmate(), puzzle.id).toBe(true);
      } else if (puzzle.kind === "capture") {
        expect(lastMove?.captured, puzzle.id).toBeDefined();
      } else {
        expect(chess.isCheckmate(), puzzle.id).toBe(false);
        expect(lastMove?.captured, puzzle.id).toBeUndefined();
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
    const puzzle = PUZZLES.find((candidate) => candidate.id === "k6mqE");

    if (!puzzle) {
      throw new Error("Hanging-piece puzzle not found");
    }

    const state = createPuzzleState(puzzle);
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
