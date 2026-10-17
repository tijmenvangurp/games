import { describe, expect, it } from "vitest";
import { MEMORY_DIFFICULTIES, MEMORY_PAIRS, MONSTERS, createMemoryScene } from "@entities/memory";

describe("memory generator", () => {
  for (const difficulty of MEMORY_DIFFICULTIES) {
    it(`builds a ${difficulty} deck with pairs`, () => {
      const scene = createMemoryScene(difficulty, 2026);
      const pairs = MEMORY_PAIRS[difficulty];

      expect(scene.cards).toHaveLength(pairs * 2);
      expect(scene.pairs).toBe(pairs);

      const counts = new Map<number, number>();
      for (const id of scene.cards) {
        expect(id).toBeGreaterThanOrEqual(0);
        expect(id).toBeLessThan(MONSTERS.length);
        expect(MONSTERS[id].id).toBe(id);
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
