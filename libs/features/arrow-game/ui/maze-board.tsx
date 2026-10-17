import { useRef, type PointerEvent, type RefObject } from "react";
import {
  arrowDirection,
  directionBetween,
  levelBounds,
  nearestArrow,
  type MazeArrow,
  type MazeDirection,
  type MazeLevel,
  type Point,
} from "@entities/arrow";
import type { FlyingArrow } from "../model/use-maze-actions";

const DIRECTION_LABELS: Record<MazeDirection, string> = {
  up: "boven",
  right: "rechts",
  down: "beneden",
  left: "links",
};

interface MazeBoardProps {
  level: MazeLevel;
  removedIds: readonly number[];
  hintId: number | null;
  blockedId: number | null;
  flying: FlyingArrow | null;
  disabled: boolean;
  onTap: (id: number) => void;
  onFlyingEnd: () => void;
}

function pointsAttribute(points: readonly Point[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

/** Visual gap between an arrow tail and anything it shares a lattice point with. */
const ARROW_INSET = 0.2;
const HEAD_LENGTH = 0.55;
const HEAD_HALF_WIDTH = 0.25;
const HEAD_OVERLAP = 0.05;

function segmentLength(from: Point, to: Point): number {
  return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
}

function polylineLength(points: readonly Point[]): number {
  return points
    .slice(1)
    .reduce((sum, point, index) => sum + segmentLength(points[index] as Point, point), 0);
}

function pointAlong(points: readonly Point[], distance: number): Point {
  let remaining = distance;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1] as Point;
    const to = points[index] as Point;
    const length = segmentLength(from, to);
    if (length === 0) {
      continue;
    }
    if (remaining <= length) {
      const ratio = remaining / length;
      return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio };
    }
    remaining -= length;
  }
  return points[points.length - 1] as Point;
}

/**
 * Trims an arrow at both ends. The tail gets a visible gap; the head end is
 * trimmed to the base of the arrowhead so the rounded stroke can never poke
 * through the tip.
 */
function trimPolyline(points: readonly Point[], startInset: number, endInset: number): Point[] {
  if (points.length < 2) {
    return [...points];
  }
  const total = polylineLength(points);
  const startDistance = Math.min(startInset, total);
  const endDistance = Math.max(startDistance, total - endInset);
  const result: Point[] = [pointAlong(points, startDistance)];
  let travelled = 0;

  for (let index = 1; index < points.length; index += 1) {
    travelled += segmentLength(points[index - 1] as Point, points[index] as Point);
    if (travelled > startDistance && travelled < endDistance) {
      result.push(points[index] as Point);
    }
  }

  result.push(pointAlong(points, endDistance));
  return result;
}

