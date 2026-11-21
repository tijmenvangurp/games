import { useNavigate } from "@tanstack/react-router";
import { AlchemyPlay } from "@features/alchemy-lab";
import { useTexts } from "@shared/i18n";
import { GameShell } from "@widgets/game-shell";
import { alchemyPageTexts } from "./texts";

export function AlchemyPage() {
  const navigate = useNavigate();
  const t = useTexts(alchemyPageTexts);

  return (
    <GameShell
      fitViewport
      onBack={() => navigate({ to: "/" })}
      subtitle={t.subtitle}
      title={t.title}
      wide
    >
      <AlchemyPlay />
    </GameShell>
  );
}
