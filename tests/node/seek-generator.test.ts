import { describe, expect, it } from "vitest";
import {
  SEEK_CONFIG,
  SEEK_DIFFICULTIES,
  SEEK_THEMES,
  SCENE_SIZE,
  createSeekScene,
  findTarget,
} from "@entities/hidden-object";

describe("seek scene generator", () => {
  for (const difficulty of SEEK_DIFFICULTIES) {
    for (const theme of SEEK_THEMES) {
      it(`builds a ${difficulty} ${theme} scene with one target`, () => {
        const scene = createSeekScene(difficulty, theme, 4242);
        const columns = SEEK_CONFIG[difficulty].columns;

        expect(scene.creatures).toHaveLength(columns * columns);
        expect(scene.theme).toBe(theme);
        expect(scene.difficulty).toBe(difficulty);
        expect(scene.targetId).toBeGreaterThanOrEqual(0);
        expect(scene.targetId).toBeLessThan(scene.creatures.length);

        const target = findTarget(scene);
        expect(target.id).toBe(scene.targetId);
        expect(target.badge).toBe("star");
        expect(scene.creatures.filter((creature) => creature.badge === "star")).toHaveLength(1);
        expect(scene.decorations.length).toBeGreaterThan(0);
        expect(scene.decorations.length).toBeLessThanOrEqual(SEEK_CONFIG[difficulty].decorations);
        expect(scene.hintRadius).toBeGreaterThan(0);
      });
    }
  }

  it("keeps every creature inside the scene", () => {
    const scene = createSeekScene("moeilijk", "tuin", 11);
    for (const creature of scene.creatures) {
      expect(creature.x).toBeGreaterThan(0);
      expect(creature.x).toBeLessThan(SCENE_SIZE);
      expect(creature.y).toBeGreaterThan(0);
      expect(creature.y).toBeLessThan(SCENE_SIZE);
      expect(creature.size).toBeGreaterThan(0);
      expect(Math.abs(creature.rotation)).toBeLessThanOrEqual(9);
      expect(creature.colors.body).toMatch(/^#/);
    }
  });

  it("does not place decorations on top of creatures", () => {
    const scene = createSeekScene("gemiddeld", "onderwater", 7);
    for (const decoration of scene.decorations) {
      for (const creature of scene.creatures) {
        const distance = Math.hypot(creature.x - decoration.x, creature.y - decoration.y);
        expect(distance).toBeGreaterThan(creature.size * 0.5);
      }
    }
  });

  it("is deterministic per seed", () => {
    expect(createSeekScene("makkelijk", "tuin", 99)).toEqual(
      createSeekScene("makkelijk", "tuin", 99),
    );
  });

  it("varies between seeds", () => {
    const first = createSeekScene("gemiddeld", "tuin", 1);
    const second = createSeekScene("gemiddeld", "tuin", 2);
    expect(first.creatures.map((creature) => creature.x)).not.toEqual(
      second.creatures.map((creature) => creature.x),
    );
  });

  it("makes larger difficulties busier", () => {
    const easy = createSeekScene("makkelijk", "tuin", 5);
    const hard = createSeekScene("moeilijk", "tuin", 5);
    expect(hard.creatures.length).toBeGreaterThan(easy.creatures.length);
    expect(hard.decorations.length).toBeGreaterThan(easy.decorations.length);
  });
});
