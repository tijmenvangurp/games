import type { PieceSymbol } from "chess.js";
import { useTexts } from "@shared/i18n";
import { Button, Dialog } from "@shared/ui";
import { chessGameTexts } from "./texts";

const OPTIONS: readonly { piece: "q" | "r" | "b" | "n"; glyph: string }[] = [
  { piece: "q", glyph: "♛" },
  { piece: "r", glyph: "♜" },
  { piece: "b", glyph: "♝" },
  { piece: "n", glyph: "♞" },
];

interface PromotionPickerProps {
  readonly onChoose: (piece: PieceSymbol) => void;
  readonly onCancel: () => void;
}

export function PromotionPicker({ onChoose, onCancel }: PromotionPickerProps) {
  const t = useTexts(chessGameTexts);

  return (
    <Dialog className="text-center" labelledBy="promotion-title" size="xs" onClose={onCancel}>
      <h2 className="font-display text-2xl tracking-tight" id="promotion-title">
        {t.promotionTitle}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.promotionText}</p>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.piece}
            aria-label={t.pieces[option.piece]}
            className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card text-3xl leading-none transition hover:border-border-strong hover:bg-background-subtle active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
            type="button"
            onClick={() => onChoose(option.piece)}
          >
            <span aria-hidden="true">{option.glyph}</span>
            <span className="text-xs font-bold text-muted-foreground">
              {t.pieces[option.piece]}
            </span>
          </button>
        ))}
      </div>
      <Button className="mt-3 w-full" variant="ghost" onClick={onCancel}>
        {t.cancel}
      </Button>
    </Dialog>
  );
}
