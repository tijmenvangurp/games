import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { mathTexts, type MathRound } from "@entities/math";
import { MathPlay, MathSetup, useMathStore } from "@features/math-trainer";
import { CelebrationDialog } from "@shared/ui";
import { getTexts, useTexts } from "@shared/i18n";
import { useGameSetupNavigation } from "@shared/lib";
import { GameShell } from "@widgets/game-shell";
import { mathPageTexts } from "./texts";

type PageTexts = (typeof mathPageTexts)["nl"];

function subtitleFor(round: MathRound | null, t: PageTexts): string {
  if (!round) {
    return t.chooseSubtitle;
  }
  const math = getTexts(mathTexts);
  return `${math.modes[round.mode].label} · ${math.levels[round.level]}`;
}

function celebrationTitle(stars: number, t: PageTexts): string {
  if (stars === 10) {
    return t.allStars;
  }
  return stars >= 7 ? t.manyStars : t.someStars;
}

export function MathPage() {
  const navigate = useNavigate();
  const t = useTexts(mathPageTexts);
  const round = useMathStore((state) => state.round);
  const stars = useMathStore((state) => state.stars);
  const finished = useMathStore((state) => state.finished);
  const settings = useMathStore((state) => state.settings);
  const best = useMathStore((state) => state.best);
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !round;
  const gameSetup = useGameSetupNavigation({
    setupVisible,
    hasActiveGame: Boolean(round),
    backToGameLabel: t.backToGame,
    onCloseSetup: () => setShowSetup(false),
    onOpenSetup: () => setShowSetup(true),
  });

  const startGame = () => {
    useMathStore.getState().start();
    setShowSetup(false);
  };

  return (
    <GameShell {...gameSetup} subtitle={subtitleFor(round, t)} title={t.title}>
      {setupVisible ? (
        <div className="mx-auto w-full max-w-xl">
          <MathSetup
            best={best}
            settings={settings}
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
          confetti
          description={t.stars(stars)}
          title={celebrationTitle(stars, t)}
          onAgain={() => useMathStore.getState().newRound()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
