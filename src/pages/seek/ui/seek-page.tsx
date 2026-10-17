import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createSeekScene } from "@entities/hidden-object";
import { SeekPlay, SeekSetup, useSeekStore } from "@features/seek-and-find";
import { GameShell } from "@widgets/game-shell";
import { CelebrationDialog } from "@shared/ui";

const THEME_LABELS = {
  tuin: "in de tuin",
  onderwater: "onder water",
} as const;

export function SeekPage() {
  const navigate = useNavigate();
  const scene = useSeekStore((state) => state.scene);
  const settings = useSeekStore((state) => state.settings);
  const tries = useSeekStore((state) => state.tries);
  const found = useSeekStore((state) => state.found);
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !scene;

  const startGame = () => {
    useSeekStore.getState().start(createSeekScene(settings.difficulty, settings.theme));
    setShowSetup(false);
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={scene ? () => setShowSetup(true) : undefined}
      subtitle={scene ? `${scene.difficulty} · ${THEME_LABELS[scene.theme]}` : "Kies je zoekveld"}
      title="Waar is Wobbel?"
    >
      {setupVisible ? (
        <div className="mx-auto w-full max-w-xl">
          <SeekSetup
            hasActiveGame={Boolean(scene)}
            settings={settings}
            onBack={() => setShowSetup(false)}
            onDifficultyChange={(difficulty) =>
              useSeekStore.getState().chooseDifficulty(difficulty)
            }
            onStart={startGame}
            onThemeChange={(theme) => useSeekStore.getState().chooseTheme(theme)}
          />
        </div>
      ) : (
        <SeekPlay />
      )}

      {found && !setupVisible ? (
        <CelebrationDialog
          description={
            tries === 0
              ? "In één keer gevonden, knap gedaan!"
              : `${tries} keer mis, maar toch gevonden!`
          }
          title="Gevonden!"
          onAgain={() => useSeekStore.getState().newScene()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