/** Heads that meet another head need a gap; all other heads sit on the end. */
function arrowsWithTouchingHeads(level: MazeLevel): ReadonlySet<number> {
  const firstHeadAt = new Map<string, number>();
  const touching = new Set<number>();

  for (const arrow of level.arrows) {
    const head = arrow.points[arrow.points.length - 1] as Point;
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

function headAttribute(head: Point, direction: MazeDirection): string {
  const dx = direction === "right" ? 1 : direction === "left" ? -1 : 0;
  const dy = direction === "down" ? 1 : direction === "up" ? -1 : 0;
  const base = { x: head.x - dx * HEAD_LENGTH, y: head.y - dy * HEAD_LENGTH };
  const px = -dy;
  const py = dx;
  const first = { x: base.x + px * HEAD_HALF_WIDTH, y: base.y + py * HEAD_HALF_WIDTH };
  const second = { x: base.x - px * HEAD_HALF_WIDTH, y: base.y - py * HEAD_HALF_WIDTH };
  return `${head.x},${head.y} ${first.x},${first.y} ${second.x},${second.y}`;
}

function ArrowShape({ arrow, headInset }: { arrow: MazeArrow; headInset: number }) {
  const total = polylineLength(arrow.points);
  const head = pointAlong(arrow.points, total - headInset);
  const base = pointAlong(arrow.points, Math.max(0, total - headInset - HEAD_LENGTH));
  const direction =
    base.x === head.x && base.y === head.y ? arrowDirection(arrow) : directionBetween(base, head);
  const line = trimPolyline(arrow.points, ARROW_INSET, headInset + HEAD_LENGTH - HEAD_OVERLAP);

  return (
    <>
      <polyline
        className="maze-line"
        fill="none"
        points={pointsAttribute(line)}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.16}
      />
      <polygon className="maze-head" fill="currentColor" points={headAttribute(head, direction)} />
    </>
  );
}

function MazeDots({ level }: { level: MazeLevel }) {
  const bounds = levelBounds(level);
  return (
    <>
      <defs>
        <pattern
          height="1"
          id={`maze-dots-${level.id}`}
          patternTransform="translate(-0.5 -0.5)"
          patternUnits="userSpaceOnUse"
          width="1"
        >
          <circle cx="0.5" cy="0.5" fill="#d8d8e8" r="0.06" />
        </pattern>
      </defs>
      <rect
        fill={`url(#maze-dots-${level.id})`}
        height={bounds.height}
        width={bounds.width}
        x={bounds.minX}
        y={bounds.minY}
      />
    </>
  );
}

interface MazeArrowNodeProps {
  arrow: MazeArrow;
  headInset: boolean;
  hintId: number | null;
  blockedId: number | null;
  disabled: boolean;
  onTap: (id: number) => void;
}

function MazeArrowNode({
  arrow,
  headInset,
  hintId,
  blockedId,
  disabled,
  onTap,
}: MazeArrowNodeProps) {
  return (
    <g
      aria-label={`Pijl naar ${DIRECTION_LABELS[arrowDirection(arrow)]}`}
      className="maze-arrow"
      data-blocked={blockedId === arrow.id || undefined}
      data-hint={hintId === arrow.id || undefined}
      data-maze-arrow-id={arrow.id}
      pointerEvents="none"
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => onTap(arrow.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onTap(arrow.id);
        }
      }}
    >
      <polyline
        className="maze-focus"
        fill="none"
        points={pointsAttribute(arrow.points)}
        stroke="transparent"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.38}
      />
      <ArrowShape arrow={arrow} headInset={headInset ? ARROW_INSET : 0} />
    </g>
  );
}

function MazeFlying({
  flying,
  headInset,
  onFlyingEnd,
}: {
  flying: FlyingArrow;
  headInset: boolean;
  onFlyingEnd: () => void;
}) {
  return (
    <g
      key={flying.key}
      className="maze-flying"
      data-direction={flying.direction}
      pointerEvents="none"
      onAnimationEnd={onFlyingEnd}
    >
      <ArrowShape arrow={flying.arrow} headInset={headInset ? ARROW_INSET : 0} />
    </g>
  );
}

function useMazePointer(
  level: MazeLevel,
  removed: ReadonlySet<number>,
  disabled: boolean,
  onTap: (id: number) => void,
): {
  ref: RefObject<SVGSVGElement | null>;
  onPointerDown: (event: PointerEvent<SVGSVGElement>) => void;
} {
  const ref = useRef<SVGSVGElement>(null);
  const bounds = levelBounds(level);

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (disabled || !ref.current) {
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    const point = {
      x: bounds.minX + ((event.clientX - rect.left) / rect.width) * bounds.width,
      y: bounds.minY + ((event.clientY - rect.top) / rect.height) * bounds.height,
    };
    const arrow = nearestArrow(level, removed, point, 1.35);
    if (arrow) {
      onTap(arrow.id);
    }
  };

  return { ref, onPointerDown };
}

export function MazeBoard({
  level,
  removedIds,
  hintId,
  blockedId,
  flying,
  disabled,
  onTap,
  onFlyingEnd,
}: MazeBoardProps) {
  const bounds = levelBounds(level);
  const removed = new Set(removedIds);
  const insetHeads = arrowsWithTouchingHeads(level);
  const { ref, onPointerDown } = useMazePointer(level, removed, disabled, onTap);

  return (
    <svg
      ref={ref}
      aria-label={`${level.name}: pijlenpuzzel`}
      className="block w-full touch-manipulation select-none"
      role="group"
      viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
      onPointerDown={onPointerDown}
    >
      <MazeDots level={level} />

      {level.arrows.map((arrow) =>
        removed.has(arrow.id) ? null : (
          <MazeArrowNode
            key={arrow.id}
            arrow={arrow}
            blockedId={blockedId}
            disabled={disabled}
            headInset={insetHeads.has(arrow.id)}
            hintId={hintId}
            onTap={onTap}
          />
        ),
      )}

      {flying ? (
        <MazeFlying
          flying={flying}
          headInset={insetHeads.has(flying.arrow.id)}
          onFlyingEnd={onFlyingEnd}
        />
      ) : null}
    </svg>
  );
}
