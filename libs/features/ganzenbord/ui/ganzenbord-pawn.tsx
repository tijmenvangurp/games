import type { PlayerState } from "@entities/ganzenbord";
import { cn } from "@shared/lib";
import { playerColorClass, playerName, positionText } from "../model/presentation";
import { GooseMark } from "./goose-mark";

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
      className={cn(
        "ganzenbord-pawn relative grid place-items-center rounded-full border-2 border-white/90",
        playerColorClass(player.id),
        active && "ring-2 ring-foreground/55 ring-offset-1 ring-offset-white/70",
        compact ? "size-4 sm:size-6" : "size-5 sm:size-8",
        className,
      )}
      title={`${playerName(player)}: ${positionText(player)}`}
    >
      <GooseMark className="size-[64%] text-white drop-shadow-sm" />
      <span className="absolute -right-1 -bottom-1 grid size-3 place-items-center rounded-full bg-white text-[8px] font-black leading-none text-foreground shadow-sm sm:size-3.5 sm:text-[9px]">
        {playerName(player).replace(/\D/g, "").slice(-1)}
      </span>
    </span>
  );
}
