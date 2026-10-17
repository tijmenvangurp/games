import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createMemoryScene } from "@entities/memory";
import { MemoryPlay, MemorySetup, useMemoryStore } from "@features/memory-game";
import { GameShell } from "@widgets/game-shell";
import { CelebrationDialog } from "@shared/ui";

export function MemoryPage() {
  const navigate = useNavigate();
  const scene = useMemoryStore((state) => state.scene);
  const settings = useMemoryStore((state) => state.settings);
  const moves = useMemoryStore((state) => state.moves);
  const found = useMemoryStore((state) => state.found);
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !scene;

  const startGame = () => {
    useMemoryStore.getState().start(createMemoryScene(settings.difficulty));
    setShowSetup(false);
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={scene ? () => setShowSetup(true) : undefined}
      subtitle={scene ? `${scene.pairs} paren · Generatie 1` : "Kies je spel"}
      title="Pokémon Memory"
    >
      {setupVisible ? (
        <div className="mx-auto w-full max-w-xl">
          <MemorySetup
            hasActiveGame={Boolean(scene)}
            settings={settings}
            onBack={() => setShowSetup(false)}
            onDifficultyChange={(difficulty) =>
              useMemoryStore.getState().chooseDifficulty(difficulty)
            }
            onStart={startGame}
          />
        </div>
      ) : (
        <MemoryPlay />
      )}

      {found && !setupVisible ? (
        <CelebrationDialog
          description={
            moves === scene?.pairs
              ? "Foutloos! Je vond elk Pokémon-paar meteen."
              : `Je deed er ${moves} zetten over.`
          }
          title="Alle Pokémon gevonden!"
          onAgain={() => useMemoryStore.getState().newGame()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
