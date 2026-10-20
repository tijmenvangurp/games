import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  PUZZLES,
  PuzzleOverview,
  PuzzlePlay,
  usePuzzleProgress,
  type PuzzleDifficulty,
} from "@features/chess-puzzles";
import { GameShell } from "@widgets/game-shell";

export function PuzzlesPage() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty>("easy");
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string | null>(null);
  const { solved, markSolved } = usePuzzleProgress();
  const puzzles = useMemo(
    () => PUZZLES.filter((puzzle) => puzzle.difficulty === difficulty),
    [difficulty],
  );
  const selectedIndex = selectedPuzzleId
    ? puzzles.findIndex((puzzle) => puzzle.id === selectedPuzzleId)
    : -1;
  const puzzle = selectedIndex >= 0 ? puzzles[selectedIndex] : null;

  const chooseDifficulty = (next: PuzzleDifficulty) => {
    setDifficulty(next);
    setSelectedPuzzleId(null);
  };

  const nextPuzzle = () => {
    if (selectedIndex < 0) {
      return;
    }

    const next = puzzles[(selectedIndex + 1) % puzzles.length];
    if (next) {
      setSelectedPuzzleId(next.id);
    }
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      subtitle="Kies je moeilijkheid"
      title="Schaakpuzzels"
    >
      {puzzle ? (
        <PuzzlePlay
          key={puzzle.id}
          difficulty={difficulty}
          index={selectedIndex}
          puzzle={puzzle}
          total={puzzles.length}
          onDifficultyChange={chooseDifficulty}
          onNext={nextPuzzle}
          onOverview={() => setSelectedPuzzleId(null)}
          onSolved={(puzzle) => markSolved(puzzle.id)}
        />
      ) : (
        <PuzzleOverview
          difficulty={difficulty}
          puzzles={puzzles}
          solved={solved}
          onDifficultyChange={chooseDifficulty}
          onSelect={setSelectedPuzzleId}
        />
      )}
    </GameShell>
  );
}
