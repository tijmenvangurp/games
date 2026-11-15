import { useMemo, useRef, useState, type MouseEvent, type Ref } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  boardViewBox,
  connectionPath,
  gearRadius,
  holeCenter,
  type DriveResult,
  type GearPose,
  type Hole,
  type Level,
  type ConnectionPose,
  type Output,
  type Placement,
  type TrayItem,
} from "@entities/gear";
import { outputName } from "../model/labels";
import {
  holesForPlacement,
  looseBeltTarget,
  occupiedHoleIds,
  type LinkPlacementKind,
} from "../model/placement";
import {
  BoardGear,
  ChainPreview,
  ConnectionBand,
  fixedGearTone,
  GearHitTarget,
  LampGlyph,
  LiftGlyph,
  playerGearTone,
  StaticChain,
  TargetArc,
  WormBar,
} from "./gear-art";

interface DraaiwerkBoardProps {
  level: Level;
  result: DriveResult;
  placements: readonly Placement[];
  selectedItem: TrayItem | null;
  canMovePlaced: boolean;
  pendingGearKey: string | null;
  hintPlacement: Placement | null;
  /** The ghost pulley of a belt that is being dragged, in board coordinates. */
  ghost?: BeltGhost | null;
  svgRef?: Ref<SVGSVGElement>;
  onHole: (holeId: string) => void;
  onGear: (key: string) => void;
  onLoose: (holeId: string) => void;
  onToggleBelt?: (key: string) => void;
}

/** A loose belt that follows the finger: one fixed pulley and one virtual one. */
export interface BeltGhost {
  anchorKey: string;
  link: LinkPlacementKind;
  /** The lifted preview position, used for both drawing and snapping. */
  point: { x: number; y: number };
  /** The drop animation is in progress: keep the point as it is, do not snap. */
  locked?: boolean;
}

const MIN_TAP_DISTANCE = 20;
const TAP_DISTANCE_RATIO = 0.018;

/** Movement below this many CSS pixels is still a tap; more becomes a drag. */
export function tapDistanceThreshold(): number {
  if (typeof window === "undefined") {
    return MIN_TAP_DISTANCE;
  }
  return Math.max(MIN_TAP_DISTANCE, TAP_DISTANCE_RATIO * window.innerHeight);
}

/**
 * Turns a viewport point into board coordinates, using the same viewBox and
 * letterbox math as the board's tap handling.
 */
export function boardPointFromClient(
  element: SVGSVGElement | null,
  level: Level,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  if (!element) {
    return null;
  }
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return null;
  }
  const [x, y, width, height] = boardViewBox(level).split(" ").map(Number);
  const scale = Math.min(rect.width / (width as number), rect.height / (height as number));
  return {
    x: (x as number) + (clientX - rect.left - (rect.width - (width as number) * scale) / 2) / scale,
    y:
      (y as number) + (clientY - rect.top - (rect.height - (height as number) * scale) / 2) / scale,
  };
}

type WormPlacement = Extract<Placement, { kind: "worm" }>;

function hintHoles(placement: Placement | null): Set<string> {
  return placement ? holesForPlacement(placement) : new Set();
}

function isWorm(placement: Placement): placement is WormPlacement {
  return placement.kind === "worm";
}

interface DraaiwerkHoleProps {
  level: Level;
  hole: Hole;
  blocked: boolean;
  occupied: boolean;
  hint: boolean;
  onHole: (holeId: string) => void;
}

