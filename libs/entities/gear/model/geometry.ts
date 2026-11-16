// Involute spur gear outline and the tooth-phase formula are ported from
// mechanism-lab (MIT), https://github.com/jacobplee/mechanism-lab.
// The original licence text lives in LICENSES/mechanism-lab-MIT.txt.
//
// The port keeps the same conventions: y points down like SVG, tooth 0 is
// centred on the local +x axis, and a mesh A -> B uses
//   k = -N_A / N_B
//   C = angle + PI - PI / N_B - k * angle
//   phi_B = k * phi_A + C

import type { BeltRun, GearSize, Hole, Level } from "./types";

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
/** Every link is drawn as a chain on the pitch circle, between the teeth. */
const BELT_OFFSET = 0;
/** Chain rollers sit on the pitch circle, between the teeth. */
const CHAIN_OFFSET = 0;

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

/** Radius at the tooth tips; the involute teeth stick out past the pitch circle. */
export function gearTipRadius(size: GearSize): number {
  return gearRadius(size) + ADDENDUM * MODULE;
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

export interface BoardRect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/** The visible board, including room for the largest gear and a worm shaft. */
export function boardRect(level: Level): BoardRect {
  let maxSize: GearSize = level.motor.size;
  for (const output of level.outputs) {
    maxSize = Math.max(maxSize, output.size) as GearSize;
  }
  for (const item of level.tray) {
    if (item.kind === "gear") {
      maxSize = Math.max(maxSize, item.size) as GearSize;
    }
  }
  for (const placement of level.solution) {
    if (placement.kind === "gear") {
      maxSize = Math.max(maxSize, placement.size) as GearSize;
    }
  }

  const hasWorm =
    level.tray.some((item) => item.kind === "worm") ||
    level.solution.some((placement) => placement.kind === "worm");
  const margin = Math.max(
    MIN_MARGIN,
    gearRadius(maxSize) + 16,
    hasWorm ? gearRadius(maxSize) + WORM_BOARD_MARGIN : 0,
  );
  const width = (level.cols - 1) * HOLE_SPACING + margin * 2;
  const height = (level.rows - 1) * HOLE_SPACING + margin * 2;
  return {
    minX: -margin,
    minY: -margin,
    maxX: -margin + width,
    maxY: -margin + height,
    width,
    height,
  };
}

export function boardViewBox(level: Level): string {
  const rect = boardRect(level);
  return `${rect.minX} ${rect.minY} ${rect.width} ${rect.height}`;
}

/** Distance from the wheel's pitch circle to the worm shaft's centreline. */
export const WORM_SHAFT_CLEARANCE = 9;
/** Half the shaft body's thickness. */
export const WORM_SHAFT_RADIUS = 8;
/** Room for the shaft, its bearings and the board edge. */
const WORM_BOARD_MARGIN = 30;
/** Threaded length beyond the two contact points. */
const WORM_OVERHANG = 18;
/** Bearing stubs stick out past the threaded body. */
const WORM_BEARING_OVERHANG = 6;
const WORM_MIN_LENGTH = 70;

interface WormTangent {
  /** Contact point on the first wheel's pitch circle. */
  from: Point;
  /** Contact point on the second wheel's pitch circle. */
  to: Point;
  /** Unit vector from `from` to `to`. */
  direction: Point;
  /** Unit normal pointing from the wheels toward the shaft. */
  normal: Point;
  /** Distance between the two contact points. */
  span: number;
}

/**
 * The two common external tangents between two pitch circles. A worm shaft
 * can only touch both wheels on the same side, so internal tangents are not
 * offered. Returns null when the circles overlap or one sits inside the other.
 */
function wormTangents(
  from: Point,
  fromRadius: number,
  to: Point,
  toRadius: number,
): readonly [WormTangent, WormTangent] | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const difference = fromRadius - toRadius;
  if (distance <= Math.abs(difference) + 1e-6) {
    return null;
  }

  const ex = dx / distance;
  const ey = dy / distance;
  const along = difference / distance;
  const across = Math.sqrt(Math.max(0, 1 - along * along));

  const build = (normal: Point): WormTangent => {
    const start = {
      x: from.x + fromRadius * normal.x,
      y: from.y + fromRadius * normal.y,
    };
    const end = {
      x: to.x + toRadius * normal.x,
      y: to.y + toRadius * normal.y,
    };
    const span = Math.hypot(end.x - start.x, end.y - start.y);
    return {
      from: start,
      to: end,
      normal,
      direction:
        span > 1e-9 ? { x: (end.x - start.x) / span, y: (end.y - start.y) / span } : { x: 1, y: 0 },
      span,
    };
  };

  return [
    build({ x: along * ex - across * ey, y: along * ey + across * ex }),
    build({ x: along * ex + across * ey, y: along * ey - across * ex }),
  ];
}

