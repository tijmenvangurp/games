import { getPokemon, usePokemonCry } from "@entities/pokedex";
import { cn, playHaptic, playSound } from "@shared/lib";
import { useMemoryStore } from "../model/use-memory-store";
import { MemoryCard } from "./memory-card";

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
    // A mismatch is information, not a punishment: the cards turn back
    // quietly. There is deliberately no wrong sound or wrong haptic.
    return;
  } else {
    playHaptic("tap");
  }
}

function columnsFor(pairs: number): string {
  if (pairs <= 4) {
    return "grid-cols-4";
  }
  return "grid-cols-4 sm:grid-cols-5";
}

export function MemoryBoard() {
  const scene = useMemoryStore((state) => state.scene);
  const matched = useMemoryStore((state) => state.matched);
  const flipped = useMemoryStore((state) => state.flipped);
  const hint = useMemoryStore((state) => state.hint);
  const playCry = usePokemonCry();

  if (!scene) {
    return null;
  }

  const flipCard = (index: number) => {
    const state = useMemoryStore.getState();
    if (!state.scene) {
      return;
    }
    if (state.locked || state.found || state.matched[index] || state.flipped.includes(index)) {
      // Let the store count ignored taps for the stuck signal; it ignores them
      // without changing the board.
      state.flip(index);
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
      <div className={cn("grid w-full gap-2 sm:gap-3", columnsFor(scene.pairs))}>
        {scene.cards.map((pokemonId, index) => {
          const pokemon = getPokemon(pokemonId);
          if (!pokemon) {
            return null;
          }
          const hinted = hint?.indices.includes(index) ?? false;
          return (
            <MemoryCard
              key={index}
              faceUp={matched[index] || flipped.includes(index) || (hint?.level === 3 && hinted)}
              hinted={hinted}
              hintLevel={hint?.level ?? null}
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
