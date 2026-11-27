import { memo, type KeyboardEvent } from "react";
import { useReducedMotion } from "motion/react";
import { useTexts } from "@shared/i18n";
import {
  gearPath,
  gearRadius,
  holeCenter,
  type ConnectionPose,
  type GearPose,
  type GearSize,
  type Level,
  type OutputPose,
  type Placement,
  type TrayItem,
} from "@entities/gear";
import { draaiwerkTexts } from "../model/texts";

export interface GearTone {
  fill: string;
  stroke: string;
  soft: string;
}

const MOTOR_TONE: GearTone = { fill: "#39404f", stroke: "#242a36", soft: "#e8e3d6" };
const TARGET_TONE: GearTone = { fill: "#6d78ad", stroke: "#4f5d9e", soft: "#e7e8f4" };
const GENERATOR_TONE: GearTone = { fill: "#c09855", stroke: "#8d6b31", soft: "#f6ecd9" };
const LIFT_TONE: GearTone = { fill: "#79a6a1", stroke: "#4c7f7b", soft: "#e2efec" };

const PLAYER_TONES: Record<GearSize, GearTone> = {
  1: { fill: "#84aaa4", stroke: "#4f7f78", soft: "#e3f0ed" },
  2: { fill: "#8d94c0", stroke: "#5b6494", soft: "#e8e9f4" },
  3: { fill: "#c3a06a", stroke: "#8f6f3d", soft: "#f6ecd9" },
};

export function playerGearTone(size: GearSize): GearTone {
  return PLAYER_TONES[size];
}

export function fixedGearTone(pose: GearPose, output: OutputPose | undefined): GearTone {
  if (pose.key === "motor") {
    return MOTOR_TONE;
  }
  if (output?.kind === "generator") {
    return GENERATOR_TONE;
  }
  if (output?.kind === "lift") {
    return LIFT_TONE;
  }
  if (output?.kind === "target") {
    return TARGET_TONE;
  }
  return PLAYER_TONES[pose.size];
}

function activateOnKey(event: KeyboardEvent<SVGElement>, action: () => void): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}

function DirectionHint({
  direction,
  radius,
  tone,
}: {
  direction: 1 | -1;
  radius: number;
  tone: GearTone;
}) {
  const orbit = radius * 0.42;
  return (
    <g className="draaiwerk-direction" transform={direction === -1 ? "scale(-1 1)" : undefined}>
      <circle
        fill="none"
        opacity={0.55}
        r={orbit}
        stroke={tone.stroke}
        strokeDasharray="2.5 4"
        strokeWidth={1.2}
      />
      <path d={`M -5 ${-orbit - 3.5} L 6 ${-orbit} L -5 ${-orbit + 3.5} Z`} fill={tone.stroke} />
    </g>
  );
}

interface BoardGearProps {
  pose: GearPose;
  tone: GearTone;
  label?: string;
  hint?: boolean;
}

