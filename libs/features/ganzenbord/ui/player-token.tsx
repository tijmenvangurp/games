import type { PlayerColor } from "@entities/ganzenbord";
import { cn } from "@shared/lib";
import { playerColorClass } from "../model/presentation";
import { GooseMark } from "./goose-mark";

interface PlayerTokenProps {
  color: PlayerColor;
  /** Maat en extra staat, bijvoorbeeld `size-5` of een actieve ring. */
  className?: string;
}

/**
 * Dezelfde ronde token met ganzensilhouet als op het bord, zodat de
 * kleurkeuze in de setup meteen laat zien hoe de pion eruit komt te zien.
 */
export function PlayerToken({ color, className }: PlayerTokenProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full border-2 border-white/90",
        playerColorClass(color),
        className,
      )}
    >
      <GooseMark className="size-[62%] text-white drop-shadow-sm" />
    </span>
  );
}
