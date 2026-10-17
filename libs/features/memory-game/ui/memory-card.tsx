import type { Pokemon } from "@entities/memory";
import { Sparkles } from "@shared/ui";
import { cn } from "@shared/lib";
import { pokemonAnimatedSrc, pokemonArtworkSrc } from "../model/assets";

interface MemoryCardProps {
  pokemon: Pokemon;
  index: number;
  faceUp: boolean;
  matched: boolean;
  onFlip: (index: number) => void;
}

function PokeballMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 64 64">
      <circle cx="32" cy="32" fill="#ffffff" r="27" stroke="#0f172a" strokeWidth="3" />
      <path d="M5 32a27 27 0 0 1 54 0Z" fill="#ef4444" stroke="#0f172a" strokeWidth="3" />
      <path d="M5 32h54" stroke="#0f172a" strokeWidth="5" />
      <circle cx="32" cy="32" fill="#ffffff" r="9" stroke="#0f172a" strokeWidth="3" />
      <circle cx="32" cy="32" fill="#e2e8f0" r="4" />
    </svg>
  );
}

export function MemoryCard({ pokemon, index, faceUp, matched, onFlip }: MemoryCardProps) {
  const label = faceUp
    ? matched
      ? `${pokemon.name}, gevonden`
      : pokemon.name
    : "Omgedraaide kaart";

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={faceUp}
      className="memory-card aspect-square w-full rounded-2xl p-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
      data-card-index={index}
      data-flipped={faceUp}
      data-matched={matched}
      onClick={() => onFlip(index)}
    >
      <span className="memory-card-inner">
        <span className="memory-card-face memory-card-pattern">
          <PokeballMark className="size-1/2 max-h-16 max-w-16 drop-shadow-sm" />
        </span>
        <span
          className={cn(
            "memory-card-face memory-card-face--pokemon border-2 bg-white",
            matched
              ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300"
              : "border-slate-200 shadow-sm",
          )}
        >
          <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 p-1.5">
            <img
              alt=""
              className={cn(
                "min-h-0 w-full flex-1 object-contain drop-shadow-sm",
                matched ? "pokemon-sprite" : undefined,
              )}
              draggable={false}
              loading="eager"
              src={matched ? pokemonAnimatedSrc(pokemon) : pokemonArtworkSrc(pokemon)}
            />
            <span className="memory-card-name max-w-full font-black text-slate-700">
              {pokemon.name}
            </span>
          </span>
          {matched ? (
            <Sparkles
              aria-hidden="true"
              className="animate-pulse absolute right-1 top-1 size-4 text-emerald-500"
            />
          ) : null}
        </span>
      </span>
    </button>
  );
}
