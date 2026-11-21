import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { GameShell } from "@widgets/game-shell";
import { SetupPanel, SudokuPlay, useSudokuStore } from "@features/sudoku-game";
import { CelebrationDialog } from "@shared/ui";
import { useTexts } from "@shared/i18n";
import { useGameSetupNavigation } from "@shared/lib";
import { sudokuPageTexts } from "./texts";

export function SudokuPage() {
  const navigate = useNavigate();
  const t = useTexts(sudokuPageTexts);
  const play = useSudokuStore((state) => state.play);
  const settings = useSudokuStore((state) => state.settings);
  const [showSetup, setShowSetup] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const setupVisible = showSetup || !play;
  const gameSetup = useGameSetupNavigation({
    setupVisible,
    hasActiveGame: Boolean(play),
    backToGameLabel: t.backToGame,
    onCloseSetup: () => setShowSetup(false),
    onOpenSetup: () => setShowSetup(true),
  });

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
      {...gameSetup}
      showSpeech={false}
      subtitle={
        play
          ? `${play.puzzle.size} × ${play.puzzle.size} · ${t.difficulty[play.puzzle.difficulty]}`
          : t.chooseSubtitle
      }
      title="Sudoku"
    >
      {setupVisible ? (
        <div className="mx-auto w-full max-w-xl">
          <SetupPanel
            isGenerating={isGenerating}
            settings={settings}
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
          description={t.solvedDescription}
          title={t.solvedTitle}
          onAgain={() => useSudokuStore.getState().newPuzzle()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
