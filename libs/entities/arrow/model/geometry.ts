import {
  MAZE_PADDING,
  type MazeArrow,
  type MazeDirection,
  type MazeLevel,
  type Point,
} from "./types";

const EPSILON = 0.001;

export function arrowHead(arrow: MazeArrow): Point {
  return arrow.points[arrow.points.length - 1] as Point;
}

export function arrowTail(arrow: MazeArrow): Point {
  return arrow.points[0] as Point;
}

export function directionBetween(from: Point, to: Point): MazeDirection {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (dx > 0) {
    return "right";
  }
  if (dx < 0) {
    return "left";
  }
  if (dy > 0) {
    return "down";
  }
  if (dy < 0) {
    return "up";
  }

  throw new Error("An arrow needs two different points");
}

export function arrowDirection(arrow: MazeArrow): MazeDirection {
  const points = arrow.points;
  if (points.length < 2) {
    throw new Error("An arrow needs at least two points");
  }
  return directionBetween(points[points.length - 2] as Point, points[points.length - 1] as Point);
}

export function arrowSegments(arrow: MazeArrow): { a: Point; b: Point }[] {
  return arrow.points.slice(1).map((point, index) => ({
    a: arrow.points[index] as Point,
    b: point,
  }));
}

export function levelBounds(level: MazeLevel): {
  minX: number;
  minY: number;
  width: number;
  height: number;
} {
  return {
    minX: -MAZE_PADDING,
    minY: -MAZE_PADDING,
    width: level.width + MAZE_PADDING * 2,
    height: level.height + MAZE_PADDING * 2,
  };
}

function intervalOverlap(
  firstLow: number,
  firstHigh: number,
  secondLow: number,
  secondHigh: number,
): boolean {
  return Math.min(firstHigh, secondHigh) > Math.max(firstLow, secondLow) + EPSILON;
}

function spansStrictly(value: number, low: number, high: number): boolean {
  return value > low + EPSILON && value < high - EPSILON;
}

/** Is the point beyond the moving range in the travel direction? */
function pointAhead(point: number, low: number, high: number, direction: number): boolean {
  return direction > 0 ? point > low + EPSILON : point < high - EPSILON;
}

/** Does the other range reach past the moving range in the travel direction? */
function overlapsAhead(
  movingLow: number,
  movingHigh: number,
  otherLow: number,
  otherHigh: number,
  direction: number,
): boolean {
  return direction > 0 ? otherHigh > movingLow + EPSILON : otherLow < movingHigh - EPSILON;
}

function xRange(segment: { a: Point; b: Point }): [number, number] {
  return [Math.min(segment.a.x, segment.b.x), Math.max(segment.a.x, segment.b.x)];
}

function yRange(segment: { a: Point; b: Point }): [number, number] {
  return [Math.min(segment.a.y, segment.b.y), Math.max(segment.a.y, segment.b.y)];
}

function horizontalParallelSweep(
  moving: { a: Point; b: Point },
  dx: number,
  dy: number,
  other: { a: Point; b: Point },
): boolean {
  if (other.a.y !== other.b.y) {
    return false;
  }
  const [movingLow, movingHigh] = xRange(moving);
  const [otherLow, otherHigh] = xRange(other);

  if (dx !== 0) {
    return (
      other.a.y === moving.a.y && overlapsAhead(movingLow, movingHigh, otherLow, otherHigh, dx)
    );
  }
  return (
    pointAhead(other.a.y, moving.a.y, moving.a.y, dy) &&
    intervalOverlap(movingLow, movingHigh, otherLow, otherHigh)
  );
}

function verticalParallelSweep(
  moving: { a: Point; b: Point },
  dx: number,
  dy: number,
  other: { a: Point; b: Point },
): boolean {
  if (other.a.x !== other.b.x) {
    return false;
  }
  const [movingLow, movingHigh] = yRange(moving);
  const [otherLow, otherHigh] = yRange(other);

  if (dy !== 0) {
    return (
      other.a.x === moving.a.x && overlapsAhead(movingLow, movingHigh, otherLow, otherHigh, dy)
    );
  }
  return (
    pointAhead(other.a.x, moving.a.x, moving.a.x, dx) &&
    intervalOverlap(movingLow, movingHigh, otherLow, otherHigh)
  );
}

function parallelSweepHits(
  moving: { a: Point; b: Point },
  dx: number,
  dy: number,
  other: { a: Point; b: Point },
): boolean {
  return moving.a.y === moving.b.y
    ? horizontalParallelSweep(moving, dx, dy, other)
    : verticalParallelSweep(moving, dx, dy, other);
}