export function BoardGear({ pose, tone, label, hint = false }: BoardGearProps) {
  const radius = gearRadius(pose.size);
  const spinning = pose.driven && !pose.jammed && Math.abs(pose.speed) > 1e-6;
  const duration = Math.min(40, Math.max(1.2, 6 / Math.max(0.05, Math.abs(pose.speed))));
  const direction: 1 | -1 = pose.speed < 0 ? -1 : 1;
  const phase = Math.round(((pose.phase * 180) / Math.PI) * 100) / 100;
  const spokes = [0, 60, 120, 180, 240, 300].map((angle) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x1: Math.cos(radians) * radius * 0.2,
      x2: Math.cos(radians) * radius * 0.5,
      y1: Math.sin(radians) * radius * 0.2,
      y2: Math.sin(radians) * radius * 0.5,
    };
  });

  return (
    <g
      aria-hidden="true"
      className="draaiwerk-gear"
      data-gear-visual={pose.key}
      pointerEvents="none"
    >
      <g transform={`translate(${pose.center.x} ${pose.center.y}) rotate(${phase})`}>
        <g
          className="draaiwerk-rotor"
          data-direction={direction}
          data-spin={spinning ? "on" : "off"}
          style={{ animationDuration: `${duration}s` }}
        >
          <path
            className="draaiwerk-gear-shadow"
            d={gearPath(pose.size)}
            fill={tone.fill}
            stroke={tone.stroke}
            strokeWidth={1.1}
          />
          <circle
            fill={tone.soft}
            opacity={0.96}
            r={radius * 0.62}
            stroke={tone.stroke}
            strokeWidth={0.8}
          />
          <g opacity={0.18} stroke={tone.stroke} strokeLinecap="round" strokeWidth={1.8}>
            {spokes.map((spoke) => (
              <line
                key={`${spoke.x1}-${spoke.y1}`}
                x1={spoke.x1}
                x2={spoke.x2}
                y1={spoke.y1}
                y2={spoke.y2}
              />
            ))}
          </g>
          <circle fill={tone.stroke} r={Math.max(4, radius * 0.13)} />
          <circle fill={tone.soft} r={Math.max(1.6, radius * 0.05)} />
        </g>
        {spinning ? <DirectionHint direction={direction} radius={radius} tone={tone} /> : null}
      </g>

      {hint ? (
        <circle
          className="draaiwerk-hint"
          cx={pose.center.x}
          cy={pose.center.y}
          data-hint="true"
          fill="none"
          r={radius + 5}
          stroke="var(--warning)"
          strokeDasharray="5 5"
          strokeWidth={2.4}
        />
      ) : null}

      {label ? (
        <text
          aria-hidden="true"
          fill="var(--muted-foreground)"
          fontSize={11}
          letterSpacing="0.1em"
          textAnchor="middle"
          x={pose.center.x}
          y={pose.key === "motor" ? pose.center.y - radius - 30 : pose.center.y + radius + 40}
        >
          {label.toUpperCase()}
        </text>
      ) : null}
    </g>
  );
}

interface GearHitTargetProps {
  pose: GearPose;
  label?: string;
  onTap: (key: string) => void;
}

/**
 * A static, transparent hit target above the spinning gear. Keeping the target
 * outside the rotor means the element box never moves, so pointer and e2e taps
 * stay reliable while the gear turns.
 */
export function GearHitTarget({ pose, label, onTap }: GearHitTargetProps) {
  const t = useTexts(draaiwerkTexts);
  return (
    <circle
      aria-label={label ? t.namedGear(label) : t.gear}
      className="draaiwerk-gear-hit"
      cx={pose.center.x}
      cy={pose.center.y}
      data-driven={pose.driven ? "true" : "false"}
      data-gear-key={pose.key}
      data-jammed={pose.jammed ? "true" : "false"}
      fill="transparent"
      pointerEvents="all"
      r={gearRadius(pose.size) + 6}
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        onTap(pose.key);
      }}
      onKeyDown={(event) => activateOnKey(event, () => onTap(pose.key))}
    />
  );
}