function DraaiwerkHole({ level, hole, blocked, occupied, hint, onHole }: DraaiwerkHoleProps) {
  const { isOver, setNodeRef } = useDroppable({ id: `hole:${hole.id}` });
  const center = holeCenter(level, hole.id);
  const label = `Gat ${hole.col}, ${hole.row}${
    blocked ? ", geblokkeerd" : occupied ? ", bezet" : ""
  }`;

  return (
    <g
      ref={(node) => setNodeRef(node as unknown as HTMLElement)}
      aria-label={label}
      className="draaiwerk-hole"
      data-blocked={blocked ? "true" : "false"}
      data-drop-over={isOver ? "true" : "false"}
      data-hole-id={hole.id}
      role="button"
      tabIndex={occupied ? -1 : 0}
      onClick={(event) => {
        event.stopPropagation();
        onHole(hole.id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onHole(hole.id);
        }
      }}
    >
      {isOver ? (
        <circle
          aria-hidden="true"
          cx={center.x}
          cy={center.y}
          fill="var(--primary)"
          fillOpacity={0.1}
          r={19}
          stroke="var(--primary)"
          strokeWidth={2}
        />
      ) : null}
      <circle
        aria-hidden="true"
        cx={center.x}
        cy={center.y}
        fill="transparent"
        // A hole stays tappable where it sits inside the filled hit area of a
        // belt, so it has to accept pointer events itself.
        pointerEvents="all"
        r={22.5}
      />
      <circle
        className="draaiwerk-focus-ring"
        cx={center.x}
        cy={center.y}
        fill="none"
        r={13.5}
        stroke="var(--primary)"
        strokeWidth={2}
      />
      {hint && !occupied ? (
        <circle
          className="draaiwerk-hint"
          cx={center.x}
          cy={center.y}
          data-hint="true"
          fill="none"
          r={19}
          stroke="var(--warning)"
          strokeDasharray="4 4"
          strokeWidth={2}
        />
      ) : null}
      {blocked ? (
        <g aria-hidden="true" opacity={0.85}>
          <circle cx={center.x} cy={center.y} fill="var(--muted)" r={6} />
          <path
            d={`M ${center.x - 3} ${center.y - 3} L ${center.x + 3} ${center.y + 3} M ${center.x + 3} ${center.y - 3} L ${center.x - 3} ${center.y + 3}`}
            stroke="var(--muted-foreground)"
            strokeLinecap="round"
            strokeWidth={1.6}
          />
        </g>
      ) : occupied ? null : (
        <circle
          aria-hidden="true"
          cx={center.x}
          cy={center.y}
          fill="var(--foreground)"
          opacity={0.24}
          r={2.6}
        />
      )}
    </g>
  );
}

function GearDropZone({ pose }: { pose: GearPose }) {
  const { isOver, setNodeRef } = useDroppable({ id: `gear:${pose.key}` });

  return (
    <circle
      ref={(node) => setNodeRef(node as unknown as HTMLElement)}
      aria-hidden="true"
      cx={pose.center.x}
      cy={pose.center.y}
      data-drop-over={isOver ? "true" : "false"}
      data-gear-drop={pose.key}
      fill={isOver ? "var(--primary)" : "transparent"}
      fillOpacity={isOver ? 0.12 : 0}
      pointerEvents="none"
      r={gearRadius(pose.size) + 8}
    />
  );
}

function PlacedGearHandle({ pose, enabled }: { pose: GearPose; enabled: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `placed:${pose.key}`,
    disabled: !enabled,
  });

  if (!enabled) {
    return null;
  }

  return (
    <circle
      ref={(node) => setNodeRef(node as unknown as HTMLElement)}
      {...attributes}
      {...listeners}
      aria-label="Verplaats dit onderdeel"
      className="draaiwerk-placed-handle"
      cx={pose.center.x}
      cy={pose.center.y}
      data-placed-key={pose.key}
      fill="transparent"
      pointerEvents="all"
      r={gearRadius(pose.size) + 2}
      style={{ touchAction: "none" }}
    />
  );
}

