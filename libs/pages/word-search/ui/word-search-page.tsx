import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { WordSearchPlay, WordSearchSetup, useWordSearchStore } from "@features/word-search";
import { useLanguage, useTexts } from "@shared/i18n";
import { CelebrationDialog } from "@shared/ui";
import { useGameSetupNavigation } from "@shared/lib";
import { GameShell } from "@widgets/game-shell";
import { wordSearchPageTexts } from "./texts";

const EMPTY_FOUND: readonly string[] = [];

export function WordSearchPage() {
  const navigate = useNavigate();
  const language = useLanguage();
  const t = useTexts(wordSearchPageTexts);
  const puzzle = useWordSearchStore((state) => (state.language === language ? state.puzzle : null));
  const found = useWordSearchStore((state) =>
    state.language === language ? state.found : EMPTY_FOUND,
  );
  const settings = useWordSearchStore((state) => state.settings);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    useWordSearchStore.getState().resetForLanguage(language);
  }, [language]);

  const setupVisible = showSetup || !puzzle;
  const gameSetup = useGameSetupNavigation({
    setupVisible,
    hasActiveGame: Boolean(puzzle),
    backToGameLabel: t.backToGame,
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
          ? `${t.difficulties[puzzle.difficulty]} · ${puzzle.size} × ${puzzle.size} · ${t.themes[puzzle.theme]}`
          : t.chooseTheme
      }
      title={t.title}
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
          description={t.doneDescription(puzzle.placements.length)}
          title={t.doneTitle}
          onAgain={() => useWordSearchStore.getState().newPuzzle()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
