import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { WordSearchPlay, WordSearchSetup, useWordSearchStore } from "@features/word-search";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

const THEME_LABELS = {
  tuin: "in de tuin",
  onderwater: "onder water",
} as const;

export function WordSearchPage() {
  const navigate = useNavigate();
  const puzzle = useWordSearchStore((state) => state.puzzle);
  const found = useWordSearchStore((state) => state.found);
  const settings = useWordSearchStore((state) => state.settings);
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !puzzle;
  const complete =
    puzzle !== null && puzzle.placements.length > 0 && found.length === puzzle.placements.length;

  const startGame = () => {
    useWordSearchStore.getState().start();
    setShowSetup(false);
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      onNewGame={puzzle ? () => setShowSetup(true) : undefined}
      subtitle={
        puzzle
          ? `${puzzle.difficulty} · ${puzzle.size} × ${puzzle.size} · ${THEME_LABELS[puzzle.theme]}`
          : "Kies je thema"
      }
      title="Woordzoeker"
    >
      {setupVisible ? (
        <div className="mx-auto w-full max-w-xl">
          <WordSearchSetup
            hasActiveGame={Boolean(puzzle)}
            settings={settings}
            onBack={() => setShowSetup(false)}
            onDifficultyChange={(difficulty) =>
              useWordSearchStore.getState().chooseDifficulty(difficulty)
            }
            onStart={startGame}
            onThemeChange={(theme) => useWordSearchStore.getState().chooseTheme(theme)}
          />
        </div>
      ) : (
        <WordSearchPlay />
      )}

      {complete && !setupVisible ? (
        <CelebrationDialog
          description={`Je vond alle ${puzzle.placements.length} woorden.`}
          title="Knap gedaan!"
          onAgain={() => useWordSearchStore.getState().newPuzzle()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
