import type { FrenchItem } from "@entities/french";
import { useTexts } from "@shared/i18n";
import { frenchTexts } from "./texts";

interface FrenchFlashcardProps {
  item: FrenchItem;
  flipped: boolean;
  onFlip: () => void;
}

export function FrenchFlashcard({ item, flipped, onFlip }: FrenchFlashcardProps) {
  const t = useTexts(frenchTexts);
  return (
    <div className="french-card" data-flipped={flipped}>
      <button
        aria-label={flipped ? t.backLabel(item.nl) : t.frontLabel(item.fr)}
        aria-pressed={flipped}
        className="french-card-inner focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        type="button"
        onClick={onFlip}
      >
        <span className="french-card-face border bg-card">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t.french}
          </span>
          <span className="text-4xl font-black leading-tight">{item.fr}</span>
          <span className="text-sm font-semibold text-muted-foreground">{t.tapToFlip}</span>
        </span>
        <span className="french-card-face french-card-face--back border bg-card">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t.translation}
          </span>
          <span className="text-3xl font-black leading-tight">{item.nl}</span>
          {item.nlAlt?.length ? (
            <span className="text-sm text-muted-foreground">{t.also(item.nlAlt.join(", "))}</span>
          ) : null}
          {item.note ? <span className="text-xs text-muted-foreground">{item.note}</span> : null}
          {item.example ? (
            <span className="mt-1 rounded-lg bg-primary/5 px-3 py-2 text-sm">
              <span className="block font-semibold">{item.example.fr}</span>
              <span className="block text-xs text-muted-foreground">{item.example.nl}</span>
            </span>
          ) : null}
        </span>
      </button>
    </div>
  );
}
