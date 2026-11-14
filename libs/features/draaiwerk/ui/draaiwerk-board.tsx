import { useMemo, type MouseEvent } from "react";
import {
  boardViewBox,
  gearPath,
  gearRadius,
  holeCenter,
  type DriveResult,
  type Level,
  type Output,
  type Placement,
  type TrayItem,
} from "@entities/gear";
import { outputName } from "../model/labels";
import { occupiedHoleIds } from "../model/placement";
import {
  AxleBar,
  BoardGear,
  ConnectionBand,
  fixedGearTone,
  GearHitTarget,
  LampGlyph,
  LiftGlyph,
  playerGearTone,
  TargetArc,
} from "./gear-art";

interface DraaiwerkBoardProps {
  level: Level;
  result: DriveResult;
  placements: readonly Placement[];
  selectedItem: TrayItem | null;
  pendingHoleId: string | null;
  pendingGearKey: string | null;
  hintPlacement: Placement | null;
  onHole: (holeId: string) => void;
  onGear: (key: string) => void;
}

type AsPlacement = Extract<Placement, { kind: "lying-as" }>;

function hintHoles(placement: Placement | null): Set<string> {
  if (!placement) {
    return new Set();
  }
  if (placement.kind === "gear") {
    return new Set([placement.holeId]);
  }
  if (placement.kind === "lying-as") {
    return new Set([placement.holeA, placement.holeB]);
  }
  return new Set([placement.fromHoleId, placement.toHoleId]);
}

function isLyingAs(placement: Placement): placement is AsPlacement {
  return placement.kind === "lying-as";
}

export function DraaiwerkBoard({
  level,
  result,
  placements,
  selectedItem,
  pendingHoleId,
  pendingGearKey,
  hintPlacement,
  onHole,
  onGear,
}: DraaiwerkBoardProps) {
  const layout = useMemo(() => {
    const [x, y, width, height] = boardViewBox(level).split(" ").map(Number);
    return { x: x as number, y: y as number, width: width as number, height: height as number };
  }, [level]);

  const occupied = useMemo(() => occupiedHoleIds(level, placements), [level, placements]);
  const blocked = useMemo(() => new Set(level.blockedHoleIds), [level]);
  const hint = hintHoles(hintPlacement);
  const axles = placements.filter(isLyingAs);
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
  const pendingGhost = selectedItem?.kind === "lying-as" && pendingHoleId ? pendingHoleId : null;
  const linkMode = selectedItem?.kind === "belt" || selectedItem?.kind === "chain";

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
          {axles.map((axle) => (
            <AxleBar key={`${axle.holeA}:${axle.holeB}`} level={level} placement={axle} />
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
          {level.holes.map((hole) => {
            const isBlocked = blocked.has(hole.id);
            const isOccupied = occupied.has(hole.id);
            const isHint = hint.has(hole.id);
            const isPending = pendingHoleId === hole.id;
            const center = holeCenter(level, hole.id);
            const label = `Gat ${hole.col}, ${hole.row}${
              isBlocked ? ", geblokkeerd" : isOccupied ? ", bezet" : ""
            }`;

            return (
              <g
                aria-label={label}
                className="draaiwerk-hole"
                data-blocked={isBlocked ? "true" : "false"}
                data-hole-id={hole.id}
                key={hole.id}
                role="button"
                tabIndex={isOccupied ? -1 : 0}
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
                <circle
                  className="draaiwerk-focus-ring"
                  cx={center.x}
                  cy={center.y}
                  fill="none"
                  r={13.5}
                  stroke="var(--primary)"
                  strokeWidth={2}
                />
                {isHint && !isOccupied ? (
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
                {isPending ? (
                  <circle
                    cx={center.x}
                    cy={center.y}
                    fill="none"
                    r={12}
                    stroke="var(--warning)"
                    strokeWidth={2.4}
                  />
                ) : null}
                {isBlocked ? (
                  <g aria-hidden="true" opacity={0.85}>
                    <circle cx={center.x} cy={center.y} fill="var(--muted)" r={6} />
                    <path
                      d={`M ${center.x - 3} ${center.y - 3} L ${center.x + 3} ${center.y + 3} M ${center.x + 3} ${center.y - 3} L ${center.x - 3} ${center.y + 3}`}
                      stroke="var(--muted-foreground)"
                      strokeLinecap="round"
                      strokeWidth={1.6}
                    />
                  </g>
                ) : isOccupied ? null : (
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
          })}
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

        {pendingGhost && selectedItem?.kind === "lying-as" ? (
          <g aria-hidden="true" pointerEvents="none">
            <circle
              cx={holeCenter(level, pendingGhost).x}
              cy={holeCenter(level, pendingGhost).y}
              fill="none"
              opacity={0.6}
              r={gearRadius(selectedItem.sizeA) + 5}
              stroke="var(--warning)"
              strokeDasharray="5 5"
              strokeWidth={1.6}
            />
            <g
              transform={`translate(${holeCenter(level, pendingGhost).x} ${holeCenter(level, pendingGhost).y})`}
            >
              <path
                d={gearPath(selectedItem.sizeA)}
                fill="var(--warning)"
                opacity={0.12}
                stroke="var(--warning)"
                strokeDasharray="4 4"
                strokeWidth={1.4}
              />
            </g>
          </g>
        ) : null}
      </svg>
    </section>
  );
}
