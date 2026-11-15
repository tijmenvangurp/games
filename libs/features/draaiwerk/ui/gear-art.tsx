import { memo, type CSSProperties, type KeyboardEvent } from "react";
import { useReducedMotion } from "motion/react";
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
const WORM_SHAFT_TONE: GearTone = { fill: "#9aa3ad", stroke: "#646d78", soft: "#eef0f3" };
const WORM_WHEEL_TONE: GearTone = { fill: "#b08a52", stroke: "#7c5c2e", soft: "#f4e9d6" };

export function wormTone(visual: GearPose["visual"]): GearTone | null {
  if (visual === "worm-shaft") {
    return WORM_SHAFT_TONE;
  }
  return visual === "worm-wheel" ? WORM_WHEEL_TONE : null;
}

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
          {pose.visual === "worm-wheel" ? (
            <g opacity={0.55} stroke={tone.stroke} strokeLinecap="round" strokeWidth={1.7}>
              {Array.from({ length: 18 }, (_, index) => {
                const angle = (index / 18) * Math.PI * 2;
                const inner = radius * 0.78;
                const outer = radius * 0.94;
                return (
                  <line
                    key={`wheel-hatch-${index}`}
                    x1={Math.cos(angle) * inner + radius * 0.08}
                    x2={Math.cos(angle) * outer}
                    y1={Math.sin(angle) * inner + radius * 0.08}
                    y2={Math.sin(angle) * outer}
                  />
                );
              })}
            </g>
          ) : null}
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

/** Below this surface speed the band is drawn as if the machine stands still. */
const MIN_SURFACE_SPEED = 0.5;
/**
 * The tread dash is 2 on, 14 off, so the period is 16 board units. The CSS
 * keyframe must travel exactly that far, otherwise the band visibly jumps.
 */
const BELT_TREAD_CYCLE = 16;
/** Only a degenerate chain without a measured pitch falls back to this. */
const FALLBACK_CHAIN_PITCH = 12;
/** A leather drive belt: dark edge, warm body, fine moving sheen. */
export const BELT_EDGE = "#493a29";
export const BELT_BODY = "#6f5a42";
export const BELT_HIGHLIGHT = "#b3a084";

function beltDuration(speed: number): number {
  const seconds = BELT_TREAD_CYCLE / Math.max(MIN_SURFACE_SPEED, Math.abs(speed));
  return Math.round(seconds * 1000) / 1000;
}

interface BeltRibbonProps {
  path: string;
  active: boolean;
  speed: number;
  /** The drag ghost is a little lighter and never animates. */
  preview?: boolean;
}

/**
 * A belt is a closed loop around both pulleys. The thin leather band hugs the
 * tooth tips, so the wrap stays visible and there are no loose end caps.
 */
