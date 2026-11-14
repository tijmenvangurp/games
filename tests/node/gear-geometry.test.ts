import { describe, expect, it } from "vitest";
import {
  boardViewBox,
  gearPath,
  gearRadius,
  gearTeeth,
  holeCenter,
  levelAt,
  type GearSize,
} from "@entities/gear";

interface PathPoint {
  x: number;
  y: number;
}

const SIZES: readonly GearSize[] = [1, 2, 3];

function pathPoints(path: string): PathPoint[] {
  const matches = path.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g);
  return [...matches].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
  }));
}

function radialRunCount(points: readonly PathPoint[], threshold: number): number {
  let runs = 0;
  let inside = false;
  for (const point of points) {
    const high = Math.hypot(point.x, point.y) > threshold;
    if (high && !inside) {
      runs += 1;
    }
    inside = high;
  }
  return runs;
}

describe("gear geometry", () => {
  it("uses the pegboard pitch radii and tooth counts", () => {
    expect(SIZES.map(gearRadius)).toEqual([28, 56, 84]);
    expect(SIZES.map(gearTeeth)).toEqual([14, 28, 42]);
  });

  it("builds a closed, finite involute outline with one tip per tooth", () => {
    for (const size of SIZES) {
      const path = gearPath(size);
      const pitchRadius = gearRadius(size);
      const points = pathPoints(path);
      const radii = points.map((point) => Math.hypot(point.x, point.y));

      expect(path.startsWith("M ")).toBe(true);
      expect(path.endsWith(" Z")).toBe(true);
      expect(path).not.toMatch(/NaN|Infinity/);
      expect(points.length).toBeGreaterThan(gearTeeth(size) * 8);
      expect(Math.min(...radii)).toBeCloseTo(pitchRadius - 5, 1);
      expect(Math.max(...radii)).toBeCloseTo(pitchRadius + 4, 1);
      expect(radialRunCount(points, pitchRadius + 2)).toBe(gearTeeth(size));
    }
  });

  it("puts tooth 0 on the local +x axis and memoizes the path", () => {
    for (const size of SIZES) {
      const points = pathPoints(gearPath(size));
      const pitchRadius = gearRadius(size);
      expect(points.some((point) => Math.abs(point.y) < 0.01 && point.x > pitchRadius + 3)).toBe(
        true,
      );
      expect(gearPath(size)).toBe(gearPath(size));
    }
  });

  it("reserves room for the largest gear and its output glyph", () => {
    expect(boardViewBox(levelAt(0))).toBe("-76 -76 264 264");
    expect(boardViewBox(levelAt(3))).toBe("-76 -76 348 264");
  });

  it("maps hole ids to board coordinates", () => {
    expect(holeCenter(levelAt(0), "0,2")).toEqual({ x: 0, y: 56 });
    expect(holeCenter(levelAt(0), "4,2")).toEqual({ x: 112, y: 56 });
    expect(() => holeCenter(levelAt(0), "9,9")).toThrow("Unknown hole");
  });
});
