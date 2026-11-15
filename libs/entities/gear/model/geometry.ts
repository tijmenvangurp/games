// Involute spur gear outline and the tooth-phase formula are ported from
// mechanism-lab (MIT), https://github.com/jacobplee/mechanism-lab.
// The original licence text lives in LICENSES/mechanism-lab-MIT.txt.
//
// The port keeps the same conventions: y points down like SVG, tooth 0 is
// centred on the local +x axis, and a mesh A -> B uses
//   k = -N_A / N_B
//   C = angle + PI - PI / N_B - k * angle
//   phi_B = k * phi_A + C

import type { GearSize, Hole, Level } from "./types";

/** Distance between two neighbouring pegboard holes. */
const HOLE_SPACING = 28;
/** Teeth module: pitch radius = module * teeth / 2. */
const MODULE = 4;
/** Room around the board so the largest gear and its output glyph fit at the edge. */
const MIN_MARGIN = 76;
/** Low sampling for the game; the full outline is memoized per size. */
const FLANK_POINTS = 10;
const TIP_POINTS = 2;
const ROOT_POINTS = 2;
const PRESSURE_DEG = 20;
const ADDENDUM = 1;
const DEDENDUM = 1.25;

const TAU = Math.PI * 2;
const SVG_DECIMALS = 100;
/** The band runs just outside the tooth tips (tip radius = pitch radius + 4). */
const BELT_OFFSET = 6;
/** Chain links sit on the tooth tips. */
const CHAIN_OFFSET = 4;

export interface Point {
  x: number;
  y: number;
}

export type ConnectionKind = "open-belt" | "crossed-belt" | "chain";

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function round(value: number): number {
  return Math.round(value * SVG_DECIMALS) / SVG_DECIMALS;
}

function polar(origin: Point, radius: number, angle: number): Point {
  return {
    x: origin.x + radius * Math.cos(angle),
    y: origin.y + radius * Math.sin(angle),
  };
}

function formatPoint(point: Point): string {
  return `${round(point.x)} ${round(point.y)}`;
}

function involute(angle: number): number {
  return Math.tan(angle) - angle;
}

export function gearRadius(size: GearSize): number {
  return size * HOLE_SPACING;
}

export function gearTeeth(size: GearSize): number {
  return size * 14;
}

function buildGearPath(size: GearSize): string {
  const teeth = gearTeeth(size);
  const pressure = (PRESSURE_DEG * Math.PI) / 180;
  const pitchRadius = (MODULE * teeth) / 2;
  const baseRadius = pitchRadius * Math.cos(pressure);
  const tipRadius = pitchRadius + ADDENDUM * MODULE;
  const rootRadius = pitchRadius - DEDENDUM * MODULE;
  const pitchAngle = TAU / teeth;
  const halfPitch = Math.PI / (2 * teeth);
  const halfTooth = (radius: number): number =>
    halfPitch + involute(pressure) - involute(Math.acos(clamp(baseRadius / radius, -1, 1)));
  const flankStart = Math.max(baseRadius, rootRadius);

  if (halfTooth(tipRadius) <= 0) {
    throw new Error(`Gear size ${size} comes to a point before the tip circle`);
  }

  const rollStart = Math.sqrt(Math.max(0, (flankStart / baseRadius) ** 2 - 1));
  const rollEnd = Math.sqrt((tipRadius / baseRadius) ** 2 - 1);
  const flank: { radius: number; half: number }[] = [];

  for (let index = 0; index <= FLANK_POINTS; index += 1) {
    const roll = rollStart + ((rollEnd - rollStart) * index) / FLANK_POINTS;
    const radius = baseRadius * Math.sqrt(1 + roll * roll);
    flank.push({ radius, half: halfTooth(radius) });
  }

  const rootHalf = halfTooth(flankStart);
  const points: Point[] = [];

  for (let tooth = 0; tooth < teeth; tooth += 1) {
    const centre = tooth * pitchAngle;

    if (rootRadius < baseRadius) {
      points.push(polar({ x: 0, y: 0 }, rootRadius, centre - rootHalf));
    }
    for (const sample of flank) {
      points.push(polar({ x: 0, y: 0 }, sample.radius, centre - sample.half));
    }
    for (let index = 1; index < TIP_POINTS; index += 1) {
      const half = halfTooth(tipRadius);
      points.push(
        polar({ x: 0, y: 0 }, tipRadius, centre - half + (2 * half * index) / TIP_POINTS),
      );
    }
    for (let index = flank.length - 1; index >= 0; index -= 1) {
      const sample = flank[index] as { radius: number; half: number };
      points.push(polar({ x: 0, y: 0 }, sample.radius, centre + sample.half));
    }
    if (rootRadius < baseRadius) {
      points.push(polar({ x: 0, y: 0 }, rootRadius, centre + rootHalf));
    }
    for (let index = 1; index < ROOT_POINTS; index += 1) {
      points.push(
        polar(
          { x: 0, y: 0 },
          rootRadius,
          centre + rootHalf + ((pitchAngle - 2 * rootHalf) * index) / ROOT_POINTS,
        ),
      );
    }
  }

  const first = points[0];
  if (!first) {
    throw new Error(`Gear size ${size} has no outline`);
  }

  const commands = [`M ${formatPoint(first)}`];
  for (let index = 1; index < points.length; index += 1) {
    commands.push(`L ${formatPoint(points[index] as Point)}`);
  }
  commands.push("Z");

  return commands.join(" ");
}

