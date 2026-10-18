import { Button, RotateCcw, Sparkles } from "@shared/ui";

interface FrenchQuizFinishedProps {
  correctCount: number;
  total: number;
  onRestart: () => void;
}

export function FrenchQuizFinished({ correctCount, total, onRestart }: FrenchQuizFinishedProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-3xl border bg-card p-6 text-center shadow-sm">
      <Sparkles aria-hidden="true" className="size-10 text-amber-500" />
      <h2 className="text-2xl font-black">Klaar!</h2>
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
