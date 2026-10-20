import type { Color, PieceSymbol } from "chess.js";
import type { ChessPlayer } from "@entities/chess";
import { cn } from "@shared/lib";

const PIECE_GLYPHS: Record<PieceSymbol, string> = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
  k: "♚",
};

interface PlayerCardProps {
  readonly player: ChessPlayer;
  readonly color: Color;
  readonly active: boolean;
  readonly thinking: boolean;
  readonly captured: readonly PieceSymbol[];
}

export function PlayerCard({ player, color, active, thinking, captured }: PlayerCardProps) {
  const label = color === "w" ? "Wit" : "Zwart";
  const name = player.name.trim() || label;

  return (
    <section
      aria-label={`${name}, speelt met ${label.toLowerCase()}${active ? ", is aan zet" : ""}`}
      className={cn(
        "relative flex min-w-0 flex-1 items-center gap-2 rounded-2xl border-2 bg-card px-2.5 py-2 transition-all sm:px-3",
        active ? "border-primary shadow-sm ring-4 ring-primary/20" : "border-border opacity-80",
      )}
      data-active={active}
      data-player={color}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full text-2xl sm:size-11",
          active ? "bg-primary/10" : "bg-muted",
        )}
      >
        {player.avatar}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-black leading-tight">{name}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        {captured.length > 0 ? (
          <p aria-hidden="true" className="truncate text-sm leading-none text-slate-500">
            {captured.map((piece) => PIECE_GLYPHS[piece]).join("")}
          </p>
        ) : null}
      </div>
      {active ? (
        <span className="absolute -top-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-primary-foreground shadow-sm">
          {thinking ? "Denkt…" : "Aan zet"}
        </span>
      ) : null}
    </section>
  );
}
