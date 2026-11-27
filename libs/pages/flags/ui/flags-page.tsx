import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  flagLevelLabel,
  flagScopeLabel,
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
import { useLanguage, useTexts, type Language } from "@shared/i18n";
import { useGameSetupNavigation } from "@shared/lib";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";
import { flagsPageTexts } from "./texts";

type FlagsPageTexts = (typeof flagsPageTexts)[Language];

interface RoundSummary {
  scope: FlagScope;
  level: FlagLevel;
}

function subtitleFor(round: RoundSummary | null, t: FlagsPageTexts, language: Language): string {
  if (!round) {
    return t.chooseArea;
  }
  return `${flagScopeLabel(round.scope, language)} · ${flagLevelLabel(round.level, language)}`;
}

function celebrationTitle(stars: number, total: number, t: FlagsPageTexts): string {
  if (stars === total) {
    return t.perfect;
  }
  return stars >= total - 2 ? t.traveller : t.practised;
}

interface BodyProps {
  setupVisible: boolean;
  mode: FlagMode;
  settings: FlagSettings;
  best: Record<string, number>;
  onStart: () => void;
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
  const t = useTexts(flagsPageTexts);

  return (
    <CelebrationDialog
      description={t.stars(stars, total)}
      title={celebrationTitle(stars, total, t)}
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
  const language = useLanguage();
  const t = useTexts(flagsPageTexts);

  const activeRound = mode === "vlaggen" ? round : (puzzle?.round ?? null);
  const setupVisible = showSetup || !activeRound;
  const gameSetup = useGameSetupNavigation({
    setupVisible,
    hasActiveGame: Boolean(activeRound),
    backToGameLabel: t.backToGame,
    onCloseSetup: () => setShowSetup(false),
    onOpenSetup: () => setShowSetup(true),
  });
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
      {...gameSetup}
      showSpeech={false}
      subtitle={subtitleFor(activeRound, t, language)}
      title={t.title}
    >
      <Body
        best={best}
        mode={mode}
        settings={settings}
        setupVisible={setupVisible}
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
