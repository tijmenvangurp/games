import type { Color, PieceSymbol } from "chess.js";
import type { ChessPlayer } from "@entities/chess";
import { cn } from "@shared/lib";
import { Badge, Panel } from "@shared/ui";

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
    <Panel
      as="section"
      aria-label={`${name}, speelt met ${label.toLowerCase()}${active ? ", is aan zet" : ""}`}
      className={cn(
        "relative flex min-w-0 flex-1 items-center gap-2.5 transition-all",
        active ? "border-primary ring-2 ring-primary/20" : "opacity-80",
      )}
      data-active={active}
      data-player={color}
      padding="xs"
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full text-2xl sm:size-11",
          active ? "bg-primary-soft" : "bg-muted",
        )}
      >
        {player.avatar}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-tight">{name}</p>
        {name.toLowerCase() !== label.toLowerCase() ? (
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        ) : null}
        {captured.length > 0 ? (
          <p aria-hidden="true" className="truncate text-sm leading-none text-muted-foreground">
            {captured.map((piece) => PIECE_GLYPHS[piece]).join("")}
          </p>
        ) : null}
      </div>
      {active ? (
        <Badge className="absolute -top-2.5 right-2 shadow-xs" size="sm" tone="primarySolid">
          {thinking ? "Denkt…" : "Aan zet"}
        </Badge>
      ) : null}
    </Panel>
  );
}