const gearPathCache = new Map<GearSize, string>();

/** A closed SVG path in local coordinates, with tooth 0 on +x. Memoized per size. */
export function gearPath(size: GearSize): string {
  const cached = gearPathCache.get(size);
  if (cached !== undefined) {
    return cached;
  }
  const path = buildGearPath(size);
  gearPathCache.set(size, path);
  return path;
}

export function holePoint(hole: Hole): Point {
  return { x: hole.col * HOLE_SPACING, y: hole.row * HOLE_SPACING };
}

export function holeCenter(level: Level, holeId: string): Point {
  const hole = level.holes.find((candidate) => candidate.id === holeId);
  if (!hole) {
    throw new Error(`Unknown hole: ${holeId}`);
  }
  return holePoint(hole);
}

export function boardViewBox(level: Level): string {
  let maxSize: GearSize = level.motor.size;
  for (const output of level.outputs) {
    maxSize = Math.max(maxSize, output.size) as GearSize;
  }
  for (const item of level.tray) {
    if (item.kind === "gear") {
      maxSize = Math.max(maxSize, item.size) as GearSize;
    }
    if (item.kind === "worm") {
      maxSize = Math.max(maxSize, item.shaftSize, item.wheelSize) as GearSize;
    }
  }
  for (const placement of level.solution) {
    if (placement.kind === "gear") {
      maxSize = Math.max(maxSize, placement.size) as GearSize;
    }
    if (placement.kind === "worm") {
      maxSize = Math.max(maxSize, placement.shaftSize, placement.wheelSize) as GearSize;
    }
  }

  const margin = Math.max(MIN_MARGIN, gearRadius(maxSize) + 16);
  const width = (level.cols - 1) * HOLE_SPACING + margin * 2;
  const height = (level.rows - 1) * HOLE_SPACING + margin * 2;
  return `${-margin} ${-margin} ${width} ${height}`;
}

function straightPath(from: Point, to: Point): string {
  return `M ${formatPoint(from)} L ${formatPoint(to)} Z`;
}

function connectionFrame(from: Point, to: Point): { distance: number; angle: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return {
    distance: Math.hypot(dx, dy),
    angle: Math.atan2(dy, dx),
  };
}

function openBeltPath(from: Point, fromRadius: number, to: Point, toRadius: number): string {
  const { distance, angle } = connectionFrame(from, to);
  if (distance === 0) {
    return straightPath(from, to);
  }

  const phi = Math.acos(clamp((fromRadius - toRadius) / distance, -1, 1));
  const start = angle + phi;
  const end = angle - phi;
  const fromStart = polar(from, fromRadius, start);
  const fromEnd = polar(from, fromRadius, end);
  const toStart = polar(to, toRadius, start);
  const toEnd = polar(to, toRadius, end);
  const largeFrom = TAU - 2 * phi > Math.PI ? 1 : 0;
  const largeTo = 2 * phi > Math.PI ? 1 : 0;

  return [
    `M ${formatPoint(fromStart)}`,
    `A ${round(fromRadius)} ${round(fromRadius)} 0 ${largeFrom} 1 ${formatPoint(fromEnd)}`,
    `L ${formatPoint(toEnd)}`,
    `A ${round(toRadius)} ${round(toRadius)} 0 ${largeTo} 1 ${formatPoint(toStart)}`,
    "Z",
  ].join(" ");
}

function crossedBeltPath(from: Point, fromRadius: number, to: Point, toRadius: number): string {
  const { distance, angle } = connectionFrame(from, to);
  if (distance === 0) {
    return straightPath(from, to);
  }

  const gamma = Math.acos(clamp((fromRadius + toRadius) / distance, -1, 1));
  const fromTop = polar(from, fromRadius, angle + gamma);
  const toTop = polar(to, toRadius, angle + gamma + Math.PI);
  const toBottom = polar(to, toRadius, angle - gamma + Math.PI);
  const fromBottom = polar(from, fromRadius, angle - gamma);
  const large = 2 * gamma > Math.PI ? 1 : 0;

  return [
    `M ${formatPoint(fromTop)}`,
    `L ${formatPoint(toTop)}`,
    `A ${round(toRadius)} ${round(toRadius)} 0 ${large} 0 ${formatPoint(toBottom)}`,
    `L ${formatPoint(fromBottom)}`,
    `A ${round(fromRadius)} ${round(fromRadius)} 0 ${large} 1 ${formatPoint(fromTop)}`,
    "Z",
  ].join(" ");
}

/** Belt and chain outline in board coordinates, around the outside of the wheels. */
export function connectionPath(
  kind: ConnectionKind,
  from: Point,
  fromRadius: number,
  to: Point,
  toRadius: number,
): string {
  const offset = kind === "chain" ? CHAIN_OFFSET : BELT_OFFSET;
  return kind === "crossed-belt"
    ? crossedBeltPath(from, fromRadius + offset, to, toRadius + offset)
    : openBeltPath(from, fromRadius + offset, to, toRadius + offset);
}
