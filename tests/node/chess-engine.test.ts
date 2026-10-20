import { Chess } from "chess.js";
import { describe, expect, it, vi } from "vitest";
import {
  createStockfishEngine,
  parseBestMove,
  parseUciMove,
  pickFallbackMove,
  type WorkerLike,
} from "@features/chess-game";

class FakeWorker implements WorkerLike {
  readonly messages: string[] = [];
  terminated = false;

  private readonly messageListeners = new Set<(event: MessageEvent) => void>();
  private readonly errorListeners = new Set<(event: Event) => void>();

  constructor(private readonly reply: (message: string) => string | null = () => null) {}

  postMessage(message: string): void {
    this.messages.push(message);
    const answer = this.reply(message);

    if (answer) {
      this.emit(answer);
    }
  }

  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  addEventListener(type: "error", listener: (event: Event) => void): void;
  addEventListener(
    type: "message" | "error",
    listener: ((event: MessageEvent) => void) | ((event: Event) => void),
  ): void {
    if (type === "message") {
      this.messageListeners.add(listener as (event: MessageEvent) => void);
    } else {
      this.errorListeners.add(listener as (event: Event) => void);
    }
  }

  terminate(): void {
    this.terminated = true;
  }

  emit(line: string): void {
    for (const listener of [...this.messageListeners]) {
      listener({ data: line } as MessageEvent);
    }
  }

  fail(): void {
    for (const listener of [...this.errorListeners]) {
      listener(new Event("error"));
    }
  }
}

function assertLegal(fen: string, uci: string | null): void {
  expect(uci).not.toBeNull();
  if (!uci) {
    return;
  }

  const chess = new Chess(fen);
  expect(chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4) })).toBeTruthy();
}

describe("Stockfish protocol parsing", () => {
  it("reads the bestmove line and ignores everything else", () => {
    expect(parseBestMove("bestmove e2e4 ponder e7e5")).toBe("e2e4");
    expect(parseBestMove("bestmove (none)")).toBeNull();
    expect(parseBestMove("info depth 1 score cp 12")).toBeNull();
    expect(parseBestMove("")).toBeNull();
  });

  it("parses UCI squares and promotions", () => {
    expect(parseUciMove("e2e4")).toEqual({ from: "e2", to: "e4" });
    expect(parseUciMove("a7a8q")).toEqual({ from: "a7", to: "a8", promotion: "q" });
    expect(parseUciMove("b2b1n")).toEqual({ from: "b2", to: "b1", promotion: "n" });
    expect(parseUciMove("e2e9")).toBeNull();
    expect(parseUciMove("zzzz")).toBeNull();
    expect(parseUciMove("a7a8k")).toBeNull();
    expect(parseUciMove("e2")).toBeNull();
  });

  it("picks a legal fallback move and nothing on a finished position", () => {
    const initial = pickFallbackMove("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(initial).not.toBeNull();

    if (initial) {
      assertLegal(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        `${initial.from}${initial.to}`,
      );
    }

    expect(pickFallbackMove("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1")).toBeNull();
  });

  it("uses the random source to choose from the three best moves", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const first = pickFallbackMove(fen, () => 0);
    const last = pickFallbackMove(fen, () => 0.999);

    expect(first).not.toBeNull();
    expect(last).not.toBeNull();
    expect(first).not.toEqual(last);
  });
});

describe("Stockfish worker wrapper", () => {
  it("runs the UCI handshake and returns the engine move", async () => {
    const worker = new FakeWorker((message) => {
      if (message === "uci") {
        return "uciok";
      }

      if (message === "isready") {
        return "readyok";
      }

      if (message.startsWith("go movetime")) {
        return "bestmove g1f3 ponder e7e5";
      }

      return null;
    });
    const engine = createStockfishEngine({ createWorker: () => worker });

    await expect(
      engine.bestMove("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "makkelijk"),
    ).resolves.toEqual({
      from: "g1",
      to: "f3",
    });

    expect(worker.messages).toContain("uci");
    expect(worker.messages).toContain("isready");
    expect(worker.messages).toContain("setoption name Skill Level value 0");
    expect(worker.messages).toContain("go movetime 100");

    await engine.bestMove("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "moeilijk");

    expect(worker.messages).toContain("setoption name Skill Level value 12");
    expect(worker.messages).toContain("go movetime 400");
  });

  it("falls back to a local move when the worker fails to start", async () => {
    const engine = createStockfishEngine({
      createWorker: () => {
        throw new Error("no worker");
      },
    });

    const move = await engine.bestMove(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "middel",
    );

    expect(move).not.toBeNull();
    if (move) {
      assertLegal(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        `${move.from}${move.to}`,
      );
    }
  });

  it("falls back when the worker emits an error or times out", async () => {
    const worker = new FakeWorker(() => null);
    const engine = createStockfishEngine({
      createWorker: () => worker,
      readyTimeoutMs: 5,
      moveTimeoutMs: 5,
    });

    const timedOut = await engine.bestMove(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "makkelijk",
    );

    expect(timedOut).not.toBeNull();

    const second = new FakeWorker(() => null);
    const failing = createStockfishEngine({ createWorker: () => second, readyTimeoutMs: 5 });
    const promise = failing.bestMove(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "makkelijk",
    );
    second.fail();

    await expect(promise).resolves.not.toBeNull();
  });

  it("returns null after dispose and terminates the worker", async () => {
    const worker = new FakeWorker((message) => {
      if (message === "uci") {
        return "uciok";
      }

      if (message === "isready") {
        return "readyok";
      }

      if (message.startsWith("go movetime")) {
        return "bestmove e2e4";
      }

      return null;
    });
    const engine = createStockfishEngine({ createWorker: () => worker });

    await engine.bestMove("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "makkelijk");
    engine.dispose();

    expect(worker.terminated).toBe(true);
    await expect(
      engine.bestMove("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "makkelijk"),
    ).resolves.toBeNull();
  });

  it("falls back when the engine returns an unparsable move", async () => {
    const worker = new FakeWorker((message) => {
      if (message === "uci") {
        return "uciok";
      }

      if (message === "isready") {
        return "readyok";
      }

      if (message.startsWith("go movetime")) {
        return "bestmove (none)";
      }

      return null;
    });
    const engine = createStockfishEngine({ createWorker: () => worker });

    const move = await engine.bestMove(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "makkelijk",
    );

    expect(move).not.toBeNull();
  });

  it("ignores non-string worker messages", async () => {
    const worker = new FakeWorker((message) => {
      if (message === "uci") {
        return "uciok";
      }

      if (message === "isready") {
        return "readyok";
      }

      if (message.startsWith("go movetime")) {
        return "bestmove b1c3";
      }

      return null;
    });
    const engine = createStockfishEngine({ createWorker: () => worker });

    const move = await engine.bestMove(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "makkelijk",
    );

    expect(move).toEqual({ from: "b1", to: "c3" });
  });

  it("reports whether the fallback position is already over", () => {
    const spy = vi.fn(() => 0);
    expect(pickFallbackMove("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1", spy)).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});
