import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { WordSearchPlay, WordSearchSetup, useWordSearchStore } from "@features/word-search";
import { CelebrationDialog } from "@shared/ui";
import { useGameSetupNavigation } from "@shared/lib";
import { GameShell } from "@widgets/game-shell";

const THEME_LABELS = {
  tuin: "in de tuin",
  onderwater: "onder water",
  pokemon: "Pokémon",
} as const;

export function WordSearchPage() {
  const navigate = useNavigate();
  const puzzle = useWordSearchStore((state) => state.puzzle);
  const found = useWordSearchStore((state) => state.found);
  const settings = useWordSearchStore((state) => state.settings);
  const [showSetup, setShowSetup] = useState(false);

  const setupVisible = showSetup || !puzzle;
  const gameSetup = useGameSetupNavigation({
    setupVisible,
    hasActiveGame: Boolean(puzzle),
    backToGameLabel: "Terug naar je woordzoeker",
    onCloseSetup: () => setShowSetup(false),
    onOpenSetup: () => setShowSetup(true),
  });
  const complete =
    puzzle !== null && puzzle.placements.length > 0 && found.length === puzzle.placements.length;

  const startGame = () => {
    useWordSearchStore.getState().start();
    setShowSetup(false);
  };

  return (
    <GameShell
      {...gameSetup}
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
            settings={settings}
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
          confetti
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
