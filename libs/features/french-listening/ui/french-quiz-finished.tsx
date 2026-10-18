import { Button, RotateCcw, Sparkles } from "@shared/ui";

interface FrenchQuizFinishedProps {
  correctCount: number;
  total: number;
  onRestart: () => void;
}

export function FrenchQuizFinished({ correctCount, total, onRestart }: FrenchQuizFinishedProps) {
  return (
    <div className="game-panel mx-auto flex w-full max-w-xl flex-col items-center gap-4 p-6 text-center">
      <Sparkles aria-hidden="true" className="size-10 text-primary" />
      <h2 className="font-display text-2xl">Klaar!</h2>
      <p className="text-muted-foreground">
        Je had {correctCount} van {total} goed.
      </p>
      <Button size="lg" onClick={onRestart}>
        <RotateCcw aria-hidden="true" className="size-5" />
        Opnieuw
      </Button>
    </div>
  );
}
