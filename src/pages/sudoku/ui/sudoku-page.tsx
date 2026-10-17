import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@widgets/page-header";
import { SetupPanel, SudokuPlay, useSudokuStore, WinDialog } from "@features/sudoku-game";
import { Button, Plus } from "@shared/ui";

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
    <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-4 px-3 pb-safe pt-safe sm:px-4">
      <PageHeader
        actions={
          play ? (
            <Button
              aria-label="Nieuw spel"
              size="icon"
              variant="outline"
              onClick={() => setShowSetup(true)}
            >
              <Plus aria-hidden="true" className="size-5" />
            </Button>
          ) : null
        }
        onBack={() => navigate({ to: "/" })}
        subtitle={
          play
            ? `${play.puzzle.size} × ${play.puzzle.size} · ${play.puzzle.difficulty}`
            : "Kies je puzzel"
        }
        title="Sudoku"
      />

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
            onSizeChange={(size) => useSudokuStore.getState().chooseSize(size)}
            onStart={startGame}
            onThemeChange={(theme) => useSudokuStore.getState().chooseTheme(theme)}
          />
        </div>
      ) : (
        <SudokuPlay />
      )}

      {play?.solved && !setupVisible ? (
        <WinDialog
          onAgain={() => useSudokuStore.getState().newPuzzle()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </div>
  );
}
