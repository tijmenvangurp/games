import {
  MAZE_PADDING,
  type MazeArrow,
  type MazeDirection,
  type MazeLevel,
  type Point,
} from "./types";

const EPSILON = 0.001;

interface Box {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

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

function segmentBox(segment: { a: Point; b: Point }): Box {
  return {
    minX: Math.min(segment.a.x, segment.b.x),
    maxX: Math.max(segment.a.x, segment.b.x),
    minY: Math.min(segment.a.y, segment.b.y),
    maxY: Math.max(segment.a.y, segment.b.y),
  };
}

function rayBox(head: Point, direction: MazeDirection, level: MazeLevel): Box {
  const minX = -MAZE_PADDING;
  const minY = -MAZE_PADDING;
  const maxX = level.width + MAZE_PADDING;
  const maxY = level.height + MAZE_PADDING;
  const startX = head.x + (direction === "right" ? EPSILON : direction === "left" ? -EPSILON : 0);
  const startY = head.y + (direction === "down" ? EPSILON : direction === "up" ? -EPSILON : 0);
  const endX = direction === "right" ? maxX : direction === "left" ? minX : startX;
  const endY = direction === "down" ? maxY : direction === "up" ? minY : startY;

  return {
    minX: Math.min(startX, endX),
    maxX: Math.max(startX, endX),
    minY: Math.min(startY, endY),
    maxY: Math.max(startY, endY),
  };
}

function boxesOverlap(first: Box, second: Box): boolean {
  return (
    first.maxX >= second.minX &&
    first.minX <= second.maxX &&
    first.maxY >= second.minY &&
    first.minY <= second.maxY
  );
}

/** All segments in a level are axis-aligned, so two boxes overlap exactly when the segments cross. */
function hitsAxisAlignedRay(
  head: Point,
  direction: MazeDirection,
  segment: { a: Point; b: Point },
  level: MazeLevel,
): boolean {
  return boxesOverlap(segmentBox(segment), rayBox(head, direction, level));
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
      if (hitsAxisAlignedRay(head, direction, segment, level)) {
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
