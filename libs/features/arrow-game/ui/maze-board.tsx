import { useRef, type PointerEvent, type RefObject } from "react";
import {
  arrowDirection,
  arrowHead,
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
  return (
    <>
      <polyline
        className="maze-line"
        fill="none"
        points={pointsAttribute(arrow.points)}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.16}
      />
      <polygon
        className="maze-head"
        fill="currentColor"
        points={headAttribute(arrowHead(arrow), arrowDirection(arrow))}
      />
    </>
  );
}

function MazeDots({ level }: { level: MazeLevel }) {
  const bounds = levelBounds(level);
  return (
    <>
      <defs>
        <pattern height="1" id={`maze-dots-${level.id}`} patternUnits="userSpaceOnUse" width="1">
          <circle cx="0.5" cy="0.5" fill="#d8d8e8" r="0.045" />
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
