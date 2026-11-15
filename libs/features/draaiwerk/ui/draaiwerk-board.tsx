import { useEffect, useMemo, useRef, type MouseEvent } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  boardViewBox,
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
import { holesForPlacement, occupiedHoleIds } from "../model/placement";
import {
  BoardGear,
  ConnectionBand,
  fixedGearTone,
  GearHitTarget,
  LampGlyph,
  LiftGlyph,
  playerGearTone,
  TargetArc,
  WormBar,
  wormTone,
} from "./gear-art";

interface DraaiwerkBoardProps {
  level: Level;
  result: DriveResult;
  placements: readonly Placement[];
  selectedItem: TrayItem | null;
  canMovePlaced: boolean;
  pendingGearKey: string | null;
  hintPlacement: Placement | null;
  onHole: (holeId: string) => void;
  onGear: (key: string) => void;
  onLoose: (holeId: string) => void;
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
        pointerEvents="none"
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
  const radius = gearRadius(pose.size) + 10;
  const start = {
    x: pose.center.x + radius * 0.26,
    y: pose.center.y + radius * 0.97,
  };
  const tail = {
    x: pose.center.x + radius * 0.42,
    y: pose.center.y + radius + 20,
  };
  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: `placed:loose:${pose.holeId}`,
    disabled: !enabled,
  });
  const wasDragging = useRef(false);

  useEffect(() => {
    if (isDragging) {
      wasDragging.current = true;
    }
  }, [isDragging]);

  const sway = `M ${start.x} ${start.y} Q ${start.x + 10} ${start.y + 12} ${tail.x} ${tail.y}`;

  return (
    <g data-loose-belt={pose.holeId}>
      <circle
        cx={pose.center.x}
        cy={pose.center.y}
        fill="none"
        opacity={0.92}
        r={radius}
        stroke="#d6cfbf"
        strokeWidth={7}
      />
      <circle
        className="draaiwerk-belt-dash"
        cx={pose.center.x}
        cy={pose.center.y}
        fill="none"
        r={radius}
        stroke="#8a91a1"
        strokeDasharray="5 7"
        strokeWidth={1.5}
      />
      <path d={sway} fill="none" stroke="#d6cfbf" strokeLinecap="round" strokeWidth={7} />
      <path
        className="draaiwerk-belt-dash"
        d={sway}
        fill="none"
        stroke="#8a91a1"
        strokeDasharray="5 7"
        strokeLinecap="round"
        strokeWidth={1.5}
      />
      <g
        ref={(node) => setNodeRef(node as unknown as HTMLElement)}
        {...attributes}
        {...listeners}
        aria-label="Trek de riem naar een ander tandwiel"
        className="draaiwerk-loose-handle"
        data-placed-key={`loose:${pose.holeId}`}
        role="button"
        style={{ touchAction: "none" }}
        tabIndex={enabled ? 0 : -1}
        onClick={(event) => {
          event.stopPropagation();
          if (wasDragging.current) {
            wasDragging.current = false;
            return;
          }
          onLoose(pose.holeId);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onLoose(pose.holeId);
          }
        }}
      >
        <circle cx={tail.x} cy={tail.y} fill="transparent" pointerEvents="all" r={22} />
        <circle
          cx={tail.x}
          cy={tail.y}
          fill="var(--card)"
          r={7}
          stroke="var(--primary)"
          strokeWidth={2}
        />
        <circle cx={tail.x} cy={tail.y} fill="var(--primary)" r={2.5} />
      </g>
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
  onHole,
  onGear,
  onLoose,
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
    selectedItem?.kind === "belt" || selectedItem?.kind === "chain" || Boolean(pendingGearKey);

  const handleBackgroundTap = (event: MouseEvent<SVGSVGElement>) => {
    const target = event.target as Element;
    if (target.closest("[data-hole-id]") || target.closest("[data-gear-key]")) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    const scale = Math.min(rect.width / layout.width, rect.height / layout.height);
    const boardX =
      layout.x + (event.clientX - rect.left - (rect.width - layout.width * scale) / 2) / scale;
    const boardY =
      layout.y + (event.clientY - rect.top - (rect.height - layout.height * scale) / 2) / scale;
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

  return (
    <section
      aria-label={`Tandwielbord van ${level.name}`}
      className="game-panel relative min-h-72 overflow-hidden p-1 sm:min-h-80 sm:p-2 md:h-full md:min-h-0 md:landscape:col-span-5"
      data-draaiwerk-board="true"
      data-level-id={level.id}
      data-status={status}
    >
      <svg
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
          {result.connections.map((connection) => (
            <ConnectionBand connection={connection} key={connection.key} />
          ))}
        </g>

        <g>
          {worms.map((worm) => (
            <WormBar
              key={`worm-bar:${worm.shaftHoleId}:${worm.wheelHoleId}`}
              level={level}
              placement={worm}
            />
          ))}
        </g>

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
                  wormTone(pose.visual) ??
                  (output && config
                    ? fixedGearTone(pose, output)
                    : pose.key === "motor"
                      ? fixedGearTone(pose, undefined)
                      : playerGearTone(pose.size))
                }
              />
            );
          })}
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
                .filter((pose) => pose.key.startsWith("gear:") || pose.key.startsWith("worm:"))
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
