import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { pairsForLevel } from "@entities/memory";
import { MemoryPlay, MemorySetup, useMemoryStore } from "@features/memory-game";
import { GameShell } from "@widgets/game-shell";
import { CelebrationDialog } from "@shared/ui";
import { useGameSetupNavigation } from "@shared/lib";

interface DescriptionInput {
  challengeWon: boolean;
  challengeTried: boolean;
  delta: number;
  nextPairs: number;
}

function descriptionFor({
  challengeWon,
  challengeTried,
  delta,
  nextPairs,
}: DescriptionInput): string {
  if (challengeWon) {
    return `Je koos de uitdaging en haalde hem. We gaan verder met ${nextPairs} paren.`;
  }
  if (challengeTried) {
    return "Dat was een flinke uitdaging. Je bleef proberen; volgende keer pakken we weer een haalbaar bord.";
  }
  if (delta > 0) {
    return `Je bleef zoeken en vond ze allemaal. Volgende keer ${nextPairs} paren.`;
  }
  if (delta < 0) {
    return "Je bleef proberen. Volgende keer doen we het iets rustiger aan.";
  }
  return "Je bleef zoeken en vond elk paar.";
}

function subtitleFor(scene: { pairs: number } | null, mode: "auto" | "manual"): string {
  if (!scene) {
    return "Kies je spel";
  }
  return `${scene.pairs} paren · ${mode === "auto" ? "groeit mee" : "zelf gekozen"}`;
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
  if (!open) {
    return null;
  }
  return (
    <CelebrationDialog
      description={description}
      title={challengeWon ? "Uitdaging gelukt!" : "Alle Pokémon gevonden!"}
      onAgain={onAgain}
      onChoose={onChoose}
      onHome={onHome}
    />
  );
}

export function MemoryPage() {
  const navigate = useNavigate();
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
    backToGameLabel: "Terug naar je spel",
    onCloseSetup: () => setShowSetup(false),
    onOpenSetup: () => setShowSetup(true),
  });
  const challengeWon = isChallenge && lastRound !== null && lastRound.delta > 0;
  const description = descriptionFor({
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
      subtitle={subtitleFor(scene, settings.mode)}
      title="Pokémon Memory"
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