function horizontalPerpendicularSweep(
  moving: { a: Point; b: Point },
  dx: number,
  dy: number,
  other: { a: Point; b: Point },
): boolean {
  const [movingLowX, movingHighX] = xRange(moving);
  const [otherLowY, otherHighY] = yRange(other);

  if (dx !== 0) {
    return (
      spansStrictly(moving.a.y, otherLowY, otherHighY) &&
      pointAhead(other.a.x, movingLowX, movingHighX, dx)
    );
  }
  return (
    spansStrictly(other.a.x, movingLowX, movingHighX) &&
    overlapsAhead(moving.a.y, moving.a.y, otherLowY, otherHighY, dy)
  );
}

function verticalPerpendicularSweep(
  moving: { a: Point; b: Point },
  dx: number,
  dy: number,
  other: { a: Point; b: Point },
): boolean {
  const [movingLowX, movingHighX] = xRange(moving);
  const [movingLowY, movingHighY] = yRange(moving);
  const [otherLowX, otherHighX] = xRange(other);

  if (dx !== 0) {
    return (
      spansStrictly(other.a.y, movingLowY, movingHighY) &&
      overlapsAhead(moving.a.x, moving.a.x, otherLowX, otherHighX, dx)
    );
  }
  return (
    spansStrictly(moving.a.x, otherLowX, otherHighX) &&
    pointAhead(other.a.y, movingLowY, movingHighY, dy)
  );
}

/** Does translating the moving segment in the escape direction hit the other segment? */
function sweepHitsSegment(
  moving: { a: Point; b: Point },
  dx: number,
  dy: number,
  other: { a: Point; b: Point },
): boolean {
  const movingHorizontal = moving.a.y === moving.b.y;
  const otherHorizontal = other.a.y === other.b.y;

  if (movingHorizontal === otherHorizontal) {
    return parallelSweepHits(moving, dx, dy, other);
  }
  return movingHorizontal
    ? horizontalPerpendicularSweep(moving, dx, dy, other)
    : verticalPerpendicularSweep(moving, dx, dy, other);
}

