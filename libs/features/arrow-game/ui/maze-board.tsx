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

/** Visual gap between an arrow end and any arrow it shares a lattice point with. */
const ARROW_INSET = 0.2;

function segmentLength(from: Point, to: Point): number {
  return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
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
 * Shortens an arrow at both ends so arrows that meet on the same lattice point
 * stay visibly separate. The underlying level keeps its exact grid geometry.
 */
function insetPolyline(points: readonly Point[], inset: number): Point[] {
  if (points.length < 2) {
    return [...points];
  }
  const total = points
    .slice(1)
    .reduce((sum, point, index) => sum + segmentLength(points[index] as Point, point), 0);
  if (total <= inset * 2) {
    return [...points];
  }

  const startDistance = inset;
  const endDistance = total - inset;
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

function headAttribute(head: Point, direction: MazeDirection): string {
  const dx = direction === "right" ? 1 : direction === "left" ? -1 : 0;
  const dy = direction === "down" ? 1 : direction === "up" ? -1 : 0;
  const base = { x: head.x - dx * 0.55, y: head.y - dy * 0.55 };
  const px = -dy;
  const py = dx;
  const first = { x: base.x + px * 0.25, y: base.y + py * 0.25 };
  const second = { x: base.x - px * 0.25, y: base.y - py * 0.25 };
  return `${head.x},${head.y} ${first.x},${first.y} ${second.x},${second.y}`;
}

function ArrowShape({ arrow }: { arrow: MazeArrow }) {
  const points = insetPolyline(arrow.points, ARROW_INSET);
  const head = points[points.length - 1] as Point;
  const before = points[points.length - 2] ?? head;
  const direction =
    before.x === head.x && before.y === head.y
      ? arrowDirection(arrow)
      : directionBetween(before, head);

  return (
    <>
      <polyline
        className="maze-line"
        fill="none"
        points={pointsAttribute(points)}
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
  hintId: number | null;
  blockedId: number | null;
  disabled: boolean;
  onTap: (id: number) => void;
}

function MazeArrowNode({ arrow, hintId, blockedId, disabled, onTap }: MazeArrowNodeProps) {
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
      <ArrowShape arrow={arrow} />
    </g>
  );
}

function MazeFlying({ flying, onFlyingEnd }: { flying: FlyingArrow; onFlyingEnd: () => void }) {
  return (
    <g
      key={flying.key}
      className="maze-flying"
      data-direction={flying.direction}
      pointerEvents="none"
      onAnimationEnd={onFlyingEnd}
    >
      <ArrowShape arrow={flying.arrow} />
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
            hintId={hintId}
            onTap={onTap}
          />
        ),
      )}

      {flying ? <MazeFlying flying={flying} onFlyingEnd={onFlyingEnd} /> : null}
    </svg>
  );
}
