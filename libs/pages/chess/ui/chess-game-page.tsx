import { useNavigate } from "@tanstack/react-router";
import { ChessGame, useChessGameStore } from "@features/chess-game";
import { useTexts } from "@shared/i18n";
import { GameShell } from "@widgets/game-shell";
import { chessPageTexts } from "./texts";

export function ChessGamePage() {
  const t = useTexts(chessPageTexts);
  const navigate = useNavigate();
  const phase = useChessGameStore((state) => state.phase);

  return (
    <GameShell
      onBack={() => navigate({ to: "/schaken" })}
      subtitle={phase === "playing" ? undefined : t.gameSubtitle}
      title={t.gameTitle}
      titleClassName="text-xl sm:text-2xl"
    >
      <ChessGame onHome={() => navigate({ to: "/" })} />
    </GameShell>
  );
}
