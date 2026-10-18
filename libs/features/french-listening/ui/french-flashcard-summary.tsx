import { Button, RotateCcw, Sparkles } from "@shared/ui";

interface FrenchFlashcardSummaryProps {
  known: number;
  practice: number;
  onRestart: () => void;
}

export function FrenchFlashcardSummary({
  known,
  practice,
  onRestart,
}: FrenchFlashcardSummaryProps) {
  return (
    <div className="game-panel mx-auto flex w-full max-w-xl flex-col items-center gap-4 p-6 text-center">
      <Sparkles aria-hidden="true" className="size-10 text-primary" />
      <h2 className="font-display text-2xl">Alle kaarten bekeken</h2>
      <p className="text-muted-foreground">
        {known} ken je al, {practice} wil je nog oefenen.
      </p>
      <Button size="lg" onClick={onRestart}>
        <RotateCcw aria-hidden="true" className="size-5" />
        Opnieuw
      </Button>
    </div>
  );
}
