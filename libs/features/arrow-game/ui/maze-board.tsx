import { useRef, type CSSProperties, type PointerEvent, type RefObject } from "react";
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

/** Duration of a flight in milliseconds; keep in sync with `--maze-flight` in the stylesheet. */
const FLIGHT_MS = 380;

/** Every integer lattice point an arrow occupies, from tail to head. */
function trailPoints(points: readonly Point[]): Point[] {
  if (points.length === 0) {
    return [];
  }
  const dots: Point[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index] as Point;
    const to = points[index + 1] as Point;
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    const steps = Math.max(1, Math.round(Math.abs(to.x - from.x) + Math.abs(to.y - from.y)));
    for (let step = 0; step < steps; step += 1) {
      dots.push({ x: from.x + dx * step, y: from.y + dy * step });
    }
  }
  dots.push(points[points.length - 1] as Point);
  return dots;
}

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
          <circle cx="0.5" cy="0.5" fill="#e4e4f0" r="0.055" />
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

/**
 * Dots that light up on the lattice points an arrow vacates. The delay follows
 * the flight: each dot fades in just as the departing body uncovers it, so the
 * path reads as a trail instead of a block of dots appearing at once.
 */
function MazeTrail({
  level,
  removed,
  insetHeads,
}: {
  level: MazeLevel;
  removed: ReadonlySet<number>;
  insetHeads: ReadonlySet<number>;
}) {
  const bounds = levelBounds(level);
  return (
    <>
      {level.arrows.map((arrow) => {
        if (!removed.has(arrow.id)) {
          return null;
        }
        const { travel } = flyingGeometry(arrow, bounds, insetHeads.has(arrow.id));
        return (
          <g key={`${level.id}:${arrow.id}`}>
            {trailPoints(arrow.points).map((point, index) => (
              <circle
                key={index}
                className="maze-trail-dot"
                cx={point.x}
                cy={point.y}
                r={0.11}
                style={
                  {
                    "--maze-dot-delay": `${Math.min(1, index / travel) * FLIGHT_MS}ms`,
                  } as CSSProperties
                }
              />
            ))}
          </g>
        );
      })}
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

type BoardBounds = ReturnType<typeof levelBounds>;

/** Extra distance past the board edge so the tail is fully gone when the flight ends. */
const FLY_CLEARANCE = 1;

interface FlyingGeometry {
  /** Body polyline extended by the escape ray; the visible dash travels along it. */
  track: Point[];
  bodyLength: number;
  trackLength: number;
  travel: number;
  dx: number;
  dy: number;
  head: Point;
  direction: MazeDirection;
}

/**
 * A flying arrow does not glide out as one rigid shape. Instead its body runs
 * along its own polyline and out through the tip, like a snake leaving a
 * burrow: the tail weaves through every bend while the head slides straight
 * ahead. The window below is the slice of the extended track that stays visible.
 */
function flyingGeometry(arrow: MazeArrow, bounds: BoardBounds, headInset: boolean): FlyingGeometry {
  const body = trimPolyline(arrow.points, ARROW_INSET, 0);
  const bodyLength = polylineLength(body);
  const direction = arrowDirection(arrow);
  const tip = body[body.length - 1] as Point;
  const head = pointAlong(body, bodyLength - (headInset ? ARROW_INSET : 0));
  const margin =
    (direction === "right"
      ? bounds.minX + bounds.width - tip.x
      : direction === "left"
        ? tip.x - bounds.minX
        : direction === "down"
          ? bounds.minY + bounds.height - tip.y
          : tip.y - bounds.minY) + FLY_CLEARANCE;
  const travel = bodyLength + margin;
  const dx = direction === "right" ? travel : direction === "left" ? -travel : 0;
  const dy = direction === "down" ? travel : direction === "up" ? -travel : 0;

  return {
    track: [...body, { x: tip.x + dx, y: tip.y + dy }],
    bodyLength,
    trackLength: bodyLength + travel,
    travel,
    dx,
    dy,
    head,
    direction,
  };
}

function FlyingArrowShape({
  arrow,
  bounds,
  headInset,
}: {
  arrow: MazeArrow;
  bounds: BoardBounds;
  headInset: boolean;
}) {
  const geometry = flyingGeometry(arrow, bounds, headInset);

  return (
    <>
      <polyline
        className="maze-line maze-snake-body"
        fill="none"
        points={pointsAttribute(geometry.track)}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.16}
        style={
          {
            "--maze-window": `${geometry.bodyLength}px`,
            "--maze-track": `${geometry.trackLength}px`,
            "--maze-travel": `${-geometry.travel}px`,
          } as CSSProperties
        }
      />
      <g
        className="maze-snake-head"
        style={
          {
            "--maze-dx": `${geometry.dx}px`,
            "--maze-dy": `${geometry.dy}px`,
          } as CSSProperties
        }
      >
        <polygon
          className="maze-head"
          fill="currentColor"
          points={headAttribute(geometry.head, geometry.direction)}
        />
      </g>
    </>
  );
}

function MazeFlying({
  flying,
  bounds,
  headInset,
  onFlyingEnd,
}: {
  flying: FlyingArrow;
  bounds: BoardBounds;
  headInset: boolean;
  onFlyingEnd: () => void;
}) {
  return (
    <g
      key={flying.key}
      className="maze-flying"
      data-direction={flying.direction}
      pointerEvents="none"
      style={{ "--maze-flight": `${FLIGHT_MS}ms` } as CSSProperties}
      onAnimationEnd={onFlyingEnd}
    >
      <FlyingArrowShape arrow={flying.arrow} bounds={bounds} headInset={headInset} />
    </g>
  );
}

interface PendingTap {
  pointerId: number;
  clientX: number;
  clientY: number;
}

/** Movement (in screen px) beyond which a gesture is a drag/scroll, not a tap. */
const TAP_SLOP_PX = 10;

function useMazePointer(
  level: MazeLevel,
  removed: ReadonlySet<number>,
  disabled: boolean,
  onTap: (id: number) => void,
): {
  ref: RefObject<SVGSVGElement | null>;
  onPointerDown: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerCancel: (event: PointerEvent<SVGSVGElement>) => void;
} {
  const ref = useRef<SVGSVGElement>(null);
  const pending = useRef<PendingTap | null>(null);
  const activePointers = useRef<Set<number>>(new Set());
  const bounds = levelBounds(level);

  const tapAt = (clientX: number, clientY: number) => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    const point = {
      x: bounds.minX + ((clientX - rect.left) / rect.width) * bounds.width,
      y: bounds.minY + ((clientY - rect.top) / rect.height) * bounds.height,
    };
    const arrow = nearestArrow(level, removed, point, 1.35);
    if (arrow) {
      onTap(arrow.id);
    }
  };

  /**
   * Only a single, primary, stationary pointer may select an arrow. Sliding the
   * screen, a second finger or a mouse button other than the first never reads
   * as a tap: the pending gesture is dropped as soon as any of those happen.
   */
  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    activePointers.current.add(event.pointerId);
    if (disabled || !event.isPrimary || event.button !== 0 || activePointers.current.size > 1) {
      pending.current = null;
      return;
    }
    pending.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // jsdom and older engines have no pointer capture; movement checks still work.
    }
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const start = pending.current;
    if (!start || start.pointerId !== event.pointerId) {
      return;
    }
    if (Math.hypot(event.clientX - start.clientX, event.clientY - start.clientY) > TAP_SLOP_PX) {
      pending.current = null;
    }
  };

  const onPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    activePointers.current.delete(event.pointerId);
    const start = pending.current;
    pending.current = null;
    if (disabled || !start || start.pointerId !== event.pointerId) {
      return;
    }
    if (Math.hypot(event.clientX - start.clientX, event.clientY - start.clientY) > TAP_SLOP_PX) {
      return;
    }
    tapAt(start.clientX, start.clientY);
  };

  const onPointerCancel = (event: PointerEvent<SVGSVGElement>) => {
    activePointers.current.delete(event.pointerId);
    if (pending.current?.pointerId === event.pointerId) {
      pending.current = null;
    }
  };

  return { ref, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
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
  const { ref, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useMazePointer(
    level,
    removed,
    disabled,
    onTap,
  );

  return (
    <svg
      ref={ref}
      aria-label={`${level.name}: pijlenpuzzel`}
      className="block w-full touch-manipulation select-none"
      role="group"
      viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <MazeDots level={level} />
      <MazeTrail insetHeads={insetHeads} level={level} removed={removed} />

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
          bounds={bounds}
          headInset={insetHeads.has(flying.arrow.id)}
          onFlyingEnd={onFlyingEnd}
        />
      ) : null}
    </svg>
  );
}
