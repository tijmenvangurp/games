import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FLAG_LEVEL_INFO, FLAG_SCOPE_INFO, type FlagRound } from "@entities/flag";
import { FlagsPlay, FlagsSetup, useFlagStore } from "@features/flag-quiz";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

function subtitleFor(round: FlagRound | null): string {
  if (!round) {
    return "Kies een continent";
  }
  return `${FLAG_SCOPE_INFO[round.scope].label} · ${FLAG_LEVEL_INFO[round.level].label}`;
}

function celebrationTitle(stars: number): string {
  if (stars === 10) {
    return "Perfect!";
  }
  return stars >= 7 ? "Wat een wereldreiziger!" : "Goed geoefend!";
}

export function FlagsPage() {
  const navigate = useNavigate();
  const round = useFlagStore((state) => state.round);
  const stars = useFlagStore((state) => state.stars);
  const finished = useFlagStore((state) => state.finished);
  const settings = useFlagStore((state) => state.settings);
  const best = useFlagStore((state) => state.best);
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !round;

  const startGame = () => {
    useFlagStore.getState().start();
    setShowSetup(false);
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={round ? () => setShowSetup(true) : undefined}
      subtitle={subtitleFor(round)}
      title="Vlaggenreis"
    >
      {setupVisible ? (
        <div className="mx-auto w-full max-w-xl">
          <FlagsSetup
            best={best}
            hasActiveGame={Boolean(round)}
            settings={settings}
            onBack={() => setShowSetup(false)}
            onLevelChange={(level) => useFlagStore.getState().chooseLevel(level)}
            onScopeChange={(scope) => useFlagStore.getState().chooseScope(scope)}
            onStart={startGame}
          />
        </div>
      ) : (
        <FlagsPlay />
      )}

      {finished && !setupVisible ? (
        <CelebrationDialog
          description={`Je haalde ${stars} van de 10 sterren.`}
          title={celebrationTitle(stars)}
          onAgain={() => useFlagStore.getState().newRound()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
