import type { PieceSymbol } from "chess.js";
import { Button } from "@shared/ui";

const OPTIONS: readonly { piece: PieceSymbol; label: string; glyph: string }[] = [
  { piece: "q", label: "Dame", glyph: "♛" },
  { piece: "r", label: "Toren", glyph: "♜" },
  { piece: "b", label: "Loper", glyph: "♝" },
  { piece: "n", label: "Paard", glyph: "♞" },
];

interface PromotionPickerProps {
  readonly onChoose: (piece: PieceSymbol) => void;
  readonly onCancel: () => void;
}

export function PromotionPicker({ onChoose, onCancel }: PromotionPickerProps) {
  return (
    <div
      aria-labelledby="promotion-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="animate-pop w-full max-w-xs rounded-3xl border bg-card p-5 text-center shadow-xl">
        <h2 className="text-xl font-black" id="promotion-title">
          Kies een stuk
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Je pion is aan de overkant. Wat wordt het?
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {OPTIONS.map((option) => (
            <button
              key={option.piece}
              aria-label={option.label}
              className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-border bg-card text-3xl leading-none transition hover:bg-muted active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
              type="button"
              onClick={() => onChoose(option.piece)}
            >
              <span aria-hidden="true">{option.glyph}</span>
              <span className="text-xs font-bold text-muted-foreground">{option.label}</span>
            </button>
          ))}
        </div>
        <Button className="mt-3 w-full" variant="ghost" onClick={onCancel}>
          Annuleren
        </Button>
      </div>
    </div>
  );
}
