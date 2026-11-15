import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import {
  CHESS_AVATARS,
  COMPUTER_LEVELS,
  COMPUTER_LEVEL_INFO,
  DEFAULT_AVATARS,
  INITIAL_FEN,
  checkedKingSquare,
  createDefaultPlayers,
  describeResult,
  fenAfterMoves,
  isChessAvatar,
  legalMoves,
  otherColor,
  playMove,
  turnOf,
} from "@entities/chess";

describe("chess rules", () => {
  it("switches sides and reads the turn from the FEN", () => {
    expect(otherColor("w")).toBe("b");
    expect(otherColor("b")).toBe("w");
    expect(turnOf(INITIAL_FEN)).toBe("w");
    expect(turnOf("8/8/8/8/8/8/8/K6k b - - 0 1")).toBe("b");
  });

  it("lists legal moves only for the piece that is on turn", () => {
    expect(legalMoves(INITIAL_FEN, "e2")).toEqual(expect.arrayContaining(["e3", "e4"]));
    expect(legalMoves(INITIAL_FEN, "b1")).toEqual(expect.arrayContaining(["a3", "c3"]));
    expect(legalMoves(INITIAL_FEN, "e7")).toEqual([]);
    expect(legalMoves(INITIAL_FEN, "e3")).toEqual([]);
    expect(legalMoves(INITIAL_FEN, "z9")).toEqual([]);
  });

  it("plays a legal move and records it", () => {
    const result = playMove(INITIAL_FEN, "e2", "e4");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.fen).toBe("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");
    expect(result.move).toEqual({
      from: "e2",
      to: "e4",
      san: "e4",
      color: "w",
    });
    expect(result.result).toEqual({ kind: "playing", check: false });
  });

  it("rejects illegal, missing and wrong-coloured moves", () => {
    expect(playMove(INITIAL_FEN, "e2", "e5")).toEqual({ ok: false, reason: "illegal-move" });
    expect(playMove(INITIAL_FEN, "e3", "e4")).toEqual({ ok: false, reason: "no-piece" });
    expect(playMove(INITIAL_FEN, "e7", "e5")).toEqual({ ok: false, reason: "wrong-color" });
    expect(playMove(INITIAL_FEN, "z9", "e4")).toEqual({ ok: false, reason: "invalid-square" });
  });

  it("asks for a promotion piece and applies the chosen piece", () => {
    const fen = "7k/P7/8/8/8/8/8/7K w - - 0 1";

    expect(playMove(fen, "a7", "a8")).toEqual({ ok: false, reason: "promotion-required" });

    const result = playMove(fen, "a7", "a8", "q");
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.move.promotion).toBe("q");
    expect(result.fen).toContain("Q6k");
  });

  it("recognises checkmate, stalemate, draws and check", () => {
    expect(describeResult("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1")).toEqual({ kind: "stalemate" });
    expect(describeResult("7k/6Q1/6K1/8/8/8/8/8 b - - 0 1")).toEqual({
      kind: "checkmate",
      winner: "w",
    });
    expect(describeResult("8/8/8/8/8/8/8/K6k w - - 0 1")).toEqual({
      kind: "draw",
      reason: "insufficient-material",
    });
    expect(describeResult("4k3/8/8/8/8/8/4R3/4K3 b - - 0 1")).toEqual({
      kind: "playing",
      check: true,
    });
  });

  it("finds the king that is in check", () => {
    expect(checkedKingSquare("4k3/8/8/8/8/8/4R3/4K3 b - - 0 1")).toBe("e8");
    expect(checkedKingSquare(INITIAL_FEN)).toBeNull();
  });

  it("replays SAN moves from the starting position", () => {
    expect(fenAfterMoves(["e4", "e5", "Nf3"])).toBe(
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
    );
    expect(() => fenAfterMoves(["e4", "e4"])).toThrow();
  });

  it("keeps the position unchanged when chess.js rejects a FEN", () => {
    expect(() => new Chess("nonsense")).toThrow();
    expect(playMove("nonsense", "e2", "e4")).toEqual({ ok: false, reason: "illegal-move" });
  });
});

describe("chess avatars and levels", () => {
  it("offers a fixed set of local emoji avatars", () => {
    expect(CHESS_AVATARS.length).toBeGreaterThan(3);
    expect(new Set(CHESS_AVATARS).size).toBe(CHESS_AVATARS.length);
    expect(isChessAvatar(CHESS_AVATARS[0])).toBe(true);
    expect(isChessAvatar("🦖")).toBe(false);
    expect(isChessAvatar(42)).toBe(false);
  });

  it("creates the default players and names", () => {
    const players = createDefaultPlayers();

    expect(players.w).toEqual({ name: "Wit", avatar: DEFAULT_AVATARS.w });
    expect(players.b).toEqual({ name: "Zwart", avatar: DEFAULT_AVATARS.b });
    expect(players.w).not.toBe(createDefaultPlayers().w);
  });

  it("orders the computer levels from gentle to strong", () => {
    const infos = COMPUTER_LEVELS.map((level) => COMPUTER_LEVEL_INFO[level]);

    expect(infos.map((info) => info.skill)).toEqual(
      [...infos.map((info) => info.skill)].sort((a, b) => a - b),
    );
    expect(infos.every((info) => info.movetime > 0)).toBe(true);
    expect(infos.every((info) => info.label.length > 0 && info.emoji.length > 0)).toBe(true);
  });
});
