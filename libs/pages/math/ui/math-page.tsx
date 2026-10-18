import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MATH_LEVEL_INFO, MATH_MODE_INFO, type MathRound } from "@entities/math";
import { MathPlay, MathSetup, useMathStore } from "@features/math-trainer";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

function subtitleFor(round: MathRound | null): string {
  if (!round) {
    return "Kies wat je wilt oefenen";
  }
  return `${MATH_MODE_INFO[round.mode].label} · ${MATH_LEVEL_INFO[round.level].label}`;
}

function celebrationTitle(stars: number): string {
  if (stars === 10) {
    return "Perfect!";
  }
  return stars >= 7 ? "Knap gedaan!" : "Goed geoefend!";
}

export function MathPage() {
  const navigate = useNavigate();
  const round = useMathStore((state) => state.round);
  const stars = useMathStore((state) => state.stars);
  const finished = useMathStore((state) => state.finished);
  const settings = useMathStore((state) => state.settings);
  const best = useMathStore((state) => state.best);
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !round;

  const startGame = () => {
    useMathStore.getState().start();
    setShowSetup(false);
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={round ? () => setShowSetup(true) : undefined}
      subtitle={subtitleFor(round)}
      title="Tafel Topper"
    >
      {setupVisible ? (
        <div className="mx-auto w-full max-w-xl">
          <MathSetup
            best={best}
            hasActiveGame={Boolean(round)}
            settings={settings}
            onBack={() => setShowSetup(false)}
            onLevelChange={(level) => useMathStore.getState().chooseLevel(level)}
            onModeChange={(mode) => useMathStore.getState().chooseMode(mode)}
            onStart={startGame}
          />
        </div>
      ) : (
        <MathPlay />
      )}

      {finished && !setupVisible ? (
        <CelebrationDialog
          description={`Je haalde ${stars} van de 10 sterren.`}
          title={celebrationTitle(stars)}
          onAgain={() => useMathStore.getState().newRound()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