function PlacedConnectionHandle({
  connection,
  gears,
  enabled,
}: {
  connection: ConnectionPose;
  gears: readonly GearPose[];
  enabled: boolean;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `placed:belt:${connection.key}`,
    disabled: !enabled,
  });
  const from = gears.find((pose) => pose.key === connection.fromKey);
  const to = gears.find((pose) => pose.key === connection.toKey);

  if (!enabled || !from || !to) {
    return null;
  }

  const cx = (from.center.x + to.center.x) / 2;
  const cy = (from.center.y + to.center.y) / 2;

  return (
    <g
      ref={(node) => setNodeRef(node as unknown as HTMLElement)}
      {...attributes}
      {...listeners}
      aria-label="Verplaats of verwijder deze verbinding"
      className="draaiwerk-placed-handle"
      data-placed-key={`belt:${connection.key}`}
      style={{ touchAction: "none" }}
    >
      <circle cx={cx} cy={cy} fill="var(--card)" r={14} stroke="var(--border)" strokeWidth={1.5} />
      <path
        d={`M ${cx - 6} ${cy - 3} H ${cx + 6} M ${cx - 6} ${cy + 3} H ${cx + 6}`}
        stroke="var(--muted-foreground)"
        strokeLinecap="round"
        strokeWidth={1.6}
      />
    </g>
  );
}

function LooseBeltBand({
  pose,
  enabled,
  onLoose,
}: {
  pose: GearPose;
  enabled: boolean;
  onLoose: (holeId: string) => void;
}) {
  const radius = gearRadius(pose.size);
  const chainBottom = { x: pose.center.x, y: pose.center.y + radius * 2.9 };
  const tail = chainBottom;
  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: `placed:loose:${pose.holeId}`,
    disabled: !enabled,
  });
  const pressPoint = useRef<{ x: number; y: number } | null>(null);

  // A loose chain is a big loop draped over the gear, with the handle at the
  // bottom so it reads as something gravity is pulling on.
  const chainLoop = (() => {
    const cx = pose.center.x;
    const cy = pose.center.y;
    const left = { x: cx - radius, y: cy };
    const right = { x: cx + radius, y: cy };
    return [
      `M ${left.x} ${left.y}`,
      `A ${radius} ${radius} 0 0 1 ${right.x} ${right.y}`,
      `C ${cx + radius * 1.15} ${cy + radius * 1.4}, ${cx + radius * 0.75} ${cy + radius * 2.5}, ${cx + radius * 0.25} ${cy + radius * 2.9}`,
      `C ${cx + radius * 0.1} ${cy + radius * 3}, ${cx - radius * 0.1} ${cy + radius * 3}, ${cx - radius * 0.25} ${cy + radius * 2.9}`,
      `C ${cx - radius * 0.75} ${cy + radius * 2.5}, ${cx - radius * 1.15} ${cy + radius * 1.4}, ${left.x} ${left.y}`,
      "Z",
    ].join(" ");
  })();

  return (
    <g
      data-loose-belt={pose.holeId}
      data-dragging={isDragging ? "true" : "false"}
      opacity={isDragging ? 0.25 : 1}
    >
      <StaticChain path={chainLoop} spacing={12} />
      <g
        ref={(node) => setNodeRef(node as unknown as HTMLElement)}
        {...attributes}
        {...listeners}
        aria-label="Trek de ketting naar een ander tandwiel"
        className="draaiwerk-loose-handle"
        data-placed-key={`loose:${pose.holeId}`}
        role="button"
        style={{ touchAction: "none" }}
        tabIndex={enabled ? 0 : -1}
        onClick={(event) => {
          event.stopPropagation();
          const start = pressPoint.current;
          pressPoint.current = null;
          if (start) {
            const travel = Math.hypot(event.clientX - start.x, event.clientY - start.y);
            if (travel >= tapDistanceThreshold()) {
              return;
            }
          }
          onLoose(pose.holeId);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onLoose(pose.holeId);
          }
        }}
        onPointerDownCapture={(event) => {
          pressPoint.current = { x: event.clientX, y: event.clientY };
        }}
      >
        <circle cx={tail.x} cy={tail.y} fill="transparent" pointerEvents="all" r={22} />
        <circle
          cx={tail.x}
          cy={tail.y}
          fill="var(--card)"
          r={7}
          stroke="#79828e"
          strokeWidth={2.6}
        />
        <circle cx={tail.x} cy={tail.y} fill="#3f4652" r={2.8} />
      </g>
    </g>
  );
}

/**
 * A placed belt is a button. The invisible hit path follows the whole loop, so
 * a child never has to aim for the 7 px band itself.
 */
