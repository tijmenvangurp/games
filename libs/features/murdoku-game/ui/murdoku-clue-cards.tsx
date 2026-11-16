import { Fragment, useMemo } from "react";
import type { PersonId, Puzzle } from "@entities/murdoku";
import { cn } from "@shared/lib";
import { suspectColor } from "../lib/palette";
import { clueWords, sameClueFocus, type MurdokuClueFocus } from "../lib/clue-words";
import { createMurdokuText } from "../lib/text";
import { avatarDataUri } from "../lib/vendored/avatar";

/** Een woord uit de zin als begin van de melding: "de keuken" → "De keuken". */
function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface MurdokuClueCardsProps {
  puzzle: Puzzle;
  /** De gekozen persoon; zijn kaart licht op. */
  selectedId?: PersonId | null;
  /**
   * Een tik op de naam kiest die persoon (of heft de keuze op). De tweede
   * parameter is `true` als de browser de klik bij Enter of Spatie maakte.
   */
  onSelect?: (person: PersonId, fromKeyboard: boolean) => void;
  /** Het woord dat nu op het bord oplicht. */
  activeWord?: MurdokuClueFocus | null;
  /** Een tik op een woord in de aanwijzing laat dat op het bord oplichten. */
  onFocusWord?: (focus: MurdokuClueFocus, label: string) => void;
  className?: string;
}

/**
 * De personenkaarten van een zaak: portret, naam en per aanwijzing één
 * volledige Nederlandse zin. De zinnen komen uit dezelfde tekstlaag als het
 * bord en de hints, en zijn echte tekst — geen afbeelding.
 *
 * De naam is een knop: een kind kiest de persoon en tikt daarna op een vakje.
 * Woorden in de aanwijzing zijn eigen knoppen; een tik daarop laat het object,
 * de kamer, de persoon of de rij op het bord oplichten. Zo blijft de zin
 * leesbaar en is elk genoemd ding aanwijsbaar.
 */
export function MurdokuClueCards({
  puzzle,
  selectedId = null,
  onSelect,
  activeWord = null,
  onFocusWord,
  className,
}: MurdokuClueCardsProps) {
  const text = useMemo(() => createMurdokuText(puzzle), [puzzle]);

  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4", className)}>
      {puzzle.suspects.map((suspect, index) => {
        const selected = selectedId === suspect.id;

        return (
          <li key={suspect.id} className="min-w-0">
            <div
              className={cn(
                "game-panel flex h-full w-full min-w-0 flex-col gap-2.5 p-3 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                  : "hover:bg-muted/60",
              )}
            >
              <button
                aria-pressed={selected}
                className="flex min-h-11 min-w-0 items-center gap-2 rounded-md text-left focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:outline-none"
                type="button"
                onClick={onSelect ? (event) => onSelect(suspect.id, event.detail === 0) : undefined}
              >
                <img
                  alt=""
                  aria-hidden="true"
                  className="size-11 shrink-0 rounded-full border border-border bg-muted"
                  height={44}
                  src={avatarDataUri(suspect.attributes, suspectColor(index), suspect.id)}
                  width={44}
                />
                <span className="min-w-0 font-display text-lg leading-tight">{suspect.name}</span>
              </button>
              <span className="flex flex-col gap-1.5">
                {suspect.clues.map((clue, clueIndex) => (
                  <span
                    key={`${suspect.id}-${clueIndex}`}
                    className="text-sm leading-snug text-foreground/90"
                  >
                    {clueWords(puzzle, clue, suspect.id, text).map((word, wordIndex) =>
                      word.focus ? (
                        <button
                          key={`${suspect.id}-${clueIndex}-${wordIndex}`}
                          aria-label={`Toon ${word.text} op het bord`}
                          aria-pressed={sameClueFocus(activeWord, word.focus)}
                          className={cn(
                            "relative -my-1 inline touch-manipulation rounded-sm px-0.5 py-1 underline decoration-dotted decoration-2 underline-offset-2 transition-colors before:absolute before:-inset-x-2 before:-inset-y-2.5 before:content-[''] focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:outline-none",
                            sameClueFocus(activeWord, word.focus)
                              ? "bg-warning/20 text-foreground"
                              : "decoration-primary/60 text-primary hover:bg-primary/10",
                          )}
                          type="button"
                          onClick={
                            onFocusWord
                              ? () => onFocusWord(word.focus!, capitalise(word.text))
                              : undefined
                          }
                        >
                          {word.text}
                        </button>
                      ) : (
                        <Fragment key={`${suspect.id}-${clueIndex}-${wordIndex}`}>
                          {word.text}
                        </Fragment>
                      ),
                    )}
                  </span>
                ))}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