function polar(
  center: { x: number; y: number },
  radius: number,
  angle: number,
): { x: number; y: number } {
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

export function TargetArc({
  output,
  size,
  direction,
}: {
  output: OutputPose;
  size: GearSize;
  direction: 1 | -1;
}) {
  if (output.kind !== "target") {
    return null;
  }

  const startAngle = (205 * Math.PI) / 180;
  const endAngle = (335 * Math.PI) / 180;
  const from = direction === 1 ? startAngle : endAngle;
  const to = direction === 1 ? endAngle : startAngle;
  const sweep = direction === 1 ? 1 : 0;
  const ring = gearRadius(size) + 14;
  const start = polar(output.center, ring, from);
  const end = polar(output.center, ring, to);
  const tangent = to + (direction === 1 ? Math.PI / 2 : -Math.PI / 2);
  const base = {
    x: end.x - Math.cos(tangent) * 9,
    y: end.y - Math.sin(tangent) * 9,
  };
  const radial = { x: Math.cos(to), y: Math.sin(to) };
  const color = output.satisfied ? "var(--success)" : "var(--primary)";

  return (
    <g aria-hidden="true" data-satisfied={output.satisfied ? "true" : "false"}>
      <path
        d={`M ${start.x} ${start.y} A ${ring} ${ring} 0 0 ${sweep} ${end.x} ${end.y}`}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={2.4}
      />
      <path
        d={`M ${end.x} ${end.y} L ${base.x + radial.x * 4.6} ${base.y + radial.y * 4.6} L ${base.x - radial.x * 4.6} ${base.y - radial.y * 4.6} Z`}
        fill={color}
      />
    </g>
  );
}

export function LampGlyph({ output, size }: { output: OutputPose; size: GearSize }) {
  const x = output.center.x;
  const y = output.center.y - gearRadius(size) - 18;
  const on = output.satisfied;

  return (
    <g aria-hidden="true" transform={`translate(${x} ${y})`}>
      {on ? (
        <g className="draaiwerk-lamp-glow" stroke="#dda72c" strokeLinecap="round" strokeWidth={1.7}>
          <path d="M -15 -3 L -20 -6" />
          <path d="M 15 -3 L 20 -6" />
          <path d="M 0 -14 L 0 -19" />
        </g>
      ) : null}
      <path
        d="M -10 2 A 10 10 0 0 1 10 2 Z"
        fill={on ? "#f2c14e" : "var(--muted)"}
        stroke={on ? "#b98a1c" : "var(--border)"}
        strokeWidth={1.3}
      />
      <path
        d="M -4 9 L 4 9 M -2.5 12.5 L 2.5 12.5"
        stroke={on ? "#b98a1c" : "var(--muted-foreground)"}
        strokeLinecap="round"
        strokeWidth={1.8}
      />
    </g>
  );
}

export function LiftGlyph({ output, size }: { output: OutputPose; size: GearSize }) {
  const x = output.center.x + gearRadius(size) + 20;
  const y = output.center.y;

  return (
    <g aria-hidden="true" transform={`translate(${x} ${y})`}>
      <rect fill="var(--border)" height={44} rx={1.5} width={3} x={-1.5} y={-22} />
      <rect fill="var(--border)" height={4} rx={2} width={14} x={-7} y={-26} />
      <g
        className="draaiwerk-lift-platform"
        style={{ transform: output.satisfied ? "translateY(-10px)" : "translateY(8px)" }}
      >
        <rect
          fill="#79a6a1"
          height={6}
          rx={2}
          stroke="#4c7f7b"
          strokeWidth={1}
          width={22}
          x={-11}
          y={-3}
        />
        <path
          d="M -5 -6 L 0 -10 L 5 -6"
          fill="none"
          stroke="#4c7f7b"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.6}
        />
      </g>
    </g>
  );
}

/** Below this surface speed the chain is drawn as if the machine stands still. */
const MIN_SURFACE_SPEED = 0.5;
/** Only a degenerate chain without a measured pitch falls back to this. */
const FALLBACK_CHAIN_PITCH = 12;

function ChainLink({ outer, span }: { outer: boolean; span: number }) {
  const plateHeight = outer ? 4.8 : 3.2;
  const roller = Math.max(1.3, span * 0.14);
  // Leave a visible gap between plates: the plates are shorter than the pitch,
  // so the chain reads as links instead of one continuous track.
  const plateWidth = Math.max(5, span * 0.62);

  return (
    <g>
      <rect
        fill={outer ? "#79828e" : "#d5dbe2"}
        height={plateHeight}
        rx={plateHeight / 2}
        stroke={outer ? "#4f5761" : "#8a929c"}
        strokeWidth={0.9}
        width={plateWidth}
        x={-plateWidth / 2}
        y={-plateHeight / 2}
      />
      {outer ? (
        <rect
          fill="none"
          height={plateHeight - 1.8}
          rx={(plateHeight - 1.8) / 2}
          stroke="#a7afb9"
          strokeWidth={0.7}
          width={plateWidth - 1.8}
          x={-(plateWidth - 1.8) / 2}
          y={-(plateHeight - 1.8) / 2}
        />
      ) : null}
      {[-span / 2, span / 2].map((x, rollerIndex) => (
        <g key={`roller-${rollerIndex}`}>
          <circle cx={x} cy={0} fill="#3f4652" r={roller} />
          <circle cx={x} cy={0} fill="#eef1f4" r={roller * 0.4} />
        </g>
      ))}
    </g>
  );
}

