import { formatSpeed } from "../model/labels";

interface SpeedGaugeProps {
  label: string;
  /** Signed speed relative to the motor. */
  speed: number;
  minSpeed?: number;
  maxSpeed?: number;
  satisfied: boolean;
}

const CENTER_X = 46;
const CENTER_Y = 44;
const RADIUS = 32;

function pointOnArc(fraction: number): { x: number; y: number } {
  const angle = Math.PI + fraction * Math.PI;
  return {
    x: CENTER_X + Math.cos(angle) * RADIUS,
    y: CENTER_Y + Math.sin(angle) * RADIUS,
  };
}

function arcPath(start: number, end: number): string {
  const from = pointOnArc(start);
  const to = pointOnArc(end);
  return `M ${from.x} ${from.y} A ${RADIUS} ${RADIUS} 0 0 1 ${to.x} ${to.y}`;
}

function scaleMaxFor(minSpeed: number | undefined, maxSpeed: number | undefined): number {
  const raw = Math.max(2, (minSpeed ?? 0) * 1.4, (maxSpeed ?? 0) * 1.4);
  return Math.ceil(raw * 2) / 2;
}

function zoneBounds(
  minSpeed: number | undefined,
  maxSpeed: number | undefined,
  scaleMax: number,
): [number, number, number, number] {
  if (minSpeed !== undefined && maxSpeed !== undefined) {
    return [0, minSpeed, maxSpeed, scaleMax];
  }
  if (minSpeed !== undefined) {
    return [0, minSpeed / 2, minSpeed, scaleMax];
  }
  const max = maxSpeed ?? scaleMax;
  return [0, max / 2, max, scaleMax];
}

function satisfies(value: number, minSpeed: number | undefined, maxSpeed: number | undefined) {
  return (
    (minSpeed === undefined || value >= minSpeed) && (maxSpeed === undefined || value <= maxSpeed)
  );
}

export function SpeedGauge({ label, speed, minSpeed, maxSpeed, satisfied }: SpeedGaugeProps) {
  const value = Math.min(Math.abs(speed), scaleMaxFor(minSpeed, maxSpeed));
  const scaleMax = scaleMaxFor(minSpeed, maxSpeed);
  const [zero, low, high, top] = zoneBounds(minSpeed, maxSpeed, scaleMax);
  const fractions = [zero, low, high, top].map((bound) => bound / scaleMax);
  const needleAngle = Math.PI + (value / scaleMax) * Math.PI;
  const needle = {
    x: CENTER_X + Math.cos(needleAngle) * (RADIUS - 7),
    y: CENTER_Y + Math.sin(needleAngle) * (RADIUS - 7),
  };
  const verdict = satisfied
    ? "goed"
    : value === 0
      ? "stil"
      : minSpeed !== undefined && value < minSpeed
        ? "te langzaam"
        : maxSpeed !== undefined && value > maxSpeed
          ? "te snel"
          : "nog niet goed";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg
        aria-label={`Snelheid ${label.toLowerCase()}: ${formatSpeed(value)} keer de motor, ${verdict}`}
        className="h-12 w-24"
        role="img"
        viewBox="0 0 92 56"
      >
        <path
          d={arcPath(0, 1)}
          fill="none"
          stroke="var(--muted)"
          strokeLinecap="round"
          strokeWidth={8}
        />
        {[0, 1, 2].map((index) => {
          const start = fractions[index] as number;
          const end = fractions[index + 1] as number;
          if (end - start < 0.002) {
            return null;
          }
          const middle = (start + end) / 2;
          const good = satisfies(zero + (top - zero) * middle, minSpeed, maxSpeed);
          return (
            <path
              key={index}
              d={arcPath(start + 0.008, end - 0.008)}
              fill="none"
              opacity={good ? 0.5 : 0.2}
              stroke={good ? "var(--success)" : "var(--foreground)"}
              strokeLinecap="butt"
              strokeWidth={8}
            />
          );
        })}
        <line
          stroke="var(--foreground)"
          strokeLinecap="round"
          strokeWidth={2.2}
          x1={CENTER_X}
          x2={needle.x}
          y1={CENTER_Y}
          y2={needle.y}
        />
        <circle cx={CENTER_X} cy={CENTER_Y} fill="var(--foreground)" r={3.2} />
        <text
          fill="var(--foreground)"
          fontSize={8.5}
          fontWeight={800}
          textAnchor="middle"
          x={CENTER_X}
          y={13}
        >
          {formatSpeed(value)}×
        </text>
        <text fill="var(--muted-foreground)" fontSize={7} textAnchor="start" x={8} y={54}>
          0
        </text>
        <text fill="var(--muted-foreground)" fontSize={7} textAnchor="end" x={84} y={54}>
          {formatSpeed(scaleMax)}×
        </text>
      </svg>
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
