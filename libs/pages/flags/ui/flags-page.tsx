import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  FLAG_LEVEL_INFO,
  FLAG_SCOPE_INFO,
  type FlagLevel,
  type FlagScope,
} from "@entities/geography";
import {
  FlagsPlay,
  FlagsSetup,
  PuzzlePlay,
  useFlagStore,
  type FlagMode,
  type FlagSettings,
} from "@features/flag-game";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

interface RoundSummary {
  scope: FlagScope;
  level: FlagLevel;
}

function subtitleFor(round: RoundSummary | null): string {
  if (!round) {
    return "Kies een gebied";
  }
  return `${FLAG_SCOPE_INFO[round.scope].label} · ${FLAG_LEVEL_INFO[round.level].label}`;
}

function celebrationTitle(stars: number, total: number): string {
  if (stars === total) {
    return "Perfect!";
  }
  return stars >= total - 2 ? "Wat een wereldreiziger!" : "Goed geoefend!";
}

interface BodyProps {
  setupVisible: boolean;
  mode: FlagMode;
  settings: FlagSettings;
  best: Record<string, number>;
  hasActiveGame: boolean;
  onStart: () => void;
  onBack: () => void;
  onModeChange: (mode: FlagMode) => void;
  onScopeChange: (scope: FlagScope) => void;
  onLevelChange: (level: FlagLevel) => void;
}

function Body({ setupVisible, mode, ...setup }: BodyProps) {
  if (setupVisible) {
    return (
      <div className="mx-auto my-auto w-full max-w-2xl">
        <FlagsSetup {...setup} />
      </div>
    );
  }

  return mode === "vlaggen" ? <FlagsPlay /> : <PuzzlePlay />;
}

interface CelebrationProps {
  stars: number;
  total: number;
  onAgain: () => void;
  onChoose: () => void;
  onHome: () => void;
}

function Celebration({ stars, total, onAgain, onChoose, onHome }: CelebrationProps) {
  return (
    <CelebrationDialog
      description={`Je haalde ${stars} van de ${total} sterren.`}
      title={celebrationTitle(stars, total)}
      onAgain={onAgain}
      onChoose={onChoose}
      onHome={onHome}
    />
  );
}

export function FlagsPage() {
  const navigate = useNavigate();
  const mode = useFlagStore((state) => state.settings.mode);
  const round = useFlagStore((state) => state.round);
  const puzzle = useFlagStore((state) => state.puzzle);
  const stars = useFlagStore((state) => state.stars);
  const finished = useFlagStore((state) => state.finished);
  const settings = useFlagStore((state) => state.settings);
  const best = useFlagStore((state) => state.best);
  const [showSetup, setShowSetup] = useState(false);

  const activeRound = mode === "vlaggen" ? round : (puzzle?.round ?? null);
  const setupVisible = showSetup || !activeRound;
  const totalStars = activeRound?.questions.length ?? 10;

  const startGame = () => {
    setShowSetup(false);
    if (mode === "vlaggen") {
      useFlagStore.getState().start();
    } else {
      void useFlagStore.getState().startPuzzle();
    }
  };

  const playAgain = () => {
    if (mode === "vlaggen") {
      useFlagStore.getState().newRound();
    } else {
      void useFlagStore.getState().startPuzzle();
    }
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={activeRound ? () => setShowSetup(true) : undefined}
      subtitle={subtitleFor(activeRound)}
      title="Vlaggenreis"
    >
      <Body
        best={best}
        hasActiveGame={Boolean(activeRound)}
        mode={mode}
        settings={settings}
        setupVisible={setupVisible}
        onBack={() => setShowSetup(false)}
        onLevelChange={(level) => useFlagStore.getState().chooseLevel(level)}
        onModeChange={(nextMode) => useFlagStore.getState().chooseMode(nextMode)}
        onScopeChange={(scope) => useFlagStore.getState().chooseScope(scope)}
        onStart={startGame}
      />

      {finished && !setupVisible ? (
        <Celebration
          stars={stars}
          total={totalStars}
          onAgain={playAgain}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
