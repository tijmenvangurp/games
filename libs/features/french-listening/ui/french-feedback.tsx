import type { FrenchItem } from "@entities/french";
import { Button } from "@shared/ui";

interface FrenchFeedbackProps {
  item: FrenchItem;
  correct: boolean;
  onNext: () => void;
}

export function FrenchFeedback({ item, correct, onNext }: FrenchFeedbackProps) {
  return (
    <div aria-live="polite" className="space-y-3 rounded-3xl border bg-card p-4 shadow-sm">
      <p className={correct ? "font-black text-emerald-700" : "font-black text-rose-700"}>
        {correct ? "Goed gedaan!" : "Bijna!"}
      </p>
      {!correct ? (
        <p className="text-sm text-muted-foreground">
          Het juiste antwoord is <strong>{item.nl}</strong>.
        </p>
      ) : null}
      <div className="rounded-2xl bg-muted/60 p-3">
        <p className="text-xl font-black">
          {item.emoji ? <span aria-hidden="true">{item.emoji} </span> : null}
          {item.fr}
        </p>
        <p className="text-sm font-semibold text-muted-foreground">{item.nl}</p>
        {item.note ? <p className="mt-1 text-xs text-muted-foreground">{item.note}</p> : null}
      </div>
      <Button className="w-full" size="lg" onClick={onNext}>
        Volgende
      </Button>
    </div>
  );
}
