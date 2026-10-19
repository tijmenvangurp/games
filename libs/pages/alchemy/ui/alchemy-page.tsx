import { useNavigate } from "@tanstack/react-router";
import { AlchemyPlay } from "@features/alchemy-lab";
import { GameShell } from "@widgets/game-shell";

export function AlchemyPage() {
  const navigate = useNavigate();

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      subtitle="Tik of sleep om te mengen"
      title="Mengelmoes"
    >
      <AlchemyPlay />
    </GameShell>
  );
}
