import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PUZZLES, PuzzlePlay, type PuzzleDifficulty } from "@features/chess-puzzles";
import { GameShell } from "@widgets/game-shell";

export function PuzzlesPage() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty>("easy");
  const [index, setIndex] = useState(0);
  const puzzles = useMemo(
    () => PUZZLES.filter((puzzle) => puzzle.difficulty === difficulty),
    [difficulty],
  );
  const puzzle = puzzles[index];

  const chooseDifficulty = (next: PuzzleDifficulty) => {
    setDifficulty(next);
    setIndex(0);
  };

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      subtitle="Schaakmat of een stuk winnen"
      title="Schaakpuzzels"
    >
      <PuzzlePlay
        key={puzzle.id}
        difficulty={difficulty}
        index={index}
        puzzle={puzzle}
        total={puzzles.length}
        onDifficultyChange={chooseDifficulty}
        onNext={() => setIndex((current) => (current + 1) % puzzles.length)}
      />
    </GameShell>
  );
}
