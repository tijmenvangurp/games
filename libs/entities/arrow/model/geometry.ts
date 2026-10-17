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

/** Is a coordinate strictly in front of the head on this axis? */
function isAhead(head: number, coordinate: number, forward: number): boolean {
  return forward > 0 ? coordinate > head + EPSILON : coordinate < head - EPSILON;
}

/** Does any part of the segment's extent lie strictly in front of the head? */
function extendsAhead(head: number, low: number, high: number, forward: number): boolean {
  return forward > 0 ? high > head + EPSILON : low < head - EPSILON;
}

function spans(value: number, low: number, high: number): boolean {
  return value > low && value < high;
}

function blocksHorizontalRay(
  head: Point,
  forward: number,
  segment: { a: Point; b: Point },
): boolean {
  const lowY = Math.min(segment.a.y, segment.b.y);
  const highY = Math.max(segment.a.y, segment.b.y);

  if (segment.a.y !== segment.b.y) {
    return isAhead(head.x, segment.a.x, forward) && spans(head.y, lowY, highY);
  }
  if (segment.a.y !== head.y) {
    return false;
  }
  const lowX = Math.min(segment.a.x, segment.b.x);
  const highX = Math.max(segment.a.x, segment.b.x);
  return extendsAhead(head.x, lowX, highX, forward);
}

function blocksVerticalRay(head: Point, forward: number, segment: { a: Point; b: Point }): boolean {
  const lowX = Math.min(segment.a.x, segment.b.x);
  const highX = Math.max(segment.a.x, segment.b.x);

  if (segment.a.x !== segment.b.x) {
    return isAhead(head.y, segment.a.y, forward) && spans(head.x, lowX, highX);
  }
  if (segment.a.x !== head.x) {
    return false;
  }
  const lowY = Math.min(segment.a.y, segment.b.y);
  const highY = Math.max(segment.a.y, segment.b.y);
  return extendsAhead(head.y, lowY, highY, forward);
}

/**
 * An axis-aligned segment blocks a ray when it crosses the lane in front of the
 * head. Grazing a corner counts as free: arrows in these mazes touch each other
 * end to end and at right angles all the time, and only a real obstruction on
 * the lane should cost a heart. A collinear segment that starts anywhere in
 * front of the head does block, because the arrow would hit it.
 */
function blocksRay(
  head: Point,
  direction: MazeDirection,
  segment: { a: Point; b: Point },
): boolean {
  const forward = direction === "left" || direction === "up" ? -1 : 1;
  const horizontal = direction === "left" || direction === "right";
  return horizontal
    ? blocksHorizontalRay(head, forward, segment)
    : blocksVerticalRay(head, forward, segment);
}

export function isArrowRemovable(
  arrow: MazeArrow,
  level: MazeLevel,
  removed: ReadonlySet<number>,
): boolean {
  const head = arrowHead(arrow);
  const direction = arrowDirection(arrow);

  for (const other of level.arrows) {
    if (other.id === arrow.id || removed.has(other.id)) {
      continue;
    }
    for (const segment of arrowSegments(other)) {
      if (blocksRay(head, direction, segment)) {
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
