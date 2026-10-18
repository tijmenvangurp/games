import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { GameShell } from "@widgets/game-shell";
import { SetupPanel, SudokuPlay, useSudokuStore } from "@features/sudoku-game";
import { CelebrationDialog } from "@shared/ui";

export function SudokuPage() {
  const navigate = useNavigate();
  const play = useSudokuStore((state) => state.play);
  const settings = useSudokuStore((state) => state.settings);
  const [showSetup, setShowSetup] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const setupVisible = showSetup || !play;

  const startGame = () => {
    setIsGenerating(true);
    window.setTimeout(() => {
      useSudokuStore.getState().newPuzzle();
      setIsGenerating(false);
      setShowSetup(false);
    }, 30);
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={play ? () => setShowSetup(true) : undefined}
      subtitle={
        play
          ? `${play.puzzle.size} × ${play.puzzle.size} · ${play.puzzle.difficulty}`
          : "Kies je puzzel"
      }
      title="Sudoku"
    >
      {setupVisible ? (
        <div className="mx-auto w-full max-w-xl">
          <SetupPanel
            hasActiveGame={Boolean(play)}
            isGenerating={isGenerating}
            settings={settings}
            onBack={() => setShowSetup(false)}
            onDifficultyChange={(difficulty) =>
              useSudokuStore.getState().chooseDifficulty(difficulty)
            }
            onMistakeModeChange={(mode) => useSudokuStore.getState().chooseMistakeMode(mode)}
            onSizeChange={(size) => useSudokuStore.getState().chooseSize(size)}
            onStart={startGame}
            onThemeChange={(theme) => useSudokuStore.getState().chooseTheme(theme)}
          />
        </div>
      ) : (
        <SudokuPlay />
      )}

      {play?.solved && !setupVisible ? (
        <CelebrationDialog
          confetti
          description="Je hebt de sudoku helemaal opgelost."
          title="Goed gedaan!"
          onAgain={() => useSudokuStore.getState().newPuzzle()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