export function StaticChain({ path, spacing }: { path: string; spacing: number }) {
  const plate = Math.max(2.5, Math.min(spacing - 2, spacing * 0.62));

  return (
    <g data-chain-static="true">
      <path
        d={path}
        fill="none"
        stroke="#79828e"
        strokeDasharray={`${plate} ${Math.max(1, spacing - plate)}`}
        strokeLinecap="round"
        strokeWidth={4.6}
      />
      <path
        d={path}
        fill="none"
        stroke="#3f4652"
        strokeDasharray={`2 ${Math.max(1, spacing - 2)}`}
        strokeLinecap="round"
        strokeWidth={2}
      />
    </g>
  );
}

/**
 * The links are expensive to reconcile and SMIL runs outside React, so the
 * chain only re-renders when its own pose changes.
 */
const ChainBand = memo(function ChainBand({ connection }: { connection: ConnectionPose }) {
  const reduced = useReducedMotion() === true;
  const length = Math.max(0, connection.length);
  const pitch = Math.max(1, connection.chainPitch ?? FALLBACK_CHAIN_PITCH);
  const count = Math.max(8, Math.round(length / pitch));
  const spacing = length / count;
  const speed = Math.abs(connection.surfaceSpeed);
  const moving = connection.active && !reduced && length > 0.01 && speed >= MIN_SURFACE_SPEED;
  const loop = Math.round((length / Math.max(MIN_SURFACE_SPEED, speed)) * 1000) / 1000;
  // De gekruiste baan begint met de tegenovergestelde raaklijn: de ketting
  // moet daar de andere kant op bewegen dan bij een open baan.
  const reverse =
    connection.kind === "crossed-belt" ? connection.surfaceSpeed >= 0 : connection.surfaceSpeed < 0;

  return (
    <g
      className="draaiwerk-chain"
      data-chain-links={count}
      data-moving={moving ? "true" : "false"}
      data-reverse={reverse ? "true" : "false"}
      data-speed={connection.surfaceSpeed}
      opacity={connection.active ? 1 : 0.5}
    >
      {moving ? (
        Array.from({ length: count }, (_, index) => {
          const offset =
            Math.round(((index * spacing) / Math.max(MIN_SURFACE_SPEED, speed)) * 1000) / 1000;
          return (
            <g data-chain-link={index} key={`chain-link-${index}`}>
              <animateMotion
                begin={index === 0 ? undefined : `${-offset}s`}
                calcMode="linear"
                dur={`${loop}s`}
                keyPoints={reverse ? "1;0" : undefined}
                keyTimes={reverse ? "0;1" : undefined}
                path={connection.path}
                repeatCount="indefinite"
                rotate="auto"
              />
              <ChainLink outer={index % 2 === 0} span={spacing} />
            </g>
          );
        })
      ) : (
        <StaticChain path={connection.path} spacing={spacing} />
      )}
    </g>
  );
});

function AxleBand({ connection }: { connection: ConnectionPose }) {
  const run = connection.runs?.[0];
  if (!run) {
    return null;
  }

  return (
    <g data-axle="true" opacity={connection.active ? 1 : 0.55}>
      <line
        stroke="#4f5761"
        strokeLinecap="round"
        strokeWidth={9}
        x1={run.from.x}
        x2={run.to.x}
        y1={run.from.y}
        y2={run.to.y}
      />
      <line
        stroke="#aeb6c0"
        strokeLinecap="round"
        strokeWidth={4}
        x1={run.from.x}
        x2={run.to.x}
        y1={run.from.y}
        y2={run.to.y}
      />
      {[run.from, run.to].map((point) => (
        <g key={`${point.x}-${point.y}`}>
          <circle cx={point.x} cy={point.y} fill="#39404f" r={7} stroke="#242a36" strokeWidth={1} />
          <circle cx={point.x} cy={point.y} fill="#e8e3d6" r={2.4} />
        </g>
      ))}
    </g>
  );
}

export function ConnectionBand({ connection }: { connection: ConnectionPose }) {
  return (
    <g
      data-active={connection.active ? "true" : "false"}
      data-connection-key={connection.key}
      data-kind={connection.kind}
    >
      {connection.kind === "axle" ? (
        <AxleBand connection={connection} />
      ) : (
        <ChainBand connection={connection} />
      )}
    </g>
  );
}

/** The drag ghost for a loose chain: static links along the would-be path. */
export function ChainPreview({ path }: { path: string }) {
  return (
    <g data-chain-preview="true" opacity={0.78}>
      <StaticChain path={path} spacing={FALLBACK_CHAIN_PITCH} />
    </g>
  );
}