export interface WormShaft {
  /** Centre of the threaded shaft body. */
  centre: Point;
  /** Rotation of the shaft, along the common tangent. */
  angle: number;
  length: number;
  coils: number;
  pitch: number;
  /** Distance between the two contact points. */
  span: number;
  /** The two points where the threads meet the pitch circles. */
  contacts: readonly [Point, Point];
  fromRadius: number;
  toRadius: number;
  /** True when the whole shaft, including its bearings, is on the board. */
  fits: boolean;
}

function addPoint(point: Point, offset: Point, scale = 1): Point {
  return { x: point.x + offset.x * scale, y: point.y + offset.y * scale };
}

function insideRect(rect: BoardRect, point: Point): boolean {
  return (
    point.x >= rect.minX && point.x <= rect.maxX && point.y >= rect.minY && point.y <= rect.maxY
  );
}

/**
 * Places one worm shaft on the common tangent of two wheels. Both wheels stay
 * on the same side of the shaft, so they turn the same way. The shaft body is
 * lifted off the pitch line by `WORM_SHAFT_CLEARANCE`, which lets its lower
 * edge sink into the tooth tips without touching the wheel body.
 */
export function wormShaft(
  from: Point,
  fromRadius: number,
  to: Point,
  toRadius: number,
  bounds: BoardRect,
): WormShaft | null {
  const tangents = wormTangents(from, fromRadius, to, toRadius);
  if (!tangents) {
    return null;
  }

  const candidates = tangents.map((tangent) => {
    const axisFrom = addPoint(tangent.from, tangent.normal, WORM_SHAFT_CLEARANCE);
    const axisTo = addPoint(tangent.to, tangent.normal, WORM_SHAFT_CLEARANCE);
    const length = Math.max(WORM_MIN_LENGTH, tangent.span + WORM_OVERHANG * 2);
    const centre = {
      x: (axisFrom.x + axisTo.x) / 2,
      y: (axisFrom.y + axisTo.y) / 2,
    };
    const half = length / 2 + WORM_BEARING_OVERHANG;
    const corners: Point[] = [];
    for (const along of [-half, half]) {
      const end = addPoint(centre, tangent.direction, along);
      for (const across of [-WORM_SHAFT_RADIUS, WORM_SHAFT_RADIUS]) {
        corners.push(addPoint(end, tangent.normal, across));
      }
    }
    const coils = Math.max(3, Math.round(length / 14));
    const shaft: WormShaft = {
      centre,
      angle: Math.atan2(tangent.direction.y, tangent.direction.x),
      length,
      coils,
      pitch: length / coils,
      span: tangent.span,
      contacts: [tangent.from, tangent.to],
      fromRadius,
      toRadius,
      fits: corners.every((corner) => insideRect(bounds, corner)),
    };
    // Prefer the shaft above the wheels; for a vertical pair, on the left.
    const score = -tangent.normal.y * 2 - tangent.normal.x;
    return { shaft, score };
  });

  candidates.sort((first, second) => {
    if (first.shaft.fits !== second.shaft.fits) {
      return first.shaft.fits ? -1 : 1;
    }
    return second.score - first.score;
  });

  return candidates[0]?.shaft ?? null;
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

interface TangentGeometry {
  /** Afstand tussen de twee hartpunten. */
  distance: number;
  /** Halve omslaghoek tussen de twee raaklijnen. */
  sweep: number;
  /** De twee rechte banden, elk van velg naar velg. */
  runs: readonly [BeltRun, BeltRun];
}

/** Afstand tussen twee punten in board-eenheden. */
function pointDistance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * De raaklijnen en de omslaghoek voor een open of gekruiste riem.
 * Beide poelies krijgen dezelfde halve omslaghoek; bij een gekruiste riem
 * ligt het raakpunt op de tweede poelie aan de andere kant van de band.
 */
function tangentGeometry(
  crossed: boolean,
  from: Point,
  fromRadius: number,
  to: Point,
  toRadius: number,
): TangentGeometry {
  const { distance, angle } = connectionFrame(from, to);
  if (distance === 0) {
    // Samenvallende hartpunten: er is geen raaklijn, dus geen band.
    const run: BeltRun = { from, to };
    return { distance, sweep: 0, runs: [run, run] };
  }

  const ratio = crossed ? (fromRadius + toRadius) / distance : (fromRadius - toRadius) / distance;
  const sweep = Math.acos(clamp(ratio, -1, 1));
  const flip = crossed ? Math.PI : 0;
  const runAt = (offset: number): BeltRun => ({
    from: polar(from, fromRadius, angle + offset),
    to: polar(to, toRadius, angle + offset + flip),
  });

  return { distance, sweep, runs: [runAt(sweep), runAt(-sweep)] };
}

function mixPoint(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function mixRuns(
  open: readonly [BeltRun, BeltRun],
  crossed: readonly [BeltRun, BeltRun],
  t: number,
): readonly [BeltRun, BeltRun] {
  const mix = (a: BeltRun, b: BeltRun): BeltRun => ({
    from: mixPoint(a.from, b.from, t),
    to: mixPoint(a.to, b.to, t),
  });
  return [mix(open[0], crossed[0]), mix(open[1], crossed[1])];
}

function openBeltPath(from: Point, fromRadius: number, to: Point, toRadius: number): string {
  const { distance, sweep, runs } = tangentGeometry(false, from, fromRadius, to, toRadius);
  if (distance === 0) {
    return straightPath(from, to);
  }

  const [top, bottom] = runs;
  const largeFrom = TAU - 2 * sweep > Math.PI ? 1 : 0;
  const largeTo = 2 * sweep > Math.PI ? 1 : 0;

  return [
    `M ${formatPoint(top.from)}`,
    `A ${round(fromRadius)} ${round(fromRadius)} 0 ${largeFrom} 1 ${formatPoint(bottom.from)}`,
    `L ${formatPoint(bottom.to)}`,
    `A ${round(toRadius)} ${round(toRadius)} 0 ${largeTo} 1 ${formatPoint(top.to)}`,
    "Z",
  ].join(" ");
}

function crossedBeltPath(from: Point, fromRadius: number, to: Point, toRadius: number): string {
  const { distance, sweep, runs } = tangentGeometry(true, from, fromRadius, to, toRadius);
  if (distance === 0) {
    return straightPath(from, to);
  }

  const [top, bottom] = runs;
  // Een gekruiste ketting loopt aan de buitenkant om beide poelies; dat is de
  // lange boog, niet de korte boog aan de kant van de andere poelie.
  const large = 1;

  return [
    `M ${formatPoint(top.from)}`,
    `L ${formatPoint(top.to)}`,
    `A ${round(toRadius)} ${round(toRadius)} 0 ${large} 1 ${formatPoint(bottom.to)}`,
    `L ${formatPoint(bottom.from)}`,
    `A ${round(fromRadius)} ${round(fromRadius)} 0 ${large} 0 ${formatPoint(top.from)}`,
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

/**
 * De twee rechte banden tussen twee poelies.
 * crossing = 0 is open, crossing = 1 is gekruist; tussenliggende waarden
 * schuiven de raakpunten mee voor de morph. De richting van de segmenten is
 * niet betekenisvol; de tekenlaag kiest per band de dashrichting.
 */
export function beltTangentRuns(
  from: Point,
  fromRadius: number,
  to: Point,
  toRadius: number,
  crossing = 0,
): readonly [BeltRun, BeltRun] {
  const t = clamp(crossing, 0, 1);
  const open = tangentGeometry(false, from, fromRadius, to, toRadius).runs;
  if (t === 0) {
    return open;
  }

  const crossed = tangentGeometry(true, from, fromRadius, to, toRadius).runs;
  return t === 1 ? crossed : mixRuns(open, crossed, t);
}

/**
 * Lengte van het gesloten pad, voor de kettingsteek en de SMIL-duur.
 * Telt de twee bogen en de twee rechte stukken van precies het pad dat
 * `connectionPath` tekent, inclusief dezelfde offset per verbindingstype.
 */
export function connectionLength(
  kind: ConnectionKind,
  from: Point,
  fromRadius: number,
  to: Point,
  toRadius: number,
): number {
  const offset = kind === "chain" ? CHAIN_OFFSET : BELT_OFFSET;
  const fromRim = fromRadius + offset;
  const toRim = toRadius + offset;
  const crossed = kind === "crossed-belt";
  const { distance, sweep, runs } = tangentGeometry(crossed, from, fromRim, to, toRim);
  if (distance === 0) {
    return 0;
  }

  const straight =
    pointDistance(runs[0].from, runs[0].to) + pointDistance(runs[1].from, runs[1].to);
  if (sweep === 0 || sweep === Math.PI) {
    // De raakpunten vallen op een poelie samen, dus SVG slaat die boog over.
    // Dit gebeurt alleen als de poelies elkaar raken of overlappen.
    return straight;
  }
  // Een open riem omsluit de grootste poelie over de lange boog en de kleine
  // over de korte; een gekruiste riem heeft op beide poelies de lange boog.
  const arcs = crossed
    ? (TAU - 2 * sweep) * (fromRim + toRim)
    : (TAU - 2 * sweep) * fromRim + 2 * sweep * toRim;

  return arcs + straight;
}
