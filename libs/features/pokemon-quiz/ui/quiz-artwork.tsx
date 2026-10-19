import { PokeballMark, pokemonArtworkSrc, type Pokemon } from "@entities/pokedex";
import { cn } from "@shared/lib";

interface QuizArtworkProps {
  target: Pokemon;
  answered: boolean;
  /** Hard mode hides the colours until the player has answered. */
  silhouette: boolean;
  /** The hardest mode shows only the head and upper body. */
  fragment: boolean;
}

export function QuizArtwork({ target, answered, silhouette, fragment }: QuizArtworkProps) {
  // Easy and medium show the colours right away; hard waits for the answer.
  const revealed = !silhouette || answered;
  const fragmentVisible = fragment && !answered;

  return (
    <div className="game-panel relative overflow-hidden p-3 sm:p-5">
      <PokeballMark className="pointer-events-none absolute -right-10 -top-10 size-44 opacity-10 sm:size-56" />
      <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center overflow-hidden rounded-lg">
        <img
          alt={answered ? target.name : ""}
          className={cn(
            "h-full w-full object-contain drop-shadow-xl transition duration-700 ease-out",
            revealed ? undefined : "brightness-0",
            fragmentVisible
              ? "quiz-fragment-pan -translate-y-1/5 scale-200"
              : "translate-y-0 scale-100",
          )}
          data-fragment={fragmentVisible}
          data-revealed={revealed}
          draggable={false}
          src={pokemonArtworkSrc(target)}
        />
      </div>
      <p
        className={cn(
          "relative text-center text-lg font-black",
          answered ? "animate-pop text-success" : "text-muted-foreground",
        )}
        data-artwork-label={answered ? target.name : ""}
      >
        {answered ? target.name : fragment ? "Je ziet steeds een stukje…" : "Wie is deze Pokémon?"}
      </p>
    </div>
  );
}