function BeltHitTarget({
  connection,
  enabled,
  onToggle,
}: {
  connection: ConnectionPose;
  enabled: boolean;
  onToggle: (key: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  if (!enabled || connection.kind === "chain") {
    return null;
  }

  const crossed = connection.kind === "crossed-belt";
  const label = crossed
    ? "Ketting, gekruist; tik om open te maken"
    : "Ketting, open; tik om te kruisen";
  const toggle = () => onToggle(connection.key);

  return (
    <g
      aria-label={label}
      data-belt-kind={connection.kind}
      data-belt-toggle={connection.key}
      onBlur={() => setFocused(false)}
      onClick={(event) => {
        event.stopPropagation();
        toggle();
      }}
      onFocus={() => setFocused(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          toggle();
        }
      }}
      role="button"
      style={{ cursor: "pointer" }}
      tabIndex={0}
    >
      <path
        aria-hidden="true"
        d={connection.path}
        fill="transparent"
        pointerEvents="all"
        stroke="transparent"
        strokeLinejoin="round"
        strokeWidth={24}
      />
      {focused ? (
        <path
          aria-hidden="true"
          d={connection.path}
          fill="none"
          pointerEvents="none"
          stroke="var(--primary)"
          strokeDasharray="6 5"
          strokeWidth={2}
        />
      ) : null}
    </g>
  );
}

export function DraaiwerkBoard({
  level,
  result,
  placements,
  selectedItem,
  canMovePlaced,
  pendingGearKey,
  hintPlacement,
  ghost = null,
  svgRef,
  onHole,
  onGear,
  onLoose,
  onToggleBelt,
}: DraaiwerkBoardProps) {
  const layout = useMemo(() => {
    const [x, y, width, height] = boardViewBox(level).split(" ").map(Number);
    return { x: x as number, y: y as number, width: width as number, height: height as number };
  }, [level]);

  const occupied = useMemo(() => occupiedHoleIds(level, placements), [level, placements]);
  const blocked = useMemo(() => new Set(level.blockedHoleIds), [level]);
  const hint = hintHoles(hintPlacement);
  const worms = placements.filter(isWorm);
  const looseBelts = placements.filter(
    (placement): placement is Extract<Placement, { kind: "loose-belt" }> =>
      placement.kind === "loose-belt",
  );
  const outputById = useMemo(
    () => new Map(level.outputs.map((output) => [output.id, output])),
    [level],
  );
  const poseMeta = useMemo(() => {
    const outputByPose = new Map<string, (typeof result.outputs)[number]>(
      result.outputs.map((output) => [`output:${output.id}`, output] as const),
    );
    return new Map(
      result.gears.map((pose) => {
        const output = outputByPose.get(pose.key);
        const config = output ? outputById.get(output.id) : undefined;
        const label = pose.key === "motor" ? "Motor" : config ? outputName(config.kind) : undefined;
        return [pose.key, { output, config, label }] as const;
      }),
    );
  }, [outputById, result.gears, result.outputs]);
  const status = result.solved ? "solved" : result.jammed ? "jammed" : "playing";
  const linkMode =
    selectedItem?.kind === "belt" ||
    selectedItem?.kind === "chain" ||
    selectedItem?.kind === "worm" ||
    Boolean(pendingGearKey);

  const handleBackgroundTap = (event: MouseEvent<SVGSVGElement>) => {
    const target = event.target as Element;
    if (
      target.closest("[data-hole-id]") ||
      target.closest("[data-gear-key]") ||
      target.closest("[data-belt-toggle]")
    ) {
      return;
    }

    const point = boardPointFromClient(event.currentTarget, level, event.clientX, event.clientY);
    if (!point) {
      return;
    }
    const boardX = point.x;
    const boardY = point.y;
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = Math.min(rect.width / layout.width, rect.height / layout.height);
    const reach = 28 / scale;

    let nearestHole: { id: string; distance: number } | null = null;
    for (const hole of level.holes) {
      const center = holeCenter(level, hole.id);
      const distance = Math.hypot(center.x - boardX, center.y - boardY);
      if (distance <= reach && (!nearestHole || distance < nearestHole.distance)) {
        nearestHole = { id: hole.id, distance };
      }
    }
    if (nearestHole) {
      onHole(nearestHole.id);
      return;
    }

    if (selectedItem?.kind !== "belt" && selectedItem?.kind !== "chain") {
      return;
    }

    let nearestGear: { key: string; distance: number } | null = null;
    for (const gear of result.gears) {
      const distance = Math.hypot(gear.center.x - boardX, gear.center.y - boardY);
      if (
        distance <= gearRadius(gear.size) + reach &&
        (!nearestGear || distance < nearestGear.distance)
      ) {
        nearestGear = { key: gear.key, distance };
      }
    }
    if (nearestGear) {
      onGear(nearestGear.key);
    }
  };

  const ghostArt = useMemo(() => {
    if (!ghost) {
      return null;
    }
    const anchor = result.gears.find((pose) => pose.key === ghost.anchorKey);
    if (!anchor) {
      return null;
    }

    const target = looseBeltTarget(
      level,
      placements,
      result.gears,
      anchor.holeId,
      ghost.link,
      ghost.point,
    );
    const anchorRadius = gearRadius(anchor.size);
    const snapped = target?.snapped ? target.pose : null;
    const virtual = snapped && !ghost.locked ? snapped.center : ghost.point;
    const virtualRadius = gearRadius(target?.pose.size ?? anchor.size);
    const span = Math.hypot(virtual.x - anchor.center.x, virtual.y - anchor.center.y);
    const reachable = span > anchorRadius + virtualRadius + 1;
    const path = reachable
      ? connectionPath(ghost.link, anchor.center, anchorRadius, virtual, virtualRadius)
      : null;

    return {
      path,
      kind: ghost.link,
      target: snapped,
      virtual,
      virtualRadius,
    };
  }, [ghost, level, placements, result.gears]);

  return (
    <section
      aria-label={`Tandwielbord van ${level.name}`}
      className="game-panel relative min-h-72 overflow-hidden p-1 sm:min-h-80 sm:p-2 md:h-full md:min-h-0 md:landscape:col-span-5"
      data-draaiwerk-board="true"
      data-level-id={level.id}
      data-status={status}
    >
      <svg
        ref={svgRef}
        aria-label={`Tandwielbord van ${level.name}`}
        className="draaiwerk-board h-full w-full touch-manipulation select-none"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        viewBox={`${layout.x} ${layout.y} ${layout.width} ${layout.height}`}
        onClick={handleBackgroundTap}
      >
        <defs>
          <pattern
            height={14}
            id="draaiwerk-dots"
            patternUnits="userSpaceOnUse"
            width={14}
            x={layout.x}
            y={layout.y}
          >
            <circle cx={1} cy={1} fill="var(--border)" opacity={0.6} r={1} />
          </pattern>
        </defs>

        <rect
          fill="url(#draaiwerk-dots)"
          height={layout.height - 2}
          rx={16}
          stroke="var(--border)"
          strokeWidth={1}
          width={layout.width - 2}
          x={layout.x + 1}
          y={layout.y + 1}
        />

        <g>
          {result.gears.map((pose) => {
            const meta = poseMeta.get(pose.key);
            const output = meta?.output;
            const config = meta?.config;
            return (
              <BoardGear
                key={pose.key}
                hint={hint.has(pose.holeId) || pendingGearKey === pose.key}
                label={meta?.label}
                pose={pose}
                tone={
                  output && config
                    ? fixedGearTone(pose, output)
                    : pose.key === "motor"
                      ? fixedGearTone(pose, undefined)
                      : playerGearTone(pose.size)
                }
              />
            );
          })}
        </g>

        {/* Every connection is a chain, so it is drawn over the wheels. */}
        <g data-chain-layer="true">
          {result.connections.map((connection) => (
            <ConnectionBand connection={connection} key={connection.key} />
          ))}
        </g>

        {/* The worm shaft lies across two gears, so it is drawn over them. */}
        <g data-worm-layer="true">
          {worms.map((worm) => (
            <WormBar
              key={`worm-bar:${worm.fromHoleId}:${worm.toHoleId}`}
              level={level}
              placement={worm}
            />
          ))}
        </g>

        {ghostArt ? (
          <g aria-hidden="true" data-belt-ghost="true" pointerEvents="none">
            {ghostArt.path ? <ChainPreview path={ghostArt.path} /> : null}
            <circle
              cx={ghostArt.virtual.x}
              cy={ghostArt.virtual.y}
              fill="none"
              r={ghostArt.virtualRadius}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 6"
              strokeWidth={1.5}
            />
            {ghostArt.target ? (
              <circle
                cx={ghostArt.target.center.x}
                cy={ghostArt.target.center.y}
                fill="none"
                r={gearRadius(ghostArt.target.size) + 8}
                stroke="var(--primary)"
                strokeWidth={2}
              />
            ) : null}
          </g>
        ) : null}

        {/* The whole loop of a belt is a button: tap it to cross or open it. */}
        <g>
          {result.connections.map((connection) => (
            <BeltHitTarget
              connection={connection}
              enabled={!result.solved && !selectedItem && !pendingGearKey && Boolean(onToggleBelt)}
              key={`toggle:${connection.fromKey}:${connection.toKey}`}
              onToggle={(key) => onToggleBelt?.(key)}
            />
          ))}
        </g>

        <g>
          {result.outputs.map((output) => {
            const config: Output | undefined = outputById.get(output.id);
            if (!config) {
              return null;
            }
            return (
              <g
                key={output.id}
                data-output-id={output.id}
                data-output-kind={output.kind}
                data-satisfied={output.satisfied ? "true" : "false"}
              >
                {output.satisfied ? (
                  <circle
                    cx={output.center.x}
                    cy={output.center.y}
                    fill="none"
                    opacity={0.55}
                    r={gearRadius(config.size) + 5}
                    stroke="var(--success)"
                    strokeWidth={2}
                  />
                ) : null}
                {output.kind === "target" ? (
                  <TargetArc direction={config.direction ?? 1} output={output} size={config.size} />
                ) : output.kind === "generator" ? (
                  <LampGlyph output={output} size={config.size} />
                ) : (
                  <LiftGlyph output={output} size={config.size} />
                )}
              </g>
            );
          })}
        </g>

        <g>
          {result.gears.map((pose) => (
            <GearDropZone key={`drop:${pose.key}`} pose={pose} />
          ))}
        </g>

        <g>
          {level.holes.map((hole) => (
            <DraaiwerkHole
              key={hole.id}
              blocked={blocked.has(hole.id)}
              hint={hint.has(hole.id)}
              hole={hole}
              level={level}
              occupied={occupied.has(hole.id)}
              onHole={onHole}
            />
          ))}
        </g>

        <g>
          {linkMode
            ? result.gears.map((pose) => {
                const meta = poseMeta.get(pose.key);
                return (
                  <GearHitTarget key={pose.key} label={meta?.label} pose={pose} onTap={onGear} />
                );
              })
            : null}
        </g>

        <g>
          {canMovePlaced
            ? result.gears
                .filter((pose) => pose.key.startsWith("gear:"))
                .map((pose) => <PlacedGearHandle key={`move:${pose.key}`} enabled pose={pose} />)
            : null}
        </g>

        <g>
          {canMovePlaced
            ? result.connections.map((connection) => (
                <PlacedConnectionHandle
                  key={`move:${connection.key}`}
                  connection={connection}
                  enabled
                  gears={result.gears}
                />
              ))
            : null}
        </g>

        <g>
          {looseBelts.map((loose) => {
            const pose = result.gears.find((gear) => gear.holeId === loose.holeId);
            return pose ? (
              <LooseBeltBand
                key={`loose:${loose.holeId}`}
                enabled={canMovePlaced}
                pose={pose}
                onLoose={onLoose}
              />
            ) : null;
          })}
        </g>
      </svg>
    </section>
  );
}
