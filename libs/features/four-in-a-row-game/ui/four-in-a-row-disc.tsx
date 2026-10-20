import type { Player } from "@entities/four-in-a-row";
import { cn } from "@shared/lib";

interface FourInARowDiscProps {
  /** Wie er in dit vakje ligt; `null` betekent leeg. */
  player: Player | null;
  /** Een doorschijnende schijf ter voorbeeld als dit vakje leeg is. */
  ghost?: Player | null;
  /** Onderdeel van de winnende rij van vier. */
  highlighted?: boolean;
  /** De schijf die net gevallen is. */
  latest?: boolean;
}

export function FourInARowDisc({
  player,
  ghost = null,
  highlighted = false,
  latest = false,
}: FourInARowDiscProps) {
  const shown = player ?? ghost;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "block aspect-square w-full rounded-full border transition",
        "border-border bg-background",
        shown === "one" && "border-player-one bg-player-one",
        shown === "two" && "border-player-two bg-player-two",
        player === null && shown ? "opacity-40" : null,
        latest && "animate-pop",
        highlighted && "ring-2 ring-foreground/60 ring-offset-2 ring-offset-muted",
      )}
    />
  );
}
