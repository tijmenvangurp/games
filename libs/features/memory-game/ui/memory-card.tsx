import type { MemoryMonster } from "@entities/memory";
import { Star } from "@shared/ui";
import { cn } from "@shared/lib";
import { MonsterGlyph } from "./monster-glyph";

interface MemoryCardProps {
  monster: MemoryMonster;
  index: number;
  faceUp: boolean;
  matched: boolean;
  onFlip: (index: number) => void;
}

export function MemoryCard({ monster, index, faceUp, matched, onFlip }: MemoryCardProps) {
  const label = faceUp
    ? matched
      ? `${monster.name}, gevonden`
      : monster.name
    : "Omgedraaide kaart";

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={faceUp}
      className="memory-card aspect-square w-full rounded-2xl p-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
      data-card-index={index}
      data-flipped={faceUp}
      onClick={() => onFlip(index)}
    >
      <span className="memory-card-inner">
        <span className="memory-card-face memory-card-pattern">
          <Star aria-hidden="true" className="size-8 text-white/60" />
        </span>
        <span
          className={cn(
            "memory-card-face memory-card-face--monster border-2 bg-slate-50",
            matched
              ? "border-emerald-400 ring-2 ring-emerald-300"
              : "border-slate-200 bg-white shadow-sm",
          )}
        >
          <svg aria-hidden="true" className="size-4/5" viewBox="-50 -50 100 100">
            <MonsterGlyph monster={monster} />
          </svg>
        </span>
      </span>
    </button>
  );
}
