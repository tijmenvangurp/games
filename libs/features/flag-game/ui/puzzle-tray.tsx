import type { PointerEvent as ReactPointerEvent } from "react";
import type { PuzzlePiece } from "@entities/geography";
import { cn } from "@shared/lib";

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
  questions: readonly { country: { code: string; name: string } }[];
  placed: ReadonlySet<string>;
  selected: string | null;
  onGrab: (event: ReactPointerEvent, code: string) => void;
  onKeyboardSelect: (code: string) => void;
}

/** The eight pieces; placed pieces stay visible as a faded check. */
export function PuzzleTray({
  pieces,
  questions,
  placed,
  selected,
  onGrab,
  onKeyboardSelect,
}: PuzzleTrayProps) {
  return (
    <section className="rounded-3xl border bg-card p-3 shadow-sm">
      <p className="sr-only">Puzzelstukken</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {questions.map(({ country }) => {
          const isPlaced = placed.has(country.code);
          const isSelected = selected === country.code;

          return (
            <button
              key={country.code}
              aria-label={`${country.name} (stuk)`}
              aria-pressed={isSelected}
              className={cn(
                "relative flex aspect-square touch-none items-center justify-center rounded-2xl border-2 bg-white p-1 transition active:scale-95",
                isSelected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:bg-muted",
                isPlaced && "opacity-30",
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
                  className="absolute inset-0 grid place-items-center text-xl"
                >
                  ✓
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