function boundsOf(points: readonly Point[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  return { minX, maxX, minY, maxY };
}

/** Cheap broad phase: can the moving body reach the other arrow at all? */
function mightMeet(
  body: ReturnType<typeof boundsOf>,
  dx: number,
  dy: number,
  other: ReturnType<typeof boundsOf>,
): boolean {
  if (dx !== 0) {
    if (body.minY > other.maxY || body.maxY < other.minY) {
      return false;
    }
    return dx > 0 ? other.maxX >= body.minX : other.minX <= body.maxX;
  }
  if (body.minX > other.maxX || body.maxX < other.minX) {
    return false;
  }
  return dy > 0 ? other.maxY >= body.minY : other.minY <= body.maxY;
}

function bodyHitsArrow(arrow: MazeArrow, other: MazeArrow, dx: number, dy: number): boolean {
  for (const moving of arrowSegments(arrow)) {
    for (const segment of arrowSegments(other)) {
      if (sweepHitsSegment(moving, dx, dy, segment)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Conservative check used by the level builder (see `contour.ts`): the arrow is
 * modelled as a rigid shape that slides straight in its escape direction, so a
 * bent tail can sweep sideways through neighbours. It is stricter than the
 * runtime rule in `isArrowRemovable`, which keeps the generated layouts stable
 * while still guaranteeing they are solvable.
 */
export function isArrowRemovableRigid(
  arrow: MazeArrow,
  level: MazeLevel,
  removed: ReadonlySet<number>,
): boolean {
  const direction = arrowDirection(arrow);
  const dx = direction === "right" ? 1 : direction === "left" ? -1 : 0;
  const dy = direction === "down" ? 1 : direction === "up" ? -1 : 0;
  const body = boundsOf(arrow.points);

  for (const other of level.arrows) {
    if (other.id === arrow.id || removed.has(other.id)) {
      continue;
    }
    if (mightMeet(body, dx, dy, boundsOf(other.points)) && bodyHitsArrow(arrow, other, dx, dy)) {
      return false;
    }
  }

  return true;
}

const DIRECTION_STEPS: Record<MazeDirection, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/**
 * Does the escape lane cross this perpendicular segment? The segment's fixed
 * coordinate must sit strictly ahead of the head and the head's cross
 * coordinate must sit strictly inside the segment, so a tip that only grazes
 * the lane does not block.
 */
function crossesHorizontalLane(
  segment: { a: Point; b: Point },
  head: Point,
  stepX: number,
): boolean {
  const low = Math.min(segment.a.y, segment.b.y);
  const high = Math.max(segment.a.y, segment.b.y);
  const ahead = stepX > 0 ? segment.a.x > head.x : segment.a.x < head.x;
  return ahead && low < head.y && head.y < high;
}

function crossesVerticalLane(segment: { a: Point; b: Point }, head: Point, stepY: number): boolean {
  const low = Math.min(segment.a.x, segment.b.x);
  const high = Math.max(segment.a.x, segment.b.x);
  const ahead = stepY > 0 ? segment.a.y > head.y : segment.a.y < head.y;
  return ahead && low < head.x && head.x < high;
}

/** Does this segment lie collinear with the lane and reach past the head? */
function liesInHorizontalLane(
  segment: { a: Point; b: Point },
  head: Point,
  stepX: number,
): boolean {
  const low = Math.min(segment.a.x, segment.b.x);
  const high = Math.max(segment.a.x, segment.b.x);
  return segment.a.y === head.y && (stepX > 0 ? high > head.x : low < head.x);
}

function liesInVerticalLane(segment: { a: Point; b: Point }, head: Point, stepY: number): boolean {
  const low = Math.min(segment.a.y, segment.b.y);
  const high = Math.max(segment.a.y, segment.b.y);
  return segment.a.x === head.x && (stepY > 0 ? high > head.y : low < head.y);
}

/**
 * Does the segment lie in the escape lane: the ray that leaves the head in the
 * arrow's direction? The body slides along its own polyline and out through the
 * tip, so the only cells the arrow newly occupies are ahead of the head.
 */
function laneHitsSegment(segment: { a: Point; b: Point }, head: Point, step: Point): boolean {
  if (step.x !== 0) {
    return segment.a.x === segment.b.x
      ? crossesHorizontalLane(segment, head, step.x)
      : liesInHorizontalLane(segment, head, step.x);
  }
  return segment.a.y === segment.b.y
    ? crossesVerticalLane(segment, head, step.y)
    : liesInVerticalLane(segment, head, step.y);
}

/**
 * An arrow flies out like a snake: its body runs along its own polyline and out
 * through the tip, so it only newly occupies the straight lane ahead of the
 * head. A neighbour blocks the escape only when it crosses that lane.
 */
export function isArrowRemovable(
  arrow: MazeArrow,
  level: MazeLevel,
  removed: ReadonlySet<number>,
): boolean {
  const step = DIRECTION_STEPS[arrowDirection(arrow)];
  const head = arrowHead(arrow);

  for (const other of level.arrows) {
    if (other.id === arrow.id || removed.has(other.id)) {
      continue;
    }
    for (const segment of arrowSegments(other)) {
      if (laneHitsSegment(segment, head, step)) {
        return false;
      }
    }
  }

  return true;
}

export function removableArrows(level: MazeLevel, removed: ReadonlySet<number>): MazeArrow[] {
  return level.arrows.filter(
    (arrow) => !removed.has(arrow.id) && isArrowRemovable(arrow, level, removed),
  );
}

export function findHint(level: MazeLevel, removed: ReadonlySet<number>): MazeArrow | null {
  return removableArrows(level, removed)[0] ?? null;
}

export function isSolved(level: MazeLevel, removed: ReadonlySet<number>): boolean {
  return level.arrows.every((arrow) => removed.has(arrow.id));
}

/**
 * Removing an arrow can only free other arrows, never block them. A greedy
 * pass is therefore a complete solver: if no arrow is removable while arrows
 * remain, the level is unsolvable.
 */
export function solveMaze(level: MazeLevel): number[] | null {
  const removed = new Set<number>();
  const order: number[] = [];

  while (order.length < level.arrows.length) {
    const next = findHint(level, removed);
    if (!next) {
      return null;
    }
    removed.add(next.id);
    order.push(next.id);
  }

  return order;
}

function pointToSegmentDistance(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return Math.hypot(point.x - a.x, point.y - a.y);
  }
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

/** Finds the arrow nearest to a tap, independent of overlapping SVG hit areas. */
export function nearestArrow(
  level: MazeLevel,
  removed: ReadonlySet<number>,
  point: Point,
  maxDistance: number,
): MazeArrow | null {
  let best: MazeArrow | null = null;
  let bestDistance = maxDistance;

  for (const arrow of level.arrows) {
    if (removed.has(arrow.id)) {
      continue;
    }
    for (const segment of arrowSegments(arrow)) {
      const distance = pointToSegmentDistance(point, segment.a, segment.b);
      if (distance <= bestDistance) {
        bestDistance = distance;
        best = arrow;
      }
    }
  }

  return best;
}
