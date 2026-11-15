import type { PlayerState } from "@entities/ganzenbord";
import { cn } from "@shared/lib";
import { playerName, playerNumber, positionText } from "../model/presentation";
import { PlayerToken } from "./player-token";

interface GanzenbordPawnProps {
  player: PlayerState;
  active?: boolean;
  compact?: boolean;
  className?: string;
}

export function GanzenbordPawn({
  player,
  active = false,
  compact = false,
  className,
}: GanzenbordPawnProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative inline-flex", className)}
      title={`${playerName(player)}: ${positionText(player)}`}
    >
      <PlayerToken
        className={cn(
          "ganzenbord-pawn",
          active && "ring-2 ring-foreground/55 ring-offset-1 ring-offset-white/70",
          compact ? "size-4 sm:size-6" : "size-5 sm:size-8",
        )}
        color={player.color}
      />
      <span className="absolute -right-1 -bottom-1 grid size-3 place-items-center rounded-full bg-white text-[8px] font-black leading-none text-foreground shadow-sm sm:size-3.5 sm:text-[9px]">
        {playerNumber(player.id)}
      </span>
    </span>
  );
}
