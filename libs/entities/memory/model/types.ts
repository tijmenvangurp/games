export const MEMORY_DIFFICULTIES = ["makkelijk", "gemiddeld", "moeilijk"] as const;

export type MemoryDifficulty = (typeof MEMORY_DIFFICULTIES)[number];

export interface Pokemon {
  /** National Pokédex number, 1 through 151. */
  id: number;
  /** Display name, for example "Pikachu" or "Mr. Mime". */
  name: string;
  /** Lowercase name used for local cry and animation files. */
  slug: string;
}

export interface MemoryScene {
  seed: number;
  difficulty: MemoryDifficulty;
  /** Pokémon IDs, two of each, already shuffled into card order. */
  cards: number[];
  pairs: number;
}
