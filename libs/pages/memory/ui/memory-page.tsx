import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { pairsForLevel } from "@entities/memory";
import { MemoryPlay, MemorySetup, useMemoryStore } from "@features/memory-game";
import { GameShell } from "@widgets/game-shell";
import { useTexts } from "@shared/i18n";
import { CelebrationDialog } from "@shared/ui";
import { useGameSetupNavigation } from "@shared/lib";
import { memoryPageTexts } from "./texts";

type MemoryPageTexts = (typeof memoryPageTexts)["nl"];

interface DescriptionInput {
  challengeWon: boolean;
  challengeTried: boolean;
  delta: number;
  nextPairs: number;
}

function descriptionFor(
  t: MemoryPageTexts,
  { challengeWon, challengeTried, delta, nextPairs }: DescriptionInput,
): string {
  if (challengeWon) {
    return t.challengeWon(nextPairs);
  }
  if (challengeTried) {
    return t.challengeTried;
  }
  if (delta > 0) {
    return t.levelUp(nextPairs);
  }
  if (delta < 0) {
    return t.levelDown;
  }
  return t.steady;
}

function subtitleFor(
  t: MemoryPageTexts,
  scene: { pairs: number } | null,
  mode: "auto" | "manual",
): string {
  if (!scene) {
    return t.chooseSubtitle;
  }
  return t.subtitle(scene.pairs, t.modes[mode]);
}

interface CelebrationProps {
  open: boolean;
  challengeWon: boolean;
  description: string;
  onAgain: () => void;
  onChoose: () => void;
  onHome: () => void;
}

function MemoryCelebration({
  open,
  challengeWon,
  description,
  onAgain,
  onChoose,
  onHome,
}: CelebrationProps) {
  const t = useTexts(memoryPageTexts);
  if (!open) {
    return null;
  }
  return (
    <CelebrationDialog
      description={description}
      title={challengeWon ? t.challengeWonTitle : t.foundTitle}
      onAgain={onAgain}
      onChoose={onChoose}
      onHome={onHome}
    />
  );
}

export function MemoryPage() {
  const navigate = useNavigate();
  const t = useTexts(memoryPageTexts);
  const { scene, settings, found, lastRound, isChallenge } = useMemoryStore(
    useShallow((state) => ({
      scene: state.scene,
      settings: state.settings,
      found: state.found,
      lastRound: state.lastRound,
      isChallenge: state.isChallenge,
    })),
  );
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !scene;
  const gameSetup = useGameSetupNavigation({
    setupVisible,
    hasActiveGame: Boolean(scene),
    backToGameLabel: t.backToGame,
    onCloseSetup: () => setShowSetup(false),
    onOpenSetup: () => setShowSetup(true),
  });
  const challengeWon = isChallenge && lastRound !== null && lastRound.delta > 0;
  const description = descriptionFor(t, {
    challengeWon,
    challengeTried: isChallenge && !challengeWon,
    delta: lastRound?.delta ?? 0,
    nextPairs: pairsForLevel(settings.adaptive.levelIndex),
  });

  const startGame = () => {
    useMemoryStore.getState().newGame();
    setShowSetup(false);
  };

  return (
    <GameShell
      {...gameSetup}
      showSpeech={false}
      subtitle={subtitleFor(t, scene, settings.mode)}
      title={t.title}
    >
      {setupVisible ? (
        <div className="mx-auto w-full max-w-xl">
          <MemorySetup
            settings={settings}
            onLevelChange={(levelIndex) => useMemoryStore.getState().chooseManualLevel(levelIndex)}
            onModeChange={(mode) => useMemoryStore.getState().chooseMode(mode)}
            onStart={startGame}
          />
        </div>
      ) : (
        <MemoryPlay />
      )}

      <MemoryCelebration
        challengeWon={challengeWon}
        description={description}
        open={found && !setupVisible}
        onAgain={() => useMemoryStore.getState().newGame()}
        onChoose={() => setShowSetup(true)}
        onHome={() => navigate({ to: "/" })}
      />
    </GameShell>
  );
}
