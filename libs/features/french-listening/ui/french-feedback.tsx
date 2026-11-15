import type { FrenchItem } from "@entities/french";
import { Button, Volume2 } from "@shared/ui";

interface FrenchFeedbackProps {
  item: FrenchItem;
  correct: boolean;
  onNext: () => void;
  onPlayExample: () => void;
}

export function FrenchFeedback({ item, correct, onNext, onPlayExample }: FrenchFeedbackProps) {
  return (
    <div aria-live="polite" className="game-panel space-y-3 p-4">
      <p className={correct ? "font-black text-success" : "font-black text-warning"}>
        {correct ? "Je vond het!" : "Nog niet."}
      </p>
      {!correct ? (
        <p className="text-sm text-muted-foreground">
          Het juiste antwoord is <strong>{item.nl}</strong>.
        </p>
      ) : null}
      <div className="rounded-lg bg-muted/60 p-3">
        <p className="text-xl font-black">
          {item.emoji ? <span aria-hidden="true">{item.emoji} </span> : null}
          {item.fr}
        </p>
        <p className="text-sm font-semibold text-muted-foreground">{item.nl}</p>
        {item.note ? <p className="mt-1 text-xs text-muted-foreground">{item.note}</p> : null}
      </div>
      {item.example ? (
        <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Voorbeeldzin
            </p>
            <p className="text-sm font-semibold">{item.example.fr}</p>
            <p className="text-xs text-muted-foreground">{item.example.nl}</p>
          </div>
          <Button
            aria-label="Beluister de voorbeeldzin"
            size="icon"
            variant="outline"
            onClick={onPlayExample}
          >
            <Volume2 aria-hidden="true" className="size-5" />
          </Button>
        </div>
      ) : null}
      <Button className="w-full" size="lg" onClick={onNext}>
        Volgende
      </Button>
    </div>
  );
}
