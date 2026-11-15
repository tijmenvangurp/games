import { useMemo } from "react";
import type { Puzzle } from "@entities/murdoku";
import { cn } from "@shared/lib";
import { suspectColor } from "../lib/palette";
import { createMurdokuText } from "../lib/text";
import { avatarDataUri } from "../lib/vendored/avatar";

interface MurdokuClueCardsProps {
  puzzle: Puzzle;
  className?: string;
}

/**
 * De personenkaarten van een zaak: portret, naam en per aanwijzing één
 * volledige Nederlandse zin. De zinnen komen uit dezelfde tekstlaag als het
 * bord en de latere hints, en zijn echte tekst — geen afbeelding.
 *
 * Nog geen selectie of plaatsing: dit is het leesbeeld van #120.
 */
export function MurdokuClueCards({ puzzle, className }: MurdokuClueCardsProps) {
  const text = useMemo(() => createMurdokuText(puzzle), [puzzle]);

  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4", className)}>
      {puzzle.suspects.map((suspect, index) => (
        <li key={suspect.id} className="game-panel flex min-w-0 flex-col gap-2.5 p-3">
          <div className="flex min-w-0 items-center gap-2">
            <img
              alt=""
              aria-hidden="true"
              className="size-11 shrink-0 rounded-full border border-border bg-muted"
              height={44}
              src={avatarDataUri(suspect.attributes, suspectColor(index), suspect.id)}
              width={44}
            />
            <h3 className="min-w-0 font-display text-lg leading-tight">{suspect.name}</h3>
          </div>
          <ul className="flex flex-col gap-1.5">
            {suspect.clues.map((clue, clueIndex) => (
              <li
                key={`${suspect.id}-${clueIndex}`}
                className="text-sm leading-snug text-foreground/90"
              >
                {text.clue(clue, suspect.id)}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
