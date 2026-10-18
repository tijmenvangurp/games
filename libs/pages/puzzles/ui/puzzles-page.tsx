import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PUZZLES, PuzzlePlay } from "@features/chess-puzzles";
import { GameShell } from "@widgets/game-shell";

export function PuzzlesPage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const puzzle = PUZZLES[index];

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      subtitle="Schaakmat of een stuk winnen"
      title="Schaakpuzzels"
    >
      <PuzzlePlay
        key={puzzle.id}
        index={index}
        puzzle={puzzle}
        total={PUZZLES.length}
        onNext={() => setIndex((current) => (current + 1) % PUZZLES.length)}
      />
    </GameShell>
  );
}
