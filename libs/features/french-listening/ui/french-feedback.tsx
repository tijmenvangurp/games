import type { FrenchItem } from "@entities/french";
import { Button, Panel, Volume2 } from "@shared/ui";
import { useTexts } from "@shared/i18n";
import { frenchTexts } from "./texts";

interface FrenchFeedbackProps {
  item: FrenchItem;
  correct: boolean;
  praise: string;
  onNext: () => void;
  onPlayExample: () => void;
}

export function FrenchFeedback({
  item,
  correct,
  praise,
  onNext,
  onPlayExample,
}: FrenchFeedbackProps) {
  const t = useTexts(frenchTexts);
  return (
    <Panel aria-live="polite" className="space-y-3" padding="md">
      <p className={correct ? "font-bold text-success-ink" : "font-bold text-warning-ink"}>
        {correct ? praise : t.notYet}
      </p>
      {!correct ? (
        <p className="text-sm text-muted-foreground">
          {t.rightAnswer}
          <strong>{item.nl}</strong>.
        </p>
      ) : null}
      <Panel padding="sm" surface="subtle">
        <p className="text-xl font-black">
          {item.emoji ? <span aria-hidden="true">{item.emoji} </span> : null}
          {item.fr}
        </p>
        <p className="text-sm font-semibold text-muted-foreground">{item.nl}</p>
        {item.note ? <p className="mt-1 text-xs text-muted-foreground">{item.note}</p> : null}
      </Panel>
      {item.example ? (
        <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary-soft p-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground">{t.example}</p>
            <p className="text-sm font-semibold">{item.example.fr}</p>
            <p className="text-xs text-muted-foreground">{item.example.nl}</p>
          </div>
          <Button aria-label={t.playExample} size="icon" variant="outline" onClick={onPlayExample}>
            <Volume2 aria-hidden="true" className="size-5" />
          </Button>
        </div>
      ) : null}
      <Button className="w-full" size="lg" onClick={onNext}>
        {t.next}
      </Button>
    </Panel>
  );
}
