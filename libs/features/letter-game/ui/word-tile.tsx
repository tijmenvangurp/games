import { cn } from "@shared/lib";
import type { TileState } from "./letter-tile";

interface WordTileProps {
  word: string;
  state?: TileState;
  disabled?: boolean;
  onClick?: () => void;
}

export function WordTile({ word, state = "default", disabled, onClick }: WordTileProps) {
  return (
    <button
      aria-label={`Woord ${word}`}
      className={cn(
        "flex min-h-14 w-full items-center justify-center rounded-2xl border-2 text-2xl font-black tracking-wide transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:active:scale-100",
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
      {word}
    </button>
  );
}
