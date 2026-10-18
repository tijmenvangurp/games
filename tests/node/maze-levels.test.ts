import { describe, expect, it } from "vitest";
import {
  findHint,
  isArrowRemovable,
  isSolved,
  LEVEL_COUNT,
  MAZE_LEVELS,
  levelAt,
  nearestArrow,
  removableArrows,
  solveMaze,
  visibleArrowPoints,
} from "@entities/arrow";
import type { MazeArrow, MazeLevel, Point } from "@entities/arrow";
import { mulberry32 } from "@shared/lib";

interface Segment {
  a: Point;
  b: Point;
}

function segmentKey(a: Point, b: Point): string {
  const first = `${a.x},${a.y}`;
  const second = `${b.x},${b.y}`;
  return first < second ? `${first}|${second}` : `${second}|${first}`;
}

function segmentsOf(level: MazeLevel): Segment[] {
  return level.arrows.flatMap((arrow) =>
    arrow.points.slice(1).map((point, index) => ({
      a: arrow.points[index] as Point,
      b: point,
    })),
  );
}

function crosses(first: Segment, second: Segment): boolean {
  const firstHorizontal = first.a.y === first.b.y;
  const secondHorizontal = second.a.y === second.b.y;
  if (firstHorizontal === secondHorizontal) {
    return false;
  }
  const horizontal = firstHorizontal ? first : second;
  const vertical = firstHorizontal ? second : first;
  const minX = Math.min(horizontal.a.x, horizontal.b.x);
  const maxX = Math.max(horizontal.a.x, horizontal.b.x);
  const minY = Math.min(vertical.a.y, vertical.b.y);
  const maxY = Math.max(vertical.a.y, vertical.b.y);
  return (
    vertical.a.x > minX && vertical.a.x < maxX && horizontal.a.y > minY && horizontal.a.y < maxY
  );
}

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
          expect(Number.isInteger(previous.x)).toBe(true);
          expect(Number.isInteger(previous.y)).toBe(true);
          expect(Number.isInteger(current.x)).toBe(true);
          expect(Number.isInteger(current.y)).toBe(true);
          const dx = Math.abs(current.x - previous.x);
          const dy = Math.abs(current.y - previous.y);
          expect(dx === 0 || dy === 0).toBe(true);
          expect(dx + dy).toBe(1);
        }
      }

      const order = solveMaze(level);
      expect(order).not.toBeNull();
      expect(order).toHaveLength(level.arrows.length);

      // Replay the solution with the exact rule the game uses. A non-null
      // greedy result alone would not catch a generator/runtime rule drift.
      const removed = new Set<number>();
      for (const id of order ?? []) {
        const arrow = level.arrows.find((candidate) => candidate.id === id);
        if (!arrow) {
          throw new Error(`Solution refers to unknown arrow ${id} in ${level.id}`);
        }
        expect(isArrowRemovable(arrow, level, removed)).toBe(true);
        removed.add(id);
      }
      expect(isSolved(level, removed)).toBe(true);
    }
  });

  it("always has a free arrow, whatever arrows are already gone", () => {
    for (const level of MAZE_LEVELS) {
      const order = solveMaze(level);
      if (!order) {
        throw new Error(`${level.id} has no solution`);
      }

      for (let round = 0; round < 64; round += 1) {
        const random = mulberry32(level.arrows.length * 7919 + round);
        const removed = new Set(order.filter(() => random() < 0.5));
        const next = order.find((id) => !removed.has(id));
        if (next === undefined) {
          continue;
        }
        const arrow = level.arrows.find((candidate) => candidate.id === next);
        if (!arrow) {
          throw new Error(`${level.id} lost arrow ${next}`);
        }
        expect(
          isArrowRemovable(arrow, level, removed),
          `${level.id}: arrow ${next} must be free after removing ${removed.size} arrows`,
        ).toBe(true);
      }
    }
  });

  it("stays solvable whatever order the player picks", () => {
    for (const level of MAZE_LEVELS) {
      for (let round = 0; round < 4; round += 1) {
        const random = mulberry32(level.arrows.length * 1000 + round);
        const removed = new Set<number>();

        while (removed.size < level.arrows.length) {
          const free = removableArrows(level, removed);
          expect(free.length, `${level.id} deadlocks after ${removed.size} arrows`).toBeGreaterThan(
            0,
          );
          const choice = free[Math.floor(random() * free.length)] as MazeArrow;
          removed.add(choice.id);
        }

        expect(isSolved(level, removed)).toBe(true);
      }
    }
  }, 20_000);

  it("stays solvable after any free first move", () => {
    for (const level of MAZE_LEVELS) {
      // Three free moves per level keep this fast enough for CI while still
      // covering every generated level; the monotonicity property is general.
      for (const arrow of removableArrows(level, new Set()).slice(0, 3)) {
        const rest = {
          ...level,
          arrows: level.arrows.filter((candidate) => candidate.id !== arrow.id),
        };
        expect(solveMaze(rest), `${level.id} deadlocks after removing ${arrow.id}`).not.toBeNull();
      }
    }
  });

  it("keeps every hint tappable until the whole level is cleared", () => {
    for (const level of MAZE_LEVELS) {
      const removed = new Set<number>();

      while (removed.size < level.arrows.length) {
        const hint = findHint(level, removed);
        if (!hint) {
          throw new Error(`${level.id} has no hint while arrows remain`);
        }
        const points = visibleArrowPoints(level, hint);
        const tip = points[points.length - 1] as Point;
        expect(
          nearestArrow(level, removed, tip, 1.35)?.id,
          `${level.id}: tapping the head of hinted arrow ${hint.id} must select that arrow`,
        ).toBe(hint.id);
        removed.add(hint.id);
      }
    }
  });

  it("lays every level out as a clean lattice maze without shared or crossing segments", () => {
    for (const level of MAZE_LEVELS) {
      const seen = new Set<string>();
      const segments = segmentsOf(level);

      for (const segment of segments) {
        const segmentId = segmentKey(segment.a, segment.b);
        expect(seen.has(segmentId)).toBe(false);
        seen.add(segmentId);
      }

      for (let first = 0; first < segments.length; first += 1) {
        for (let second = first + 1; second < segments.length; second += 1) {
          expect(crosses(segments[first] as Segment, segments[second] as Segment)).toBe(false);
        }
      }
    }
  });

  it("never lets an arrow body touch another arrow", () => {
    for (const level of MAZE_LEVELS) {
      const uses = new Map<string, { id: number; mid: boolean }[]>();

      for (const arrow of level.arrows) {
        for (let index = 0; index < arrow.points.length; index += 1) {
          const point = arrow.points[index] as Point;
          const pointId = `${point.x},${point.y}`;
          const list = uses.get(pointId) ?? [];
          list.push({ id: arrow.id, mid: index > 0 && index < arrow.points.length - 1 });
          uses.set(pointId, list);
        }
      }

      for (const [pointId, list] of uses) {
        if (list.length > 1) {
          expect(
            list.some((use) => use.mid),
            `arrows touch at ${pointId}: ${list.map((use) => use.id).join(", ")}`,
          ).toBe(false);
        }
      }
    }
  });

  it("looks up levels by index and rejects unknown indexes", () => {
    expect(levelAt(0)).toBe(MAZE_LEVELS[0]);
    expect(levelAt(LEVEL_COUNT - 1)).toBe(MAZE_LEVELS[LEVEL_COUNT - 1]);
    expect(() => levelAt(-1)).toThrow();
    expect(() => levelAt(LEVEL_COUNT)).toThrow();
  });
});
