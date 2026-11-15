import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INITIAL_FEN, createDefaultPlayers } from "@entities/chess";
import {
  createDefaultState,
  disposeChessEngine,
  resultOf,
  useChessGameStore,
} from "@features/chess-game";

function resetStore(): void {
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
  });
}

function store() {
  return useChessGameStore.getState();
}

beforeEach(() => {
  localStorage.clear();
  disposeChessEngine();
  resetStore();
});

afterEach(() => {
  disposeChessEngine();
});

describe("chess game store", () => {
  it("keeps setup settings and starts a friend game", () => {
    store().setMode("friend");
    store().setLevel("moeilijk");
    store().setHumanColor("b");
    store().setPlayerName("w", "  Sam  ");
    store().setPlayerAvatar("b", "🦁");

    expect(store().mode).toBe("friend");
    expect(store().level).toBe("moeilijk");
    expect(store().players.w.name).toBe("  Sam  ");
    expect(store().players.b.avatar).toBe("🦁");

    store().startGame();

    expect(store().phase).toBe("playing");
    expect(store().fen).toBe(INITIAL_FEN);
    expect(store().history).toEqual([]);
    expect(store().thinking).toBe(false);
    expect(store().feedback).toBe("idle");
    expect(store().gameId).toBe(1);
  });

  it("truncates long names and ignores unknown avatars", () => {
    store().setPlayerName("w", "Een veel te lange naam voor een kind");
    expect(store().players.w.name).toHaveLength(14);

    store().setPlayerAvatar("w", "🦖");
    expect(store().players.w.avatar).toBe(createDefaultPlayers().w.avatar);
  });

  it("selects a piece, shows targets and moves by tapping", () => {
    store().startGame();

    store().selectSquare("e2");
    expect(store().selectedSquare).toBe("e2");
    expect(store().legalTargets).toEqual(expect.arrayContaining(["e3", "e4"]));

    store().selectSquare("e4");

    expect(store().history).toHaveLength(1);
    expect(store().history[0]?.san).toBe("e4");
    expect(store().lastMove).toEqual({ from: "e2", to: "e4" });
    expect(store().selectedSquare).toBeNull();
    expect(store().legalTargets).toEqual([]);
    expect(store().canUndo()).toBe(true);

    store().undo();

    expect(store().fen).toBe(INITIAL_FEN);
    expect(store().history).toEqual([]);
    expect(store().lastMove).toBeNull();
    expect(store().canUndo()).toBe(false);
  });

  it("switches selection and cancels it by tapping the same square", () => {
    store().startGame();

    store().selectSquare("e2");
    store().selectSquare("d2");

    expect(store().selectedSquare).toBe("d2");
    expect(store().legalTargets).toEqual(expect.arrayContaining(["d3", "d4"]));

    store().selectSquare("d2");

    expect(store().selectedSquare).toBeNull();
    expect(store().legalTargets).toEqual([]);
  });

  it("reports an illegal move and a piece of the other colour", () => {
    store().startGame();

    expect(store().attemptMove("e2", "e5")).toBe(false);
    expect(store().feedback).toBe("illegal");

    expect(store().attemptMove("e7", "e5")).toBe(false);
    expect(store().feedback).toBe("not-your-turn");
    expect(store().history).toEqual([]);
  });

  it("asks for a promotion and applies the chosen piece", () => {
    useChessGameStore.setState({
      phase: "playing",
      fen: "7k/P7/8/8/8/8/8/7K w - - 0 1",
      history: [],
      lastMove: null,
    });

    expect(store().attemptMove("a7", "a8")).toBe(false);
    expect(store().pendingPromotion).toEqual({ from: "a7", to: "a8" });

    store().choosePromotion("q");

    expect(store().pendingPromotion).toBeNull();
    expect(store().history).toHaveLength(1);
    expect(store().history[0]?.promotion).toBe("q");
    expect(store().fen).toContain("Q6k");
  });

  it("cancels a promotion without moving", () => {
    useChessGameStore.setState({
      phase: "playing",
      fen: "7k/P7/8/8/8/8/8/7K w - - 0 1",
      history: [],
      pendingPromotion: { from: "a7", to: "a8" },
    });

    store().cancelPromotion();

    expect(store().pendingPromotion).toBeNull();
    expect(store().history).toEqual([]);
  });

  it("resigns on behalf of the player who is to move", () => {
    store().startGame();
    store().attemptMove("e2", "e4");

    store().resign();

    expect(store().resignedBy).toBe("b");
    expect(resultOf(store())).toEqual({ kind: "resigned", winner: "w" });
    expect(store().attemptMove("e7", "e5")).toBe(false);
  });

  it("keeps an unfinished game when opening the settings", () => {
    store().startGame();
    store().attemptMove("e2", "e4");

    store().resetToSetup();

    expect(store().phase).toBe("setup");
    expect(store().history).toHaveLength(1);
    expect(store().canResume()).toBe(true);

    store().resumeGame();

    expect(store().phase).toBe("playing");
    expect(store().history).toHaveLength(1);
    expect(store().lastMove).toEqual({ from: "e2", to: "e4" });
  });

  it("drops a finished game when opening the settings", () => {
    store().startGame();
    store().attemptMove("e2", "e4");
    store().resign();

    store().resetToSetup();

    expect(store().phase).toBe("setup");
    expect(store().history).toEqual([]);
    expect(store().canResume()).toBe(false);
  });

  it("starts a fresh game while another one is paused", () => {
    store().startGame();
    store().attemptMove("e2", "e4");
    store().resetToSetup();

    store().startGame();

    expect(store().history).toEqual([]);
    expect(store().canResume()).toBe(false);
  });

  it("reveals a hint in two steps and clears it after moving", async () => {
    store().startGame();

    store().requestHint();
    expect(store().hintThinking).toBe(true);

    await vi.waitFor(() => {
      expect(store().hint).not.toBeNull();
    });

    expect(store().hintThinking).toBe(false);
    expect(store().hintTarget).toBe(false);

    store().requestHint();
    expect(store().hintTarget).toBe(true);

    store().requestHint();
    expect(store().hint).toBeNull();

    store().requestHint();
    await vi.waitFor(() => {
      expect(store().hint).not.toBeNull();
    });

    const hint = store().hint;
    expect(hint).not.toBeNull();
    expect(store().attemptMove(hint!.from, hint!.to)).toBe(true);
    expect(store().hint).toBeNull();
    expect(store().hintTarget).toBe(false);
  });

  it("starts a new game and resets to setup", () => {
    store().startGame();
    store().selectSquare("e2");
    store().resign();
    const gamesPlayed = store().gameId;

    store().startGame();
    expect(store().resignedBy).toBeNull();
    expect(store().fen).toBe(INITIAL_FEN);
    expect(store().gameId).toBe(gamesPlayed + 1);

    store().resetToSetup();

    expect(store().phase).toBe("setup");
    expect(store().history).toEqual([]);
    expect(store().selectedSquare).toBeNull();
  });

  it("suspends a thinking engine and ignores the late answer", () => {
    useChessGameStore.setState({
      ...createDefaultState(),
      phase: "playing",
      mode: "computer",
      humanColor: "w",
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      thinking: true,
      gameId: 4,
    });

    store().suspendEngine();

    expect(store().thinking).toBe(false);
    expect(store().gameId).toBe(5);
    expect(store().feedback).toBe("idle");
  });

  it("gives the human a side name again after switching sides", () => {
    useChessGameStore.setState({
      ...createDefaultState(),
      mode: "computer",
      humanColor: "b",
    });

    store().startGame();

    expect(store().players.w.name).toBe("Computer");
    expect(store().players.b.name).toBe("Zwart");

    store().resetToSetup();
    store().setHumanColor("w");
    store().startGame();

    expect(store().players.w.name).toBe("Wit");
    expect(store().players.b.name).toBe("Computer");
  });

  it("lets the computer answer through the local fallback when no worker exists", async () => {
    useChessGameStore.setState({
      ...createDefaultState(),
      phase: "setup",
      mode: "computer",
      humanColor: "b",
      gameId: 0,
    });

    store().startGame();

    expect(store().phase).toBe("playing");
    expect(store().thinking).toBe(true);

    await vi.waitFor(() => {
      expect(store().history).toHaveLength(1);
    });

    expect(store().thinking).toBe(false);
    expect(store().feedback).toBe("idle");
    expect(store().fen).not.toBe(INITIAL_FEN);
  });

  it("finishes a computer game with a win for the human", () => {
    useChessGameStore.setState({
      ...createDefaultState(),
      phase: "playing",
      mode: "computer",
      humanColor: "w",
      fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
      history: [],
    });

    expect(store().attemptMove("f7", "f8")).toBe(true);
    expect(resultOf(store())).toEqual({ kind: "checkmate", winner: "w" });
  });

  it("persists the game so a reload can continue", () => {
    store().startGame();
    store().attemptMove("e2", "e4");

    const raw = localStorage.getItem("games.chess.v1");
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw ?? "{}") as { phase?: string; history?: unknown[] };
    expect(parsed.phase).toBe("playing");
    expect(parsed.history).toHaveLength(1);
  });
});
