import { describe, expect, it } from "vitest";
import {
  MEMORY_DIFFICULTIES,
  MEMORY_PAIRS,
  MEMORY_POKEMON_POOL_SIZE,
  createMemoryScene,
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

  for (const difficulty of MEMORY_DIFFICULTIES) {
    it(`builds a ${difficulty} deck with pairs`, () => {
      const scene = createMemoryScene(difficulty, 2026);
      const pairs = MEMORY_PAIRS[difficulty];

      expect(scene.cards).toHaveLength(pairs * 2);
      expect(scene.pairs).toBe(pairs);

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
  }

  it("is deterministic per seed", () => {
    expect(createMemoryScene("gemiddeld", 77)).toEqual(createMemoryScene("gemiddeld", 77));
  });

  it("shuffles differently for another seed", () => {
    const first = createMemoryScene("moeilijk", 1);
    const second = createMemoryScene("moeilijk", 2);
    expect(first.cards).not.toEqual(second.cards);
  });

  it("uses fewer cards on easier levels", () => {
    const easy = createMemoryScene("makkelijk", 5);
    const hard = createMemoryScene("moeilijk", 5);
    expect(hard.cards.length).toBeGreaterThan(easy.cards.length);
  });
});
