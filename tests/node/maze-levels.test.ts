import { describe, expect, it } from "vitest";
import { LEVEL_COUNT, MAZE_LEVELS, levelAt, removableArrows, solveMaze } from "@entities/arrow";

describe("maze levels", () => {
  it("contains a progression of solvable levels", () => {
    expect(LEVEL_COUNT).toBeGreaterThanOrEqual(8);
    expect(new Set(MAZE_LEVELS.map((level) => level.id)).size).toBe(LEVEL_COUNT);

    for (const level of MAZE_LEVELS) {
      expect(level.arrows.length).toBeGreaterThan(0);
      expect(new Set(level.arrows.map((arrow) => arrow.id)).size).toBe(level.arrows.length);
      expect(removableArrows(level, new Set()).length).toBeGreaterThan(0);

      for (const arrow of level.arrows) {
        expect(arrow.points.length).toBeGreaterThanOrEqual(2);
        for (let index = 1; index < arrow.points.length; index += 1) {
          const previous = arrow.points[index - 1]!;
          const current = arrow.points[index]!;
          const dx = Math.abs(current.x - previous.x);
          const dy = Math.abs(current.y - previous.y);
          expect(dx === 0 || dy === 0).toBe(true);
          expect(dx + dy).toBe(1);
        }
      }

      const order = solveMaze(level);
      expect(order).not.toBeNull();
      expect(order).toHaveLength(level.arrows.length);
    }
  });

  it("looks up levels by index and rejects unknown indexes", () => {
    expect(levelAt(0)).toBe(MAZE_LEVELS[0]);
    expect(levelAt(LEVEL_COUNT - 1)).toBe(MAZE_LEVELS[LEVEL_COUNT - 1]);
    expect(() => levelAt(-1)).toThrow();
    expect(() => levelAt(LEVEL_COUNT)).toThrow();
  });
});
