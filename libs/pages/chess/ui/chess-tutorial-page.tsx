import { useNavigate } from "@tanstack/react-router";
import { TutorialBoard } from "@features/chess-tutorial";
import { useTexts } from "@shared/i18n";
import { GameShell } from "@widgets/game-shell";
import { chessPageTexts } from "./texts";

export function ChessTutorialPage() {
  const t = useTexts(chessPageTexts);
  const navigate = useNavigate();

  return (
    <GameShell
      onBack={() => navigate({ to: "/schaken" })}
      subtitle={t.lessonSubtitle}
      title={t.lessonTitle}
    >
      <TutorialBoard />
    </GameShell>
  );
}
