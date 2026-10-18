import { trimPolyline } from "@shared/lib";
import {
  MAZE_PADDING,
  type MazeArrow,
  type MazeDirection,
  type MazeLevel,
  type Point,
} from "./types";

/**
 * Visible gap between an arrow tail and anything it shares a lattice point with.
 * Drawing and hit-testing both use it, so a tap on an arrow's head can never
 * select the neighbour whose tail sits on that same point.
 */
const MAZE_ARROW_GAP = 0.2;

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

/** Heads that meet another head need a gap; all other heads sit on the end. */
function touchingHeadIds(level: MazeLevel): ReadonlySet<number> {
  const firstHeadAt = new Map<string, number>();
  const touching = new Set<number>();

  for (const arrow of level.arrows) {
    const head = arrowHead(arrow);
    const pointId = `${head.x},${head.y}`;
    const other = firstHeadAt.get(pointId);
    if (other === undefined) {
      firstHeadAt.set(pointId, arrow.id);
    } else {
      touching.add(other);
      touching.add(arrow.id);
    }
  }

  return touching;
}

function visiblePoints(arrow: MazeArrow, insetHead: boolean): Point[] {
  return trimPolyline(arrow.points, MAZE_ARROW_GAP, insetHead ? MAZE_ARROW_GAP : 0);
}

/**
 * The arrow exactly as the board draws it: trimmed at the tail gap and, when two
 * arrowheads meet, at the head gap too. Hit-testing uses the same polyline, so a
 * tap anywhere on a visible arrow always selects that arrow.
 */
export function visibleArrowPoints(level: MazeLevel, arrow: MazeArrow): Point[] {
  return visiblePoints(arrow, touchingHeadIds(level).has(arrow.id));
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
 * Merges consecutive collinear points into one segment. The level format stores
 * a point at every lattice cell, so a straight run would otherwise look like a
 * row of separate one-cell segments; a lane crossing the middle of that run
 * would then be mistaken for a harmless endpoint touch.
 */
function mergedSegments(points: readonly Point[]): { a: Point; b: Point }[] {
  const segments: { a: Point; b: Point }[] = [];

  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1] as Point;
    const b = points[index] as Point;
    const last = segments[segments.length - 1];
    if (last) {
      const previousDirection = {
        x: Math.sign(last.b.x - last.a.x),
        y: Math.sign(last.b.y - last.a.y),
      };
      const direction = { x: Math.sign(b.x - a.x), y: Math.sign(b.y - a.y) };
      if (previousDirection.x === direction.x && previousDirection.y === direction.y) {
        last.b = b;
        continue;
      }
    }
    segments.push({ a, b });
  }

  return segments;
}

/**
 * Does the escape lane cross a perpendicular segment? The segment is merged at
 * collinear joints, so a crossing at a lattice vertex inside a straight run is
 * interior. Endpoints count too: a corner or arrowhead is visible, and the
 * moving arrow must not pass through it.
 */
function crossesHorizontalLane(
  segment: { a: Point; b: Point },
  head: Point,
  stepX: number,
): boolean {
  const low = Math.min(segment.a.y, segment.b.y);
  const high = Math.max(segment.a.y, segment.b.y);
  const ahead = stepX > 0 ? segment.a.x > head.x : segment.a.x < head.x;
  return ahead && low <= head.y && head.y <= high;
}

function crossesVerticalLane(segment: { a: Point; b: Point }, head: Point, stepY: number): boolean {
  const low = Math.min(segment.a.x, segment.b.x);
  const high = Math.max(segment.a.x, segment.b.x);
  const ahead = stepY > 0 ? segment.a.y > head.y : segment.a.y < head.y;
  return ahead && low <= head.x && head.x <= high;
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
 * Does the lane hit a segment? The lane is the ray that leaves the head in the
 * arrow's direction. The other arrow's body slides along its own polyline, so
 * only the straight lane ahead of the tip is newly occupied.
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
 * head. A neighbour blocks the escape when its visible body crosses that lane.
 *
 * This is the single source of truth for removability: the level generator and
 * the game both use it, so a generated order is always valid in play.
 */
export function isArrowRemovable(
  arrow: MazeArrow,
  level: MazeLevel,
  removed: ReadonlySet<number>,
): boolean {
  const head = arrowHead(arrow);
  const step = DIRECTION_STEPS[arrowDirection(arrow)];

  for (const other of level.arrows) {
    if (other.id === arrow.id || removed.has(other.id)) {
      continue;
    }
    for (const segment of mergedSegments(other.points)) {
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
  const insetHeads = touchingHeadIds(level);

  for (const arrow of level.arrows) {
    if (removed.has(arrow.id)) {
      continue;
    }
    const points = visiblePoints(arrow, insetHeads.has(arrow.id));
    for (let index = 1; index < points.length; index += 1) {
      const distance = pointToSegmentDistance(
        point,
        points[index - 1] as Point,
        points[index] as Point,
      );
      if (distance <= bestDistance) {
        bestDistance = distance;
        best = arrow;
      }
    }
  }

  return best;
}