function BeltRibbon({ path, active, speed, preview = false }: BeltRibbonProps) {
  const moving = active && !preview && Math.abs(speed) >= MIN_SURFACE_SPEED;
  const reversed = speed < 0;

  return (
    <g
      className="draaiwerk-belt"
      data-belt="true"
      data-speed={speed}
      data-moving={moving ? "true" : "false"}
      data-preview={preview ? "true" : "false"}
      opacity={preview ? 0.78 : active ? 1 : 0.55}
      style={{ "--belt-duration": `${beltDuration(speed)}s` } as CSSProperties}
    >
      <path d={path} fill="none" stroke={BELT_EDGE} strokeLinejoin="round" strokeWidth={5.8} />
      <path d={path} fill="none" stroke={BELT_BODY} strokeLinejoin="round" strokeWidth={4.4} />
      <path
        className="draaiwerk-belt-tread"
        d={path}
        data-moving={moving ? "true" : "false"}
        data-reverse={reversed ? "true" : "false"}
        fill="none"
        stroke={BELT_HIGHLIGHT}
        strokeDasharray="1.5 14.5"
        strokeLinecap="round"
        strokeWidth={0.9}
      />
    </g>
  );
}

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
  const reverse = connection.surfaceSpeed < 0;

  return (
    <g
      className="draaiwerk-chain"
      data-chain-links={count}
      data-moving={moving ? "true" : "false"}
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

export function ConnectionBand({ connection }: { connection: ConnectionPose }) {
  return (
    <g
      data-active={connection.active ? "true" : "false"}
      data-connection-key={connection.key}
      data-kind={connection.kind}
    >
      {connection.kind === "chain" ? (
        <ChainBand connection={connection} />
      ) : (
        <BeltRibbon
          active={connection.active}
          path={connection.path}
          speed={connection.surfaceSpeed}
        />
      )}
    </g>
  );
}

/** The drag ghost for a loose belt: the same band, lighter and without motion. */
export function BeltPreview({ path, active = true }: { path: string; active?: boolean }) {
  return <BeltRibbon active={active} path={path} preview speed={0} />;
}

/** The drag ghost for a loose chain: static links along the would-be path. */
export function ChainPreview({ path }: { path: string }) {
  return (
    <g data-chain-preview="true" opacity={0.78}>
      <StaticChain path={path} spacing={FALLBACK_CHAIN_PITCH} />
    </g>
  );
}

export function WormBar({
  level,
  placement,
}: {
  level: Level;
  placement: Extract<Placement, { kind: "worm" }>;
}) {
  const shaft = holeCenter(level, placement.shaftHoleId);
  const wheel = holeCenter(level, placement.wheelHoleId);
  const angle = (Math.atan2(wheel.y - shaft.y, wheel.x - shaft.x) * 180) / Math.PI;
  const length = Math.hypot(wheel.x - shaft.x, wheel.y - shaft.y);
  const threads = Math.max(4, Math.round(length / 12));

  return (
    <g
      data-worm={`${placement.shaftHoleId}:${placement.wheelHoleId}`}
      data-worm-ratio={placement.ratio}
    >
      <g
        transform={`translate(${(shaft.x + wheel.x) / 2} ${(shaft.y + wheel.y) / 2}) rotate(${angle})`}
      >
        <rect
          fill="#b5bcc5"
          height={11}
          rx={5.5}
          stroke="#7d8692"
          strokeWidth={1}
          width={length}
          x={-length / 2}
          y={-5.5}
        />
        <rect
          fill="#eef0f4"
          height={3}
          opacity={0.9}
          rx={1.5}
          width={Math.max(0, length - 8)}
          x={-length / 2 + 4}
          y={-1.5}
        />
        <g
          className="draaiwerk-worm-thread"
          stroke="#5e6772"
          strokeDasharray="2 4"
          strokeLinecap="round"
          strokeWidth={1.8}
        >
          {Array.from({ length: threads }, (_, index) => {
            const x =
              -length / 2 + 7 + (index * Math.max(1, length - 14)) / Math.max(1, threads - 1);
            return <line key={`thread-${index}`} x1={x - 3.5} x2={x + 3.5} y1={-5} y2={5} />;
          })}
        </g>
      </g>
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

  if (item.kind === "worm") {
    const wheelRadius = 6 + item.wheelSize * 2.4;
    return (
      <svg aria-hidden="true" className="h-10 w-16" viewBox="0 0 64 44">
        <rect
          fill="#b5bcc5"
          height={9}
          rx={4.5}
          stroke="#7d8692"
          strokeWidth={1}
          width={42}
          x={5}
          y={12}
        />
        <rect fill="#eef0f4" height={2.4} opacity={0.9} rx={1.2} width={34} x={9} y={15} />
        <g stroke="#5e6772" strokeLinecap="round" strokeWidth={1.3}>
          {Array.from({ length: 8 }, (_, index) => (
            <line
              key={`tray-thread-${index}`}
              x1={9 + index * 4}
              x2={13 + index * 4}
              y1={16}
              y2={20}
            />
          ))}
        </g>
        <circle cx={44} cy={27} fill="#b08a52" r={wheelRadius} stroke="#7c5c2e" strokeWidth={1.2} />
        <g opacity={0.55} stroke="#7c5c2e" strokeLinecap="round" strokeWidth={1}>
          {Array.from({ length: 12 }, (_, index) => {
            const angle = (index / 12) * Math.PI * 2;
            return (
              <line
                key={`tray-wheel-${index}`}
                x1={44 + Math.cos(angle) * wheelRadius * 0.62}
                x2={44 + Math.cos(angle) * wheelRadius * 0.9}
                y1={27 + Math.sin(angle) * wheelRadius * 0.62}
                y2={27 + Math.sin(angle) * wheelRadius * 0.9}
              />
            );
          })}
        </g>
        <circle
          cx={44}
          cy={27}
          fill="#f4e9d6"
          r={wheelRadius * 0.5}
          stroke="#7c5c2e"
          strokeWidth={0.8}
        />
        <circle cx={44} cy={27} fill="#7c5c2e" r={1.8} />
        <circle cx={7} cy={16.5} fill="#9aa3ad" r={4.5} stroke="#646d78" strokeWidth={1} />
      </svg>
    );
  }

  if (item.kind === "belt") {
    const crossed = item.crossed === true;
    const strap = "M 9 27 C 20 15, 38 13, 52 22";
    return (
      <svg aria-hidden="true" className="h-10 w-16" viewBox="0 0 64 44">
        {crossed ? (
          <>
            <path d="M 10 14 L 54 30" stroke={BELT_EDGE} strokeLinecap="round" strokeWidth={8} />
            <path d="M 10 14 L 54 30" stroke={BELT_BODY} strokeLinecap="round" strokeWidth={5.8} />
            <path d="M 54 14 L 10 30" stroke={BELT_EDGE} strokeLinecap="round" strokeWidth={8} />
            <path d="M 54 14 L 10 30" stroke={BELT_BODY} strokeLinecap="round" strokeWidth={5.8} />
          </>
        ) : (
          <>
            <path d={strap} fill="none" stroke={BELT_EDGE} strokeLinecap="round" strokeWidth={9} />
            <path
              d={strap}
              fill="none"
              stroke={BELT_BODY}
              strokeLinecap="round"
              strokeWidth={6.8}
            />
            <path
              d={strap}
              fill="none"
              stroke={BELT_HIGHLIGHT}
              strokeDasharray="1 5"
              strokeLinecap="round"
              strokeWidth={1.2}
            />
            <rect
              fill="none"
              height={15}
              rx={3}
              stroke="#b08a52"
              strokeWidth={2}
              width={13}
              x={43}
              y={14}
            />
            <path d="M 49.5 15 V 28" stroke="#b08a52" strokeWidth={1.6} />
            <circle cx={16} cy={24} fill="#6d4c2f" r={2} />
            <circle cx={23} cy={20} fill="#6d4c2f" r={1.6} />
          </>
        )}
      </svg>
    );
  }

  const loop = "M 20 13.5 L 44 13.5 A 8.5 8.5 0 0 1 44 30.5 L 20 30.5 A 8.5 8.5 0 0 1 20 13.5 Z";
  return (
    <svg aria-hidden="true" className="h-10 w-16" viewBox="0 0 64 44">
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
