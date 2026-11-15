import { createSeed, mulberry32, shuffledIndexes } from "@shared/lib";
import { clampMemoryLevelIndex, MEMORY_POKEMON_POOL_SIZE, pairsForLevel } from "./config";
import type { MemoryScene } from "./types";

function normalizeReviewIds(reviewIds: readonly number[], limit: number): number[] {
  const seen = new Set<number>();
  const result: number[] = [];

  for (const id of reviewIds) {
    if (!Number.isInteger(id) || id < 1 || id > MEMORY_POKEMON_POOL_SIZE || seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(id);
    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

/** Builds a shuffled deck with exactly two cards per chosen Pokémon. */
export function createMemoryScene(
  levelIndex: number,
  seed: number = createSeed(),
  reviewIds: readonly number[] = [],
): MemoryScene {
  const random = mulberry32(seed);
  const safeLevelIndex = clampMemoryLevelIndex(levelIndex);
  const pairs = pairsForLevel(safeLevelIndex);
  const review = normalizeReviewIds(reviewIds, pairs);
  const chosen = new Set<number>(review);

  for (const index of shuffledIndexes(MEMORY_POKEMON_POOL_SIZE, random)) {
    if (chosen.size >= pairs) {
      break;
    }
    chosen.add(index + 1);
  }

  const cards = [...chosen, ...chosen];
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    const current = cards[index];
    cards[index] = cards[swapWith];
    cards[swapWith] = current;
  }

  return {
    seed,
    levelIndex: safeLevelIndex,
    cards,
    pairs,
    reviewIds: review,
  };
}
