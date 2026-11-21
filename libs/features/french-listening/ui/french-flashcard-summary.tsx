import { Button, Panel, RotateCcw, Sparkles } from "@shared/ui";
import { useTexts } from "@shared/i18n";
import { frenchTexts } from "./texts";

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
  const t = useTexts(frenchTexts);
  return (
    <Panel
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 text-center"
      padding="lg"
    >
      <Sparkles aria-hidden="true" className="size-10 text-primary" />
      <h2 className="font-display text-2xl">{t.allCards}</h2>
      <p className="tabular-nums text-muted-foreground">{t.cardsSummary(known, practice)}</p>
      <Button size="lg" onClick={onRestart}>
        <RotateCcw aria-hidden="true" className="size-5" />
        {t.again}
      </Button>
    </Panel>
  );
}
