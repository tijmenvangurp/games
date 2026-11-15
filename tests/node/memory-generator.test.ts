import { describe, expect, it } from "vitest";
import {
  MEMORY_LEVELS,
  MEMORY_POKEMON_POOL_SIZE,
  createMemoryScene,
  pairsForLevel,
} from "@entities/memory";
import { POKEDEX, getPokemon } from "@entities/pokedex";

describe("pokémon memory generator", () => {
  it("contains the complete Generation 1 Pokédex", () => {
    expect(POKEDEX).toHaveLength(MEMORY_POKEMON_POOL_SIZE);
    expect(POKEDEX.map((pokemon) => pokemon.id)).toEqual(
      Array.from({ length: MEMORY_POKEMON_POOL_SIZE }, (_, index) => index + 1),
    );
    expect(new Set(POKEDEX.map((pokemon) => pokemon.slug)).size).toBe(MEMORY_POKEMON_POOL_SIZE);
    expect(getPokemon(25)?.name).toBe("Pikachu");
    expect(getPokemon(122)?.slug).toBe("mrmime");
    expect(getPokemon(0)).toBeUndefined();
    expect(getPokemon(152)).toBeUndefined();
  });

  MEMORY_LEVELS.forEach((pairs, levelIndex) => {
    it(`builds a ${pairs}-pair deck for level ${levelIndex}`, () => {
      const scene = createMemoryScene(levelIndex, 2026);

      expect(scene.cards).toHaveLength(pairs * 2);
      expect(scene.pairs).toBe(pairs);
      expect(scene.levelIndex).toBe(levelIndex);

      const counts = new Map<number, number>();
      for (const id of scene.cards) {
        expect(id).toBeGreaterThanOrEqual(1);
        expect(id).toBeLessThanOrEqual(151);
        expect(getPokemon(id)?.id).toBe(id);
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }

      expect(counts.size).toBe(pairs);
      expect([...counts.values()].every((count) => count === 2)).toBe(true);
    });
  });

  it("is deterministic per seed", () => {
    expect(createMemoryScene(4, 77)).toEqual(createMemoryScene(4, 77));
  });

  it("shuffles differently for another seed", () => {
    const first = createMemoryScene(6, 1);
    const second = createMemoryScene(6, 2);
    expect(first.cards).not.toEqual(second.cards);
  });

  it("uses fewer cards on easier levels", () => {
    const easy = createMemoryScene(0, 5);
    const hard = createMemoryScene(MEMORY_LEVELS.length - 1, 5);
    expect(hard.cards.length).toBeGreaterThan(easy.cards.length);
  });

  it("includes review items and still fills the deck", () => {
    const scene = createMemoryScene(3, 12, [25, 25, 0, 999]);
    expect(scene.reviewIds).toEqual([25]);
    expect(scene.cards).toContain(25);
    expect(scene.cards).toHaveLength(pairsForLevel(3) * 2);
    expect(new Set(scene.cards).size).toBe(pairsForLevel(3));
  });

  it("clamps an out-of-range level", () => {
    expect(createMemoryScene(-10, 1).pairs).toBe(MEMORY_LEVELS[0]);
    expect(createMemoryScene(999, 1).pairs).toBe(MEMORY_LEVELS.at(-1));
  });
});
