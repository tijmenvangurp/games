/** Ordered pair counts. The index is the adaptive level, the value is the deck. */
export const MEMORY_LEVELS = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export type MemoryLevel = (typeof MEMORY_LEVELS)[number];

/** New players start here; the controller can move one step per board. */
export const MEMORY_START_LEVEL: MemoryLevel = 6;

/** The memory deck draws from the 151 Generation 1 Pokémon. */
export const MEMORY_POKEMON_POOL_SIZE = 151;

export function clampMemoryLevelIndex(index: number): number {
  const safe = Number.isFinite(index) ? Math.floor(index) : 0;
  return Math.min(MEMORY_LEVELS.length - 1, Math.max(0, safe));
}

export function pairsForLevel(index: number): MemoryLevel {
  return MEMORY_LEVELS[clampMemoryLevelIndex(index)] as MemoryLevel;
}

/** Maps a pair count to the nearest level index; used for the v1 migration. */
export function levelIndexForPairs(pairs: number): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  MEMORY_LEVELS.forEach((value, index) => {
    const distance = Math.abs(value - pairs);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}
