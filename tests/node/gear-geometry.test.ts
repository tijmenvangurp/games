import { describe, expect, it } from "vitest";
import {
  beltTangentRuns,
  boardViewBox,
  connectionLength,
  gearPath,
  gearRadius,
  gearTeeth,
  holeCenter,
  levelAt,
  type BeltRun,
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

function segmentLength(run: BeltRun): number {
  return Math.hypot(run.to.x - run.from.x, run.to.y - run.from.y);
}

function rimError(point: PathPoint, center: PathPoint, radius: number): number {
  return Math.abs(Math.hypot(point.x - center.x, point.y - center.y) - radius);
}

function segmentsCross(a: BeltRun, b: BeltRun): boolean {
  const side = (p: PathPoint, q: PathPoint, r: PathPoint): number =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return (
    side(a.from, a.to, b.from) * side(a.from, a.to, b.to) < 0 &&
    side(b.from, b.to, a.from) * side(b.from, b.to, a.to) < 0
  );
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
    expect(boardViewBox(levelAt(3))).toBe("-76 -76 320 264");
  });

  it("maps hole ids to board coordinates", () => {
    expect(holeCenter(levelAt(0), "0,2")).toEqual({ x: 0, y: 56 });
    expect(holeCenter(levelAt(0), "4,2")).toEqual({ x: 112, y: 56 });
    expect(() => holeCenter(levelAt(0), "9,9")).toThrow("Unknown hole");
  });
});

describe("belt runs", () => {
  const from = { x: 0, y: 0 };
  const to = { x: 140, y: 42 };
  const fromRadius = gearRadius(1);
  const toRadius = gearRadius(2);

  function expectRunOnRims(run: BeltRun): void {
    expect(rimError(run.from, from, fromRadius)).toBeLessThan(1e-9);
    expect(rimError(run.to, to, toRadius)).toBeLessThan(1e-9);
    // Een raaklijn staat bij het raakpunt loodrecht op de straal.
    const direction = { x: run.to.x - run.from.x, y: run.to.y - run.from.y };
    const radial = { x: run.from.x - from.x, y: run.from.y - from.y };
    const projection =
      (direction.x * radial.x + direction.y * radial.y) / Math.hypot(direction.x, direction.y);
    expect(projection).toBeCloseTo(0, 9);
  }

  it("puts two separate open belt runs on the rims", () => {
    const runs = beltTangentRuns(from, fromRadius, to, toRadius);
    const [first, second] = runs;

    expect(runs).toHaveLength(2);
    for (const run of runs) {
      expectRunOnRims(run);
    }
    expect(first).not.toEqual(second);
    expect(segmentLength(first)).toBeCloseTo(segmentLength(second), 9);
    expect(segmentLength(first)).toBeGreaterThan(0);
    expect(segmentsCross(first, second)).toBe(false);
  });

  it("crosses the two runs for a crossed belt", () => {
    const open = beltTangentRuns(from, fromRadius, to, toRadius, 0);
    const crossed = beltTangentRuns(from, fromRadius, to, toRadius, 1);
    const [first, second] = crossed;

    for (const run of crossed) {
      expectRunOnRims(run);
    }
    expect(first).not.toEqual(open[0]);
    expect(second).not.toEqual(open[1]);
    expect(segmentsCross(first, second)).toBe(true);
    expect(segmentsCross(open[0], open[1])).toBe(false);
  });

  it("treats a missing crossing as an open belt", () => {
    expect(beltTangentRuns(from, fromRadius, to, toRadius)).toEqual(
      beltTangentRuns(from, fromRadius, to, toRadius, 0),
    );
  });
});

describe("connection length", () => {
  it("counts both rims and both runs of the open belt and the chain", () => {
    const from = { x: 0, y: 0 };
    const to = { x: 140, y: 0 };
    const radius = gearRadius(1);

    // Gelijke poelies: twee halve cirkels op de steekcirkel plus twee rechte banden.
    expect(connectionLength("open-belt", from, radius, to, radius)).toBeCloseTo(
      2 * Math.PI * radius + 2 * 140,
      6,
    );
    expect(connectionLength("chain", from, radius, to, radius)).toBeCloseTo(
      2 * Math.PI * radius + 2 * 140,
      6,
    );
  });

  it("stays longer than the centre distance for every kind", () => {
    const from = { x: 0, y: 0 };
    const to = { x: 140, y: 42 };
    const distance = Math.hypot(to.x - from.x, to.y - from.y);

    for (const kind of ["open-belt", "crossed-belt", "chain"] as const) {
      expect(connectionLength(kind, from, 28, to, 56)).toBeGreaterThan(distance);
    }
    // Alles ligt nu op de steekcirkel, dus de open band en de ketting zijn gelijk.
    expect(connectionLength("chain", from, 28, to, 56)).toBeCloseTo(
      connectionLength("open-belt", from, 28, to, 56),
      9,
    );
  });

  it("gives the same length when the pulleys are swapped", () => {
    const from = { x: 0, y: 0 };
    const to = { x: 140, y: 42 };

    for (const kind of ["open-belt", "crossed-belt", "chain"] as const) {
      expect(connectionLength(kind, from, 28, to, 56)).toBeCloseTo(
        connectionLength(kind, to, 56, from, 28),
        6,
      );
    }
  });
});
