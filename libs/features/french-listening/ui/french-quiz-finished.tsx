import { Button, Panel, RotateCcw, Sparkles } from "@shared/ui";

interface FrenchQuizFinishedProps {
  correctCount: number;
  total: number;
  onRestart: () => void;
}

export function FrenchQuizFinished({ correctCount, total, onRestart }: FrenchQuizFinishedProps) {
  return (
    <Panel
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 text-center"
      padding="lg"
    >
      <Sparkles aria-hidden="true" className="size-10 text-primary" />
      <h2 className="font-display text-2xl">Klaar!</h2>
      <p className="tabular-nums text-muted-foreground">
        Je had {correctCount} van {total} goed.
      </p>
      <Button size="lg" onClick={onRestart}>
        <RotateCcw aria-hidden="true" className="size-5" />
        Opnieuw
      </Button>
    </Panel>
  );
}
