import type { PointerEvent as ReactPointerEvent } from "react";
import { subjectName, type FlagSubject, type PuzzlePiece } from "@entities/geography";
import { useLanguage, useTexts } from "@shared/i18n";
import { cn } from "@shared/lib";
import { Check, Panel } from "@shared/ui";
import { flagTexts } from "../model/texts";

export function PieceShape({ piece }: { piece: PuzzlePiece | undefined }) {
  if (!piece) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className="h-full w-full text-primary"
      viewBox={`0 0 ${piece.width} ${piece.height}`}
    >
      <path d={piece.path} fill="currentColor" stroke="currentColor" strokeWidth={0.6} />
    </svg>
  );
}

interface PuzzleTrayProps {
  pieces: ReadonlyMap<string, PuzzlePiece>;
  subjects: readonly FlagSubject[];
  placed: ReadonlySet<string>;
  selected: string | null;
  onGrab: (event: ReactPointerEvent, code: string) => void;
  onKeyboardSelect: (code: string) => void;
}

/** The eight pieces; placed pieces stay visible as a faded check. */
export function PuzzleTray({
  pieces,
  subjects,
  placed,
  selected,
  onGrab,
  onKeyboardSelect,
}: PuzzleTrayProps) {
  const language = useLanguage();
  const t = useTexts(flagTexts);

  return (
    <Panel as="section" padding="sm">
      <p className="sr-only">{t.pieces}</p>
      <div className="grid grid-cols-4 gap-2">
        {subjects.map((country) => {
          const isPlaced = placed.has(country.code);
          const isSelected = selected === country.code;

          return (
            <button
              key={country.code}
              aria-label={t.piece(subjectName(country, language))}
              aria-pressed={isSelected}
              className={cn(
                "relative flex aspect-square touch-none items-center justify-center rounded-xl border bg-card p-1 transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                isSelected
                  ? "border-primary bg-primary-soft ring-2 ring-primary/25"
                  : "border-border hover:border-border-strong hover:bg-background-subtle",
                isPlaced && "opacity-35",
              )}
              disabled={isPlaced}
              type="button"
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onKeyboardSelect(country.code);
                }
              }}
              onPointerDown={(event) => {
                if (!isPlaced) {
                  onGrab(event, country.code);
                }
              }}
            >
              <PieceShape piece={pieces.get(country.code)} />
              {isPlaced ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 grid place-items-center text-success-ink"
                >
                  <Check className="size-6" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
