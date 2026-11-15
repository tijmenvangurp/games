import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";
import { COMPUTER_LEVEL_INFO, type ComputerLevel } from "@entities/chess";
import { isChessSquare } from "@shared/lib";

export interface EngineMove {
  readonly from: Square;
  readonly to: Square;
  readonly promotion?: PieceSymbol;
}

export interface WorkerLike {
  postMessage(message: string): void;
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  addEventListener(type: "error", listener: (event: Event) => void): void;
  terminate(): void;
}

export interface ChessEngine {
  bestMove: (fen: string, level: ComputerLevel) => Promise<EngineMove | null>;
  dispose: () => void;
}

export interface EngineOptions {
  readonly createWorker?: () => WorkerLike;
  readonly readyTimeoutMs?: number;
  readonly moveTimeoutMs?: number;
}

const WORKER_URL = "/stockfish/stockfish.wasm.js";
const DEFAULT_READY_TIMEOUT_MS = 12_000;
const DEFAULT_MOVE_TIMEOUT_MS = 6_000;
const ERROR_LINE = "__stockfish_error__";

export function parseBestMove(line: string): string | null {
  const parts = line.trim().split(/\s+/);

  if (parts[0] !== "bestmove") {
    return null;
  }

  const uci = parts[1];
  return uci && uci !== "(none)" ? uci : null;
}

export function parseUciMove(uci: string): EngineMove | null {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.slice(4, 5);

  if (!isChessSquare(from) || !isChessSquare(to)) {
    return null;
  }

  if (promotion) {
    if (!isPromotionPiece(promotion)) {
      return null;
    }

    return { from, to, promotion };
  }

  return { from, to };
}

/**
 * Noodoplossing als de wasm-worker niet start (bijvoorbeeld door een browser
 * of CSP die WebAssembly weigert). Kiest uit de drie beste zetten, zodat de
 * partij altijd doorloopt.
 */
export function pickFallbackMove(
  fen: string,
  random: () => number = Math.random,
): EngineMove | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });

  if (moves.length === 0) {
    return null;
  }

  const ranked = [...moves].sort(
    (a, b) =>
      moveScore(b) - moveScore(a) || a.from.localeCompare(b.from) || a.to.localeCompare(b.to),
  );
  const pool = ranked.slice(0, Math.min(3, ranked.length));
  const chosen = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];

  return chosen ? toEngineMove(chosen) : null;
}

export function createStockfishEngine(options: EngineOptions = {}): ChessEngine {
  const createWorker = options.createWorker ?? defaultCreateWorker;
  const readyTimeoutMs = options.readyTimeoutMs ?? DEFAULT_READY_TIMEOUT_MS;
  const moveTimeoutMs = options.moveTimeoutMs ?? DEFAULT_MOVE_TIMEOUT_MS;
  const listeners = new Set<(line: string) => void>();

  let worker: WorkerLike | null = null;
  let failed = false;
  let disposed = false;
  let initializing: Promise<boolean> | null = null;
  let skill: number | null = null;

  function emit(line: string): void {
    for (const listener of [...listeners]) {
      listener(line);
    }
  }

  function ensureWorker(): WorkerLike | null {
    if (failed || disposed) {
      return null;
    }

    if (worker) {
      return worker;
    }

    try {
      const created = createWorker();
      created.addEventListener("message", (event) => {
        if (typeof event.data === "string") {
          emit(event.data);
        }
      });
      created.addEventListener("error", () => {
        failed = true;
        emit(ERROR_LINE);
      });
      worker = created;
      return created;
    } catch {
      failed = true;
      return null;
    }
  }

  function waitFor(
    predicate: (line: string) => boolean,
    timeoutMs: number,
  ): Promise<string | null> {
    return new Promise((resolve) => {
      const finish = (line: string | null) => {
        clearTimeout(timer);
        listeners.delete(listener);
        resolve(line);
      };
      const listener = (line: string) => {
        if (line === ERROR_LINE) {
          finish(null);
          return;
        }

        if (predicate(line)) {
          finish(line);
        }
      };
      const timer = setTimeout(() => finish(null), timeoutMs);
      listeners.add(listener);
    });
  }

  async function initialize(level: ComputerLevel): Promise<boolean> {
    const activeWorker = ensureWorker();

    if (!activeWorker) {
      return false;
    }

    if (!initializing) {
      initializing = (async () => {
        const ready = waitFor((line) => line.trim() === "uciok", readyTimeoutMs);
        activeWorker.postMessage("uci");

        if ((await ready) === null) {
          failed = true;
          return false;
        }

        return true;
      })();
    }

    if (!(await initializing)) {
      return false;
    }

    const nextSkill = COMPUTER_LEVEL_INFO[level].skill;

    if (skill !== nextSkill) {
      activeWorker.postMessage(`setoption name Skill Level value ${nextSkill}`);
      skill = nextSkill;
    }

    return true;
  }

  async function waitForReady(activeWorker: WorkerLike): Promise<boolean> {
    const ready = waitFor((line) => line.trim() === "readyok", readyTimeoutMs);
    activeWorker.postMessage("isready");

    return (await ready) !== null;
  }

  async function requestBestLine(
    activeWorker: WorkerLike,
    fen: string,
    level: ComputerLevel,
  ): Promise<string | null> {
    const best = waitFor((line) => line.trim().startsWith("bestmove"), moveTimeoutMs);
    activeWorker.postMessage(`position fen ${fen}`);
    activeWorker.postMessage(`go movetime ${COMPUTER_LEVEL_INFO[level].movetime}`);

    return best;
  }

  function fallbackUnlessDisposed(fen: string): EngineMove | null {
    return disposed ? null : pickFallbackMove(fen);
  }

  async function bestMove(fen: string, level: ComputerLevel): Promise<EngineMove | null> {
    if (disposed) {
      return null;
    }

    const activeWorker = ensureWorker();

    if (!activeWorker || !(await initialize(level))) {
      return fallbackUnlessDisposed(fen);
    }

    if (disposed) {
      return null;
    }

    if (!(await waitForReady(activeWorker))) {
      return fallbackUnlessDisposed(fen);
    }

    const line = await requestBestLine(activeWorker, fen, level);

    if (disposed) {
      return null;
    }

    return moveFromBestLine(line) ?? pickFallbackMove(fen);
  }

  return {
    bestMove,
    dispose: () => {
      disposed = true;
      failed = true;
      emit(ERROR_LINE);
      worker?.terminate();
      worker = null;
      initializing = null;
    },
  };
}

function defaultCreateWorker(): WorkerLike {
  return new Worker(WORKER_URL) as unknown as WorkerLike;
}

function moveFromBestLine(line: string | null): EngineMove | null {
  if (!line) {
    return null;
  }

  const uci = parseBestMove(line);

  return uci ? parseUciMove(uci) : null;
}

const PIECE_VALUES: Record<PieceSymbol, number> = { q: 9, r: 5, b: 3, n: 3, p: 1, k: 0 };

function moveScore(move: Move): number {
  if (move.san.includes("#")) {
    return 1_000;
  }

  if (move.captured) {
    return 100 + PIECE_VALUES[move.captured];
  }

  if (move.promotion) {
    return 50 + PIECE_VALUES[move.promotion];
  }

  if (move.san.includes("+")) {
    return 10;
  }

  return 0;
}

function toEngineMove(move: Move): EngineMove {
  if (move.promotion) {
    return { from: move.from, to: move.to, promotion: move.promotion };
  }

  return { from: move.from, to: move.to };
}

function isPromotionPiece(value: string): value is PieceSymbol {
  return value === "q" || value === "r" || value === "b" || value === "n";
}
