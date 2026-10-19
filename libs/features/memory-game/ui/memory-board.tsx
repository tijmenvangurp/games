import type { MemoryDifficulty } from "@entities/memory";
import { getPokemon, usePokemonCry } from "@entities/pokedex";
import { cn, playHaptic, playSound } from "@shared/lib";
import { useMemoryStore } from "../model/use-memory-store";
import { MemoryCard } from "./memory-card";

const COLUMN_CLASSES: Record<MemoryDifficulty, string> = {
  makkelijk: "grid-cols-3 sm:grid-cols-4",
  gemiddeld: "grid-cols-4",
  moeilijk: "grid-cols-4 sm:grid-cols-5",
};

function playFlipFeedback(beforeMatched: number): void {
  const next = useMemoryStore.getState();
  if (next.found) {
    playHaptic("win");
    return;
  }
  if (next.matched.filter(Boolean).length > beforeMatched) {
    playSound("match");
    playHaptic("match");
  } else if (next.locked) {
    playSound("wrong");
    playHaptic("wrong");
  } else {
    playHaptic("tap");
  }
}

export function MemoryBoard() {
  const scene = useMemoryStore((state) => state.scene);
  const matched = useMemoryStore((state) => state.matched);
  const flipped = useMemoryStore((state) => state.flipped);
  const playCry = usePokemonCry();

  if (!scene) {
    return null;
  }

  const flipCard = (index: number) => {
    const state = useMemoryStore.getState();
    if (!state.scene || state.locked || state.found) {
      return;
    }
    if (state.matched[index] || state.flipped.includes(index)) {
      return;
    }

    const pokemon = getPokemon(state.scene.cards[index]);
    const beforeMatched = state.matched.filter(Boolean).length;
    state.flip(index);
    playFlipFeedback(beforeMatched);

    if (pokemon) {
      playCry(pokemon);
    }
  };

  return (
    <div className="game-panel mx-auto w-full max-w-2xl p-2 sm:p-3">
      <div className={cn("grid w-full gap-2 sm:gap-3", COLUMN_CLASSES[scene.difficulty])}>
        {scene.cards.map((pokemonId, index) => {
          const pokemon = getPokemon(pokemonId);
          if (!pokemon) {
            return null;
          }
          return (
            <MemoryCard
              key={index}
              faceUp={matched[index] || flipped.includes(index)}
              index={index}
              matched={matched[index]}
              pokemon={pokemon}
              onFlip={flipCard}
            />
          );
        })}
      </div>
    </div>
  );
}
