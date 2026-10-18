import {
  MAZE_PADDING,
  type MazeArrow,
  type MazeDirection,
  type MazeLevel,
  type Point,
} from "./types";

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
 *
 * This is the single source of truth for removability: the level generator and
 * the game both use it, so a generated order is always valid in play.
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
