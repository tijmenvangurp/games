import { useNavigate } from "@tanstack/react-router";
import { ChessGame } from "@features/chess-game";
import { GameShell } from "@widgets/game-shell";

export function ChessGamePage() {
  const navigate = useNavigate();

  return (
    <GameShell
      onBack={() => navigate({ to: "/schaken" })}
      subtitle="Tegen de computer of samen"
      title="Schaakpartij"
    >
      <ChessGame onHome={() => navigate({ to: "/" })} />
    </GameShell>
  );
}
