import { useNavigate } from "@tanstack/react-router";
import { TutorialBoard } from "@features/chess-tutorial";
import { GameShell } from "@widgets/game-shell";

export function ChessPage() {
  const navigate = useNavigate();

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      subtitle="Leer de looproutes van de stukken"
      title="Schaaktutorial"
    >
      <TutorialBoard />
    </GameShell>
  );
}
