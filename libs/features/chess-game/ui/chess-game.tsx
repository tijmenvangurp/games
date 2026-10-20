import { useEffect } from "react";
import { disposeChessEngine } from "../model/engine-request";
import { useChessGameStore } from "../model/use-chess-game-store";
import { ChessGamePlay } from "./chess-game-play";
import { ChessGameSetup } from "./chess-game-setup";

interface ChessGameProps {
  readonly onHome: () => void;
}

export function ChessGame({ onHome }: ChessGameProps) {
  const phase = useChessGameStore((state) => state.phase);

  useEffect(() => {
    useChessGameStore.getState().resumeEngine();

    return () => {
      useChessGameStore.getState().suspendEngine();
      disposeChessEngine();
    };
  }, []);

  return phase === "setup" ? <ChessGameSetup /> : <ChessGamePlay onHome={onHome} />;
}
