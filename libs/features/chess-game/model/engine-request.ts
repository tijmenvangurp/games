import type { ComputerLevel } from "@entities/chess";
import { createStockfishEngine, type ChessEngine, type EngineMove } from "./engine";

let engine: ChessEngine | null = null;
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

/**
 * De dure wasm-worker wordt pas gemaakt als de computer echt aan zet is. Zo
 * blijft de hub, de les en de puzzels zonder engine laden.
 *
 * Verzoeken staan in een wachtrij: een hint en een computerzet kunnen elkaar
 * anders via hetzelfde UCI-protocol in de weg zitten.
 */
export function requestEngineMove(fen: string, level: ComputerLevel): Promise<EngineMove | null> {
  engine ??= createStockfishEngine();
  const active = engine;
  return enqueue(() => active.bestMove(fen, level));
}

export function disposeChessEngine(): void {
  engine?.dispose();
  engine = null;
  queue = Promise.resolve();
}
