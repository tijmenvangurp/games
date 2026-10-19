import { PokeballMark, pokemonArtworkSrc, type Pokemon } from "@entities/pokedex";
import { Volume2 } from "@shared/ui";
import { cn } from "@shared/lib";

interface QuizSoundPromptProps {
  target: Pokemon;
  answered: boolean;
  onReplay: () => void;
}

export function QuizSoundPrompt({ target, answered, onReplay }: QuizSoundPromptProps) {
  return (
    <div className="game-panel relative overflow-hidden p-3 sm:p-5">
      <PokeballMark className="pointer-events-none absolute -right-10 -top-10 size-44 opacity-10 sm:size-56" />
      <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center overflow-hidden rounded-lg bg-muted/40">
        {answered ? (
          <img
            alt={target.name}
            className="h-full w-full animate-pop object-contain drop-shadow-xl"
            data-revealed="true"
            draggable={false}
            src={pokemonArtworkSrc(target)}
          />
        ) : (
          <div className="flex flex-col items-center gap-5 px-6 text-center">
            <button
              aria-label="Speel het geluid opnieuw"
              className="relative grid size-32 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
              type="button"
              onClick={onReplay}
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 animate-ping rounded-full bg-primary/25"
              />
              <Volume2 aria-hidden="true" className="relative size-16" />
            </button>
            <p className="text-sm font-bold text-muted-foreground">Tik om nog eens te luisteren</p>
          </div>
        )}
      </div>
      <p
        className={cn(
          "relative text-center text-lg font-black",
          answered ? "animate-pop text-success" : "text-muted-foreground",
        )}
      >
        {answered ? target.name : "Welke Pokémon hoor je?"}
      </p>
    </div>
  );
}
