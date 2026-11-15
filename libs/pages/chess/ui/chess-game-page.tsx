import { useNavigate } from "@tanstack/react-router";
import { ChessGame, useChessGameStore } from "@features/chess-game";
import { GameShell } from "@widgets/game-shell";

export function ChessGamePage() {
  const navigate = useNavigate();
  const phase = useChessGameStore((state) => state.phase);

  return (
    <GameShell
      onBack={() => navigate({ to: "/schaken" })}
      subtitle={phase === "playing" ? undefined : "Tegen de computer of samen"}
      title="Schaakpartij"
      titleClassName="text-xl sm:text-2xl"
    >
      <ChessGame onHome={() => navigate({ to: "/" })} />
    </GameShell>
  );
}
