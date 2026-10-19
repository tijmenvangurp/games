import type { LetterId } from "@entities/letter";
import { cn } from "@shared/lib";

type TileState = "default" | "correct" | "wrong" | "muted";

export type { TileState };

interface LetterTileProps {
  letter: LetterId;
  state?: TileState;
  disabled?: boolean;
  onClick?: () => void;
}

export function LetterTile({ letter, state = "default", disabled, onClick }: LetterTileProps) {
  return (
    <button
      aria-label={`Letter ${letter}`}
      className={cn(
        "flex min-h-20 min-w-0 items-center justify-center rounded-2xl border-2 text-4xl font-black transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:active:scale-100",
        state === "default" && "border-border bg-card hover:bg-muted",
        state === "correct" && "border-success bg-success/10 text-success",
        state === "wrong" && "border-danger bg-danger/10 text-danger",
        state === "muted" && "border-border bg-muted text-muted-foreground opacity-50",
        disabled && "cursor-default",
      )}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {letter}
    </button>
  );
}