function miniGear(size: GearSize, x: number, y: number, radius: number) {
  const tone = PLAYER_TONES[size];
  const scale = radius / gearRadius(size);
  return (
    <g key={`${x}-${y}`}>
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <path d={gearPath(size)} fill={tone.fill} stroke={tone.stroke} strokeWidth={2} />
      </g>
      <circle
        cx={x}
        cy={y}
        fill={tone.soft}
        r={radius * 0.58}
        stroke={tone.stroke}
        strokeWidth={1}
      />
      <circle cx={x} cy={y} fill={tone.stroke} r={radius * 0.16} />
    </g>
  );
}

export function TrayArt({ item }: { item: TrayItem }) {
  if (item.kind === "gear") {
    const radius = 9 + item.size * 2.6;
    return (
      <svg aria-hidden="true" className="h-12 w-20" viewBox="0 0 64 44">
        {miniGear(item.size, 32, 22, radius)}
      </svg>
    );
  }

  if (item.kind === "axle") {
    return (
      <svg aria-hidden="true" className="h-12 w-20" viewBox="0 0 64 44">
        <line
          stroke="#4f5761"
          strokeLinecap="round"
          strokeWidth={9}
          x1={14}
          x2={50}
          y1={22}
          y2={22}
        />
        <line
          stroke="#aeb6c0"
          strokeLinecap="round"
          strokeWidth={4}
          x1={14}
          x2={50}
          y1={22}
          y2={22}
        />
        <circle cx={14} cy={22} fill="#39404f" r={7} stroke="#242a36" strokeWidth={1} />
        <circle cx={50} cy={22} fill="#39404f" r={7} stroke="#242a36" strokeWidth={1} />
        <circle cx={14} cy={22} fill="#e8e3d6" r={2.4} />
        <circle cx={50} cy={22} fill="#e8e3d6" r={2.4} />
      </svg>
    );
  }

  if (item.kind === "belt" && item.crossed === true) {
    return (
      <svg aria-hidden="true" className="h-12 w-20" viewBox="0 0 64 44">
        <path
          d="M 18 12 L 46 32"
          stroke="#79828e"
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeWidth={4.6}
        />
        <path
          d="M 18 12 L 46 32"
          stroke="#3f4652"
          strokeDasharray="2 5"
          strokeLinecap="round"
          strokeWidth={2}
        />
        <path
          d="M 46 12 L 18 32"
          stroke="#79828e"
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeWidth={4.6}
        />
        <path
          d="M 46 12 L 18 32"
          stroke="#3f4652"
          strokeDasharray="2 5"
          strokeLinecap="round"
          strokeWidth={2}
        />
        <circle cx={18} cy={22} fill="#39404f" r={8.5} stroke="#242a36" strokeWidth={1} />
        <circle cx={18} cy={22} fill="#e8e3d6" r={3} />
        <circle cx={46} cy={22} fill="#6d78ad" r={8.5} stroke="#4f5d9e" strokeWidth={1} />
        <circle cx={46} cy={22} fill="#e7e8f4" r={3} />
      </svg>
    );
  }

  const loop = "M 20 13.5 L 44 13.5 A 8.5 8.5 0 0 1 44 30.5 L 20 30.5 A 8.5 8.5 0 0 1 20 13.5 Z";
  return (
    <svg aria-hidden="true" className="h-12 w-20" viewBox="0 0 64 44">
      <path
        d={loop}
        fill="none"
        stroke="#79828e"
        strokeDasharray="4 3"
        strokeLinejoin="round"
        strokeWidth={4.6}
      />
      <path
        d={loop}
        fill="none"
        stroke="#3f4652"
        strokeDasharray="2 5"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <circle cx={20} cy={22} fill="#39404f" r={8.5} stroke="#242a36" strokeWidth={1} />
      <circle cx={20} cy={22} fill="#e8e3d6" r={3} />
      <circle cx={44} cy={22} fill="#6d78ad" r={8.5} stroke="#4f5d9e" strokeWidth={1} />
      <circle cx={44} cy={22} fill="#e7e8f4" r={3} />
    </svg>
  );
}
