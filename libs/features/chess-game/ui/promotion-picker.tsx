import type { PieceSymbol } from "chess.js";
import { Button, Dialog } from "@shared/ui";

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
    <Dialog className="text-center" labelledBy="promotion-title" size="xs" onClose={onCancel}>
      <h2 className="font-display text-2xl tracking-tight" id="promotion-title">
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
            className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card text-3xl leading-none transition hover:border-border-strong hover:bg-background-subtle active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
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
    </Dialog>
  );
}
