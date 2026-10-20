import type { Pokemon } from "@entities/pokedex";
import { PokeballMark, pokemonAnimatedSrc, pokemonArtworkSrc } from "@entities/pokedex";
import { Sparkles } from "@shared/ui";
import { cn } from "@shared/lib";

interface MemoryCardProps {
  pokemon: Pokemon;
  index: number;
  faceUp: boolean;
  matched: boolean;
  hinted: boolean;
  hintLevel: 1 | 2 | 3 | null;
  onFlip: (index: number) => void;
}

export function MemoryCard({
  pokemon,
  index,
  faceUp,
  matched,
  hinted,
  hintLevel,
  onFlip,
}: MemoryCardProps) {
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
      className={cn(
        "memory-card aspect-square w-full rounded-2xl p-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
        hinted && "ring-4 ring-amber-300 ring-offset-2",
        hinted && hintLevel === 3 && "ring-amber-400",
      )}
      data-card-index={index}
      data-flipped={faceUp}
      data-hinted={hinted || undefined}
      data-matched={matched}
      onClick={() => onFlip(index)}
    >
      <span className="memory-card-inner">
        <span className="memory-card-face memory-card-pattern">
          <PokeballMark className="size-1/2 max-h-16 max-w-16 drop-shadow-sm" />
        </span>
        <span
          className={cn(
            "memory-card-face memory-card-face--pokemon border bg-card",
            matched ? "border-success/50 bg-success/10 ring-1 ring-success/30" : "border-border",
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
            <span className="memory-card-name max-w-full font-black text-foreground">
              {pokemon.name}
            </span>
          </span>
          {matched ? (
            <Sparkles
              aria-hidden="true"
              className="animate-pulse absolute right-1 top-1 size-4 text-success"
            />
          ) : null}
        </span>
      </span>
    </button>
  );
}
