import { useNavigate } from "@tanstack/react-router";
import { createSeekScene } from "@entities/hidden-object";
import { SeekPlay, SeekSetup, useSeekStore } from "@features/seek-and-find";
import { GameShell } from "@widgets/game-shell";
import { CelebrationDialog } from "@shared/ui";
import { useTexts } from "@shared/i18n";
import { useGameSetupState } from "@shared/lib";
import { seekPageTexts } from "./texts";

export function SeekPage() {
  const navigate = useNavigate();
  const t = useTexts(seekPageTexts);
  const scene = useSeekStore((state) => state.scene);
  const settings = useSeekStore((state) => state.settings);
  const tries = useSeekStore((state) => state.tries);
  const found = useSeekStore((state) => state.found);
  const {
    setShowSetup,
    setupVisible,
    navigation: gameSetup,
  } = useGameSetupState(Boolean(scene), t.backToGame);

  const startGame = () => {
    useSeekStore.getState().start(createSeekScene(settings.difficulty, settings.theme));
    setShowSetup(false);
  };

  return (
    <GameShell
      {...gameSetup}
      showSpeech={false}
      subtitle={
        scene ? `${t.difficulty[scene.difficulty]} · ${t.themes[scene.theme]}` : t.chooseSubtitle
      }
      title={t.title}
    >
      {setupVisible ? (
        <div className="mx-auto w-full max-w-xl">
          <SeekSetup
            settings={settings}
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
          confetti
          description={tries === 0 ? t.foundAtOnce : t.foundAfter(tries)}
          title={t.foundTitle}
          onAgain={() => useSeekStore.getState().newScene()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
