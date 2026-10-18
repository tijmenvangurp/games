import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CrosswordPlay, CrosswordSetup, useCrosswordStore } from "@features/crossword";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

export function CrosswordPage() {
  const navigate = useNavigate();
  const puzzle = useCrosswordStore((state) => state.puzzle);
  const selected = useCrosswordStore((state) => state.selected);
  const solved = useCrosswordStore((state) => state.solved);
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !selected;

  const startGame = () => {
    useCrosswordStore.getState().start();
    setShowSetup(false);
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={selected ? () => setShowSetup(true) : undefined}
      subtitle={`${puzzle.category} · ${puzzle.entries.length} woorden`}
      title="Kruiswoord"
    >
      {setupVisible ? (
        <div className="mx-auto w-full max-w-xl">
          <CrosswordSetup
            hasActiveGame={Boolean(selected)}
            onBack={() => setShowSetup(false)}
            onStart={startGame}
          />
        </div>
      ) : (
        <CrosswordPlay />
      )}

      {solved && !setupVisible ? (
        <CelebrationDialog
          description={`Je hebt alle ${puzzle.entries.length} woorden gevonden.`}
          title="Opgelost!"
          onAgain={() => useCrosswordStore.getState().restart()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
