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
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-3xl border bg-card p-6 text-center shadow-sm">
      <Sparkles aria-hidden="true" className="size-10 text-amber-500" />
      <h2 className="text-2xl font-black">Alle kaarten bekeken</h2>
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
