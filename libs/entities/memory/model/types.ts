export interface MemoryScene {
  seed: number;
  /** Index into MEMORY_LEVELS. */
  levelIndex: number;
  /** Pokémon IDs, two of each, already shuffled into card order. */
  cards: number[];
  pairs: number;
  /** IDs that came from the review queue and should reappear on this board. */
  reviewIds: number[];
}
