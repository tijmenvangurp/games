import { useNavigate } from "@tanstack/react-router";
import { TutorialBoard } from "@features/chess-tutorial";
import { GameShell } from "@widgets/game-shell";

export function ChessPage() {
  const navigate = useNavigate();

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      subtitle="Leer de stukken kennen"
      title="Schaakles"
    >
      <TutorialBoard />
    </GameShell>
  );
}
