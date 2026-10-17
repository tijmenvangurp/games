import { createSeed, mulberry32, shuffledIndexes } from "@shared/lib";
import { MEMORY_PAIRS, POKEMON } from "./config";
import type { MemoryDifficulty, MemoryScene } from "./types";

/** Builds a shuffled deck with exactly two cards per chosen Pokémon. */
export function createMemoryScene(
  difficulty: MemoryDifficulty,
  seed: number = createSeed(),
): MemoryScene {
  const random = mulberry32(seed);
  const pairs = MEMORY_PAIRS[difficulty];
  const chosen = shuffledIndexes(POKEMON.length, random)
    .slice(0, pairs)
    .map((index) => POKEMON[index].id);

  const cards = [...chosen, ...chosen];
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    const current = cards[index];
    cards[index] = cards[swapWith];
    cards[swapWith] = current;
  }

  return { seed, difficulty, cards, pairs };
}
