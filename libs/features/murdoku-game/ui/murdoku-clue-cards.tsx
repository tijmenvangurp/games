import { useMemo } from "react";
import type { PersonId, Puzzle } from "@entities/murdoku";
import { cn } from "@shared/lib";
import { suspectColor } from "../lib/palette";
import { createMurdokuText } from "../lib/text";
import { avatarDataUri } from "../lib/vendored/avatar";

interface MurdokuClueCardsProps {
  puzzle: Puzzle;
  /** De gekozen persoon; zijn kaart licht op. */
  selectedId?: PersonId | null;
  /** Een tik op een kaart kiest die persoon (of heft de keuze op). */
  onSelect?: (person: PersonId) => void;
  className?: string;
}

/**
 * De personenkaarten van een zaak: portret, naam en per aanwijzing één
 * volledige Nederlandse zin. De zinnen komen uit dezelfde tekstlaag als het
 * bord en de latere hints, en zijn echte tekst — geen afbeelding.
 *
 * De hele kaart is één knop: een kind tikt op de persoon en daarna op een
 * vakje. De aanwijzing blijft binnen de knop leesbare tekst, zodat een
 * schermlezer hem bij het focussen meeleest.
 */
export function MurdokuClueCards({
  puzzle,
  selectedId = null,
  onSelect,
  className,
}: MurdokuClueCardsProps) {
  const text = useMemo(() => createMurdokuText(puzzle), [puzzle]);

  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4", className)}>
      {puzzle.suspects.map((suspect, index) => {
        const selected = selectedId === suspect.id;
        const clueText = suspect.clues.map((clue) => text.clue(clue, suspect.id)).join(" ");

        return (
          <li key={suspect.id} className="min-w-0">
            <button
              aria-label={`${suspect.name}. ${clueText}`}
              aria-pressed={selected}
              className={cn(
                "game-panel flex h-full w-full min-w-0 flex-col gap-2.5 p-3 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                  : "hover:bg-muted/60",
              )}
              type="button"
              onClick={onSelect ? () => onSelect(suspect.id) : undefined}
            >
              <span className="flex min-w-0 items-center gap-2">
                <img
                  alt=""
                  aria-hidden="true"
                  className="size-11 shrink-0 rounded-full border border-border bg-muted"
                  height={44}
                  src={avatarDataUri(suspect.attributes, suspectColor(index), suspect.id)}
                  width={44}
                />
                <span className="min-w-0 font-display text-lg leading-tight">{suspect.name}</span>
              </span>
              <span className="flex flex-col gap-1.5">
                {suspect.clues.map((clue, clueIndex) => (
                  <span
                    key={`${suspect.id}-${clueIndex}`}
                    className="text-sm leading-snug text-foreground/90"
                  >
                    {text.clue(clue, suspect.id)}
                  </span>
                ))}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
