export const MEMORY_DIFFICULTIES = ["makkelijk", "gemiddeld", "moeilijk"] as const;

export type MemoryDifficulty = (typeof MEMORY_DIFFICULTIES)[number];

export interface MemoryScene {
  seed: number;
  difficulty: MemoryDifficulty;
  /** Pokémon IDs, two of each, already shuffled into card order. */
  cards: number[];
  pairs: number;
}
