import { describe, expect, it } from "vitest";
import {
  arrowHead,
  arrowSegments,
  arrowTail,
  directionBetween,
  findHint,
  isArrowRemovable,
  isSolved,
  levelBounds,
  nearestArrow,
  solveMaze,
  type MazeArrow,
  type MazeLevel,
} from "@entities/arrow";

function arrow(id: number, points: [number, number][]): MazeArrow {
  return { id, points: points.map(([x, y]) => ({ x, y })) };
}

function level(arrows: MazeArrow[], width = 6, height = 6): MazeLevel {
  return {
    id: "test",
    name: "Test",
    difficulty: "makkelijk",
    width,
    height,
    arrows,
  };
}

describe("maze geometry", () => {
  it("reads tail, head and segments", () => {
    const testArrow = arrow(1, [
      [1, 1],
      [4, 1],
    ]);

    expect(arrowTail(testArrow)).toEqual({ x: 1, y: 1 });
    expect(arrowHead(testArrow)).toEqual({ x: 4, y: 1 });
    expect(arrowSegments(testArrow)).toEqual([{ a: { x: 1, y: 1 }, b: { x: 4, y: 1 } }]);
    expect(directionBetween({ x: 1, y: 1 }, { x: 4, y: 1 })).toBe("right");
    expect(() => directionBetween({ x: 1, y: 1 }, { x: 1, y: 1 })).toThrow();
  });

  it("blocks a lane until the blocker is removed", () => {
    const mover = arrow(1, [
      [1, 1],
      [2, 1],
    ]);
    const blocker = arrow(2, [
      [3, 5],
      [3, 0],
    ]);
    const testLevel = level([mover, blocker]);

    expect(isArrowRemovable(mover, testLevel, new Set())).toBe(false);
    expect(isArrowRemovable(mover, testLevel, new Set([2]))).toBe(true);
    expect(findHint(testLevel, new Set())).toBe(blocker);
  });

  it("solves a small chain and detects a deadlock", () => {
    const chain = level([
      arrow(1, [
        [1, 1],
        [2, 1],
      ]),
      arrow(2, [
        [3, 5],
        [3, 0],
      ]),
    ]);
    expect(solveMaze(chain)).toEqual([2, 1]);

    const deadlock = level([
      arrow(1, [
        [1, 1],
        [3, 1],
      ]),
      arrow(2, [
        [5, 1],
        [4, 1],
      ]),
    ]);
    expect(solveMaze(deadlock)).toBeNull();
    expect(isSolved(chain, new Set([1, 2]))).toBe(true);
    expect(isSolved(chain, new Set([1]))).toBe(false);
  });

  it("finds the nearest arrow to a tap", () => {
    const first = arrow(1, [
      [1, 1],
      [4, 1],
    ]);
    const second = arrow(2, [
      [1, 4],
      [4, 4],
    ]);
    const testLevel = level([first, second]);

    expect(nearestArrow(testLevel, new Set(), { x: 2, y: 1.2 }, 1)?.id).toBe(1);
    expect(nearestArrow(testLevel, new Set(), { x: 2, y: 3.8 }, 1)?.id).toBe(2);
    expect(nearestArrow(testLevel, new Set([1]), { x: 2, y: 1.2 }, 1)).toBeNull();
  });

  it("adds padding around the level", () => {
    expect(levelBounds(level([]))).toEqual({ minX: -2, minY: -2, width: 10, height: 10 });
  });
});
