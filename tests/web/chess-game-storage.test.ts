import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHESS_STORAGE_KEY,
  createDefaultState,
  loadChessState,
  saveChessState,
  type StoredChessState,
} from "@features/chess-game";
import { INITIAL_FEN } from "@entities/chess";

function playingState(overrides: Partial<StoredChessState> = {}): StoredChessState {
  return {
    ...createDefaultState(),
    phase: "playing",
    fen: INITIAL_FEN,
    history: [],
    ...overrides,
  };
}

function store(state: unknown): void {
  localStorage.setItem(CHESS_STORAGE_KEY, JSON.stringify(state));
}

beforeEach(() => {
  localStorage.clear();
});

describe("chess state storage", () => {
  it("starts in setup with the default players", () => {
    expect(createDefaultState()).toEqual({
      phase: "setup",
      mode: "friend",
      level: "makkelijk",
      humanColor: "w",
      players: {
        w: { name: "Wit", avatar: "🦊" },
        b: { name: "Zwart", avatar: "🐼" },
      },
      fen: INITIAL_FEN,
      history: [],
      resignedBy: null,
    });
  });

  it("round-trips a setup and a playing state", () => {
    const setup = createDefaultState();
    saveChessState(setup);
    expect(loadChessState()).toEqual(setup);

    const playing = playingState({
      history: [
        { from: "e2", to: "e4", san: "e4", color: "w" },
        { from: "e7", to: "e5", san: "e5", color: "b" },
      ],
      fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    });
    saveChessState(playing);
    expect(loadChessState()).toEqual(playing);
  });

  it("round-trips a paused game that is still in setup", () => {
    const paused = {
      ...playingState({
        history: [
          { from: "e2", to: "e4", san: "e4", color: "w" },
          { from: "e7", to: "e5", san: "e5", color: "b" },
        ],
        fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
      }),
      phase: "setup" as const,
    };

    saveChessState(paused);

    expect(loadChessState()).toEqual(paused);
  });

  it("keeps settings when there is no unfinished game", () => {
    store({
      mode: "computer",
      level: "moeilijk",
      humanColor: "b",
      players: {
        w: { name: "Sam", avatar: "🦁" },
        b: { name: "Computer", avatar: "🤖" },
      },
      phase: "setup",
    });

    const loaded = loadChessState();

    expect(loaded.phase).toBe("setup");
    expect(loaded.mode).toBe("computer");
    expect(loaded.level).toBe("moeilijk");
    expect(loaded.humanColor).toBe("b");
    expect(loaded.players.w.name).toBe("Sam");
  });

  it("falls back to defaults for malformed JSON, arrays and unknown values", () => {
    localStorage.setItem(CHESS_STORAGE_KEY, "{nope");
    expect(loadChessState()).toEqual(createDefaultState());

    store([]);
    expect(loadChessState()).toEqual(createDefaultState());

    store({
      mode: "online",
      level: "onmogelijk",
      humanColor: "groen",
      players: { w: { name: "Te lang".repeat(10), avatar: "🦖" }, b: null },
    });
    expect(loadChessState()).toEqual(createDefaultState());
  });

  it("rejects a playing state with a broken history", () => {
    store(playingState({ history: [{ from: "e2", to: "e5", san: "e5", color: "w" }] }));
    expect(loadChessState().phase).toBe("setup");

    store(playingState({ history: [{ from: "e2", to: "e4", san: "e4", color: "b" }] }));
    expect(loadChessState().phase).toBe("setup");

    store(playingState({ history: [{ from: "e2", to: "e4", san: "e4", color: "w" }] }));
    expect(loadChessState().phase).toBe("setup");
  });

  it("rejects a FEN that does not match the history or the rules", () => {
    store(
      playingState({
        history: [{ from: "e2", to: "e4", san: "e4", color: "w" }],
        fen: INITIAL_FEN,
      }),
    );
    expect(loadChessState().phase).toBe("setup");

    store(playingState({ fen: "nonsense" }));
    expect(loadChessState().phase).toBe("setup");
  });

  it("keeps a resignation and drops unknown resignation colours", () => {
    store(playingState({ resignedBy: "b" }));
    expect(loadChessState().resignedBy).toBe("b");

    store({ ...playingState(), resignedBy: "groen" });
    expect(loadChessState().phase).toBe("setup");
  });

  it("ignores a missing or broken localStorage without throwing", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadChessState()).toEqual(createDefaultState());
    getItem.mockRestore();

    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    expect(() => saveChessState(createDefaultState())).not.toThrow();
    setItem.mockRestore();
  });
});
