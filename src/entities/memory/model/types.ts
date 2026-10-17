export const MEMORY_DIFFICULTIES = ["makkelijk", "gemiddeld", "moeilijk"] as const;

export type MemoryDifficulty = (typeof MEMORY_DIFFICULTIES)[number];

export type MonsterShape = "blob" | "tall" | "round" | "spiky" | "square";

export type MonsterHorns = "none" | "one" | "two" | "antenna";

export type MonsterEyes = 1 | 2 | 3;

export interface MemoryMonster {
  id: number;
  name: string;
  body: string;
  accent: string;
  shape: MonsterShape;
  eyes: MonsterEyes;
  horns: MonsterHorns;
}

export interface MemoryScene {
  seed: number;
  difficulty: MemoryDifficulty;
  /** Monster IDs, two of each, already shuffled into card order. */
  cards: number[];
  pairs: number;
}
