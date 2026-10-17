import { PokeballMark, pokemonArtworkSrc, type Pokemon } from "@entities/pokedex";
import { cn } from "@shared/lib";

interface QuizArtworkProps {
  target: Pokemon;
  answered: boolean;
}

export function QuizArtwork({ target, answered }: QuizArtworkProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-sky-100 via-amber-50 to-rose-100 p-3 shadow-sm sm:p-5">
      <PokeballMark className="pointer-events-none absolute -right-10 -top-10 size-44 opacity-10 sm:size-56" />
      <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center">
        <img
          alt={answered ? target.name : ""}
          className="h-full w-full object-contain drop-shadow-xl"
          draggable={false}
          src={pokemonArtworkSrc(target)}
        />
      </div>
      <p
        className={cn(
          "relative text-center text-lg font-black",
          answered ? "animate-pop text-emerald-700" : "text-slate-500",
        )}
      >
        {answered ? target.name : "Wie is deze Pokémon?"}
      </p>
    </div>
  );
}
