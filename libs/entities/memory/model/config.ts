import type { MemoryDifficulty } from "./types";

export const MEMORY_PAIRS: Record<MemoryDifficulty, number> = {
  makkelijk: 6,
  gemiddeld: 8,
  moeilijk: 10,
};

/** The memory deck draws from the 151 Generation 1 Pokémon. */
export const MEMORY_POKEMON_POOL_SIZE = 151;
