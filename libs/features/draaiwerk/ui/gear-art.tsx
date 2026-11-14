import type { KeyboardEvent } from "react";
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
          y={label === "Motor" ? pose.center.y - radius - 30 : pose.center.y + radius + 40}
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
  return (
    <circle
      aria-label={label ? `${label}, tandwiel` : "Tandwiel"}
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

export function ConnectionBand({ connection }: { connection: ConnectionPose }) {
  const chain = connection.kind === "chain";
  return (
    <g
      data-active={connection.active ? "true" : "false"}
      data-connection-key={connection.key}
      data-kind={connection.kind}
      opacity={connection.active ? 1 : 0.5}
    >
      <path
        d={connection.path}
        fill="none"
        stroke={chain ? "#9aa1ab" : "#d6cfbf"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={chain ? 5 : 7}
      />
      <path
        className={connection.active ? "draaiwerk-belt-dash" : undefined}
        d={connection.path}
        fill="none"
        stroke={chain ? "#5b6470" : "#8a91a1"}
        strokeDasharray={chain ? "1.5 6" : "5 7"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={chain ? 2.6 : 1.5}
      />
    </g>
  );
}

export function AxleBar({
  level,
  placement,
}: {
  level: Level;
  placement: Extract<Placement, { kind: "lying-as" }>;
}) {
  const first = holeCenter(level, placement.holeA);
  const second = holeCenter(level, placement.holeB);
  const angle = (Math.atan2(second.y - first.y, second.x - first.x) * 180) / Math.PI;
  const length = Math.hypot(second.x - first.x, second.y - first.y);

  return (
    <g data-lying-as={`${placement.holeA}:${placement.holeB}`}>
      <g
        transform={`translate(${(first.x + second.x) / 2} ${(first.y + second.y) / 2}) rotate(${angle})`}
      >
        <rect
          fill="#c7cbd3"
          height={10}
          rx={5}
          stroke="#8d94a1"
          strokeWidth={1}
          width={length}
          x={-length / 2}
          y={-5}
        />
        <rect
          fill="#eef0f4"
          height={3.5}
          opacity={0.9}
          rx={1.75}
          width={Math.max(0, length - 8)}
          x={-length / 2 + 4}
          y={-1.75}
        />
      </g>
      <circle cx={first.x} cy={first.y} fill="#aab1bd" r={7} stroke="#7c8492" strokeWidth={1} />
      <circle cx={second.x} cy={second.y} fill="#aab1bd" r={7} stroke="#7c8492" strokeWidth={1} />
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
      <svg aria-hidden="true" className="h-10 w-16" viewBox="0 0 64 44">
        {miniGear(item.size, 32, 22, radius)}
      </svg>
    );
  }

  if (item.kind === "lying-as") {
    const firstRadius = 6 + item.sizeA * 2.4;
    const secondRadius = 6 + item.sizeB * 2.4;
    return (
      <svg aria-hidden="true" className="h-10 w-16" viewBox="0 0 64 44">
        <line stroke="#c7cbd3" strokeWidth={5} x1={23} x2={41} y1={20} y2={20} />
        <line stroke="#8d94a1" strokeWidth={1} x1={23} x2={41} y1={20} y2={20} />
        {miniGear(item.sizeA, 22, 20, firstRadius)}
        {miniGear(item.sizeB, 42, 20, secondRadius)}
        <text fill="var(--muted-foreground)" fontSize={7} textAnchor="middle" x={22} y={40}>
          A
        </text>
        <text fill="var(--muted-foreground)" fontSize={7} textAnchor="middle" x={42} y={40}>
          B
        </text>
      </svg>
    );
  }

  const crossed = item.kind === "belt" && item.crossed === true;
  const chain = item.kind === "chain";
  return (
    <svg aria-hidden="true" className="h-10 w-16" viewBox="0 0 64 44">
      {crossed ? (
        <>
          <path d="M 18 13 L 46 31" stroke="#8a91a1" strokeWidth={2} />
          <path d="M 46 13 L 18 31" stroke="#8a91a1" strokeWidth={2} />
        </>
      ) : (
        <path
          d="M 18 13 L 46 13 A 7 7 0 0 1 46 31 L 18 31 A 7 7 0 0 1 18 13 Z"
          fill="var(--muted)"
          stroke="#8a91a1"
          strokeDasharray={chain ? "2 4" : undefined}
          strokeWidth={chain ? 2.4 : 1.6}
        />
      )}
      <circle cx={18} cy={22} fill="#8d94c0" r={8} stroke="#5b6494" strokeWidth={1} />
      <circle cx={18} cy={22} fill="#e8e9f4" r={3} />
      <circle cx={46} cy={22} fill="#8d94c0" r={8} stroke="#5b6494" strokeWidth={1} />
      <circle cx={46} cy={22} fill="#e8e9f4" r={3} />
    </svg>
  );
}
