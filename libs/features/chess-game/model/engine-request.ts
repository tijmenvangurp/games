import type { ComputerLevel } from "@entities/chess";
import { createStockfishEngine, type ChessEngine, type EngineMove } from "./engine";

let engine: ChessEngine | null = null;

/**
 * De dure wasm-worker wordt pas gemaakt als de computer echt aan zet is. Zo
 * blijft de hub, de les en de puzzels zonder engine laden.
 */
export function requestEngineMove(fen: string, level: ComputerLevel): Promise<EngineMove | null> {
  engine ??= createStockfishEngine();
  return engine.bestMove(fen, level);
}

export function disposeChessEngine(): void {
  engine?.dispose();
  engine = null;
}
