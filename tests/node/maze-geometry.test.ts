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

  it("does not treat a corner touch as a blocker", () => {
    const mover = arrow(1, [
      [1, 1],
      [2, 1],
    ]);
    const corner = arrow(2, [
      [3, 1],
      [3, 3],
    ]);
    const testLevel = level([mover, corner]);

    expect(isArrowRemovable(mover, testLevel, new Set())).toBe(true);
  });

  it("treats a collinear arrow directly ahead as a blocker", () => {
    const mover = arrow(1, [
      [1, 1],
      [2, 1],
    ]);
    const ahead = arrow(2, [
      [4, 1],
      [3, 1],
    ]);
    const testLevel = level([mover, ahead]);

    expect(isArrowRemovable(mover, testLevel, new Set())).toBe(false);
    expect(isArrowRemovable(mover, testLevel, new Set([2]))).toBe(true);
  });

  it("lets a bent arrow leave when only a rigid tail sweep would cross a neighbour", () => {
    const mover = arrow(1, [
      [2, 4],
      [2, 2],
      [3, 2],
    ]);
    const neighbour = arrow(2, [
      [4, 3],
      [5, 3],
    ]);
    const testLevel = level([mover, neighbour], 8, 8);

    expect(isArrowRemovable(mover, testLevel, new Set())).toBe(true);
  });

  it("lets two arrows with adjacent perpendicular heads leave", () => {
    const right = arrow(1, [
      [1, 0],
      [1, 2],
      [2, 2],
      [3, 2],
    ]);
    const up = arrow(2, [
      [4, 0],
      [4, 1],
      [4, 2],
    ]);
    const testLevel = level([right, up], 8, 8);

    expect(isArrowRemovable(right, testLevel, new Set())).toBe(true);
    expect(isArrowRemovable(up, testLevel, new Set())).toBe(true);
  });

  it("blocks a bent arrow when a neighbour sits in its lane in every direction", () => {
    const cases: [MazeArrow, MazeArrow][] = [
      [
        arrow(1, [
          [1, 2],
          [1, 0],
          [2, 0],
        ]),
        arrow(2, [
          [3, 0],
          [4, 0],
        ]),
      ],
      [
        arrow(1, [
          [1, 2],
          [1, 0],
          [0, 0],
        ]),
        arrow(2, [
          [-1, 0],
          [-2, 0],
        ]),
      ],
      [
        arrow(1, [
          [0, 1],
          [2, 1],
          [2, 2],
        ]),
        arrow(2, [
          [2, 3],
          [2, 4],
        ]),
      ],
      [
        arrow(1, [
          [0, 1],
          [2, 1],
          [2, 0],
        ]),
        arrow(2, [
          [2, -1],
          [2, -2],
        ]),
      ],
    ];

    for (const [mover, neighbour] of cases) {
      const testLevel = level([mover, neighbour], 8, 8);
      expect(isArrowRemovable(mover, testLevel, new Set())).toBe(false);
      expect(isArrowRemovable(mover, testLevel, new Set([neighbour.id]))).toBe(true);
    }
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
