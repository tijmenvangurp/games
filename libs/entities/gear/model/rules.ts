import {
  beltTangentRuns,
  connectionLength,
  connectionPath,
  gearRadius,
  gearTeeth,
  holePoint,
  type Point,
} from "./geometry";
import { getTexts } from "@shared/i18n";
import { allLevels } from "./levels";
import { gearTexts } from "./texts";
import type {
  ConnectionPose,
  DriveResult,
  GearPose,
  GearSize,
  Hole,
  Level,
  Output,
  OutputPose,
  Placement,
  PoseConnectionKind,
  TrayItem,
} from "./types";

const SPEED_EPSILON = 1e-9;
const MESH_TOLERANCE = 1;
const CONTACT_TOLERANCE = 1;
/** De motor doet één omwenteling in 6 seconden. */
const MOTOR_TURN_SECONDS = 6;
const MOTOR_ANGULAR_SPEED = (Math.PI * 2) / MOTOR_TURN_SECONDS;

interface GearNode {
  key: string;
  holeId: string;
  size: GearSize;
  center: Point;
}

interface GearEdge {
  kind: "mesh" | "rigid" | PoseConnectionKind;
  from: string;
  to: string;
  /** Signed speed factor from `from` to `to`. */
  speedFactor: number;
  phase: "mesh" | "rigid" | "free";
}

interface Rotor {
  speed: number;
  phase: number;
  driven: boolean;
  jammed: boolean;
}

interface GearSlot {
  holeId: string;
  size: GearSize;
  group?: string;
}

function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function sameSpeed(a: number, b: number): boolean {
  return Math.abs(a - b) <= SPEED_EPSILON * Math.max(1, Math.abs(a), Math.abs(b));
}

function buildNodes(level: Level, placements: readonly Placement[]): GearNode[] {
  const nodes: GearNode[] = [];
  const holeIds = new Set(level.holes.map((hole) => hole.id));
  const occupied = new Set<string>();

  const add = (node: Omit<GearNode, "center">): void => {
    const hole = level.holes.find((candidate) => candidate.id === node.holeId);
    if (!hole || occupied.has(node.holeId)) {
      return;
    }
    occupied.add(node.holeId);
    nodes.push({ ...node, center: holePoint(hole) });
  };

  add({
    key: "motor",
    holeId: level.motor.holeId,
    size: level.motor.size,
  });

  for (const output of level.outputs) {
    add({
      key: `output:${output.id}`,
      holeId: output.holeId,
      size: output.size,
    });
  }

  for (const placement of placements) {
    if (placement.kind === "gear") {
      add({
        key: `gear:${placement.holeId}`,
        holeId: placement.holeId,
        size: placement.size,
      });
    }
  }

  return nodes;
}

function addEdge(adjacency: Map<string, GearEdge[]>, edge: GearEdge): void {
  const list = adjacency.get(edge.from);
  if (list) {
    list.push(edge);
  } else {
    adjacency.set(edge.from, [edge]);
  }
}

/** The two gear nodes a placement connects, or null when one end is missing. */
function placementNodes(
  byHole: ReadonlyMap<string, GearNode>,
  fromHoleId: string,
  toHoleId: string,
): { from: GearNode; to: GearNode } | null {
  const from = byHole.get(fromHoleId);
  const to = byHole.get(toHoleId);
  if (!from || !to || from.key === to.key) {
    return null;
  }
  return { from, to };
}

function buildEdges(
  nodes: readonly GearNode[],
  placements: readonly Placement[],
): Map<string, GearEdge[]> {
  const adjacency = new Map<string, GearEdge[]>();

  for (let first = 0; first < nodes.length; first += 1) {
    for (let second = first + 1; second < nodes.length; second += 1) {
      const a = nodes[first] as GearNode;
      const b = nodes[second] as GearNode;
      const contact = gearRadius(a.size) + gearRadius(b.size);
      if (Math.abs(distanceBetween(a.center, b.center) - contact) > MESH_TOLERANCE) {
        continue;
      }
      const ratio = gearTeeth(a.size) / gearTeeth(b.size);
      addEdge(adjacency, {
        kind: "mesh",
        from: a.key,
        to: b.key,
        speedFactor: -ratio,
        phase: "mesh",
      });
      addEdge(adjacency, {
        kind: "mesh",
        from: b.key,
        to: a.key,
        speedFactor: -1 / ratio,
        phase: "mesh",
      });
    }
  }

  const byHole = new Map(nodes.map((node) => [node.holeId, node]));

  for (const placement of placements) {
    if (placement.kind === "axle") {
      const ends = placementNodes(byHole, placement.fromHoleId, placement.toHoleId);
      if (!ends) {
        continue;
      }
      const { from, to } = ends;
      // Een as is star: beide wielen draaien even snel en dezelfde kant op.
      for (const [source, target] of [
        [from, to],
        [to, from],
      ] as const) {
        addEdge(adjacency, {
          kind: "axle",
          from: source.key,
          to: target.key,
          speedFactor: 1,
          phase: "rigid",
        });
      }
      continue;
    }
    if (
      placement.kind !== "open-belt" &&
      placement.kind !== "crossed-belt" &&
      placement.kind !== "chain"
    ) {
      continue;
    }
    const ends = placementNodes(byHole, placement.fromHoleId, placement.toHoleId);
    if (!ends) {
      continue;
    }
    const { from, to } = ends;
    const direction = placement.kind === "crossed-belt" ? -1 : 1;
    const ratio = gearRadius(from.size) / gearRadius(to.size);
    addEdge(adjacency, {
      kind: placement.kind,
      from: from.key,
      to: to.key,
      speedFactor: direction * ratio,
      phase: "free",
    });
    addEdge(adjacency, {
      kind: placement.kind,
      from: to.key,
      to: from.key,
      speedFactor: direction / ratio,
      phase: "free",
    });
  }

  return adjacency;
}

function phaseAfter(edge: GearEdge, fromPhase: number, from: GearNode, to: GearNode): number {
  if (edge.phase === "mesh") {
    const angle = Math.atan2(to.center.y - from.center.y, to.center.x - from.center.x);
    const fromTeeth = gearTeeth(from.size);
    const toTeeth = gearTeeth(to.size);
    const ratio = -fromTeeth / toTeeth;
    const offset = angle + Math.PI - Math.PI / toTeeth - ratio * angle;
    return ratio * fromPhase + offset;
  }
  if (edge.phase === "rigid") {
    return fromPhase;
  }
  return fromPhase * edge.speedFactor;
}

function isOutputSatisfied(output: Output, speed: number, driven: boolean): boolean {
  if (!driven || speed === 0) {
    return false;
  }
  const direction: 1 | -1 = speed > 0 ? 1 : -1;
  if (output.direction !== undefined && direction !== output.direction) {
    return false;
  }
  const magnitude = Math.abs(speed);
  if (output.minSpeed !== undefined && magnitude < output.minSpeed - SPEED_EPSILON) {
    return false;
  }
  if (output.maxSpeed !== undefined && magnitude > output.maxSpeed + SPEED_EPSILON) {
    return false;
  }
  return true;
}

export function drive(level: Level, placements: readonly Placement[]): DriveResult {
  const nodes = buildNodes(level, placements);
  const adjacency = buildEdges(nodes, placements);
  const nodeByKey = new Map(nodes.map((node) => [node.key, node]));
  const holeToNode = new Map(nodes.map((node) => [node.holeId, node]));

  const rotors = new Map<string, Rotor>();
  rotors.set("motor", {
    speed: level.motor.direction,
    phase: 0,
    driven: true,
    jammed: false,
  });

  let jammed = false;
  const queue: string[] = ["motor"];
  while (queue.length > 0) {
    const key = queue.shift() as string;
    const current = rotors.get(key) as Rotor;

    for (const edge of adjacency.get(key) ?? []) {
      const source = nodeByKey.get(key);
      const target = nodeByKey.get(edge.to);
      if (!source || !target) {
        continue;
      }
      const expected = current.speed * edge.speedFactor;
      const existing = rotors.get(edge.to);
      if (!existing) {
        rotors.set(edge.to, {
          speed: expected,
          phase: phaseAfter(edge, current.phase, source, target),
          driven: true,
          jammed: false,
        });
        queue.push(edge.to);
      } else if (!sameSpeed(existing.speed, expected)) {
        existing.jammed = true;
        current.jammed = true;
        jammed = true;
      }
    }
  }

  const gears: GearPose[] = nodes.map((node) => {
    const rotor = rotors.get(node.key);
    const speed = rotor ? rotor.speed : 0;
    return {
      key: node.key,
      holeId: node.holeId,
      center: node.center,
      size: node.size,
      direction: speed >= 0 ? 1 : -1,
      speed,
      phase: rotor ? rotor.phase : 0,
      layer: "front",
      driven: rotor ? rotor.driven : false,
      jammed: rotor ? rotor.jammed : false,
    };
  });

  const connections: ConnectionPose[] = [];
  for (const placement of placements) {
    if (
      placement.kind !== "axle" &&
      placement.kind !== "open-belt" &&
      placement.kind !== "crossed-belt" &&
      placement.kind !== "chain"
    ) {
      continue;
    }
    const from = holeToNode.get(placement.fromHoleId);
    const to = holeToNode.get(placement.toHoleId);
    if (!from || !to || from.key === to.key) {
      continue;
    }
    const fromRotor = rotors.get(from.key);
    const toRotor = rotors.get(to.key);
    const active = Boolean(fromRotor?.driven && toRotor?.driven && !jammed);

    if (placement.kind === "axle") {
      const length = distanceBetween(from.center, to.center);
      connections.push({
        key: `axle:${placement.fromHoleId}:${placement.toHoleId}`,
        kind: "axle",
        fromKey: from.key,
        toKey: to.key,
        path: `M ${from.center.x} ${from.center.y} L ${to.center.x} ${to.center.y}`,
        active,
        surfaceSpeed: 0,
        runs: [
          { from: from.center, to: to.center },
          { from: from.center, to: to.center },
        ],
        length,
        chainPitch: 1,
      });
      continue;
    }

    const fromRadius = gearRadius(from.size);
    const toRadius = gearRadius(to.size);
    // Het loopvlak van een riem of ketting heeft de oppervlaktesnelheid van de
    // poelie waar hij op aangrijpt: v = omega * r.
    const surfaceSpeed = (fromRotor?.speed ?? 0) * MOTOR_ANGULAR_SPEED * fromRadius;
    // De kettingsteek volgt de kleinste sprocket: 2 * r * sin(PI / tanden).
    const smallest: GearSize = from.size <= to.size ? from.size : to.size;
    const chainPitch = 2 * gearRadius(smallest) * Math.sin(Math.PI / gearTeeth(smallest));
    connections.push({
      key: `${placement.kind}:${placement.fromHoleId}:${placement.toHoleId}`,
      kind: placement.kind,
      fromKey: from.key,
      toKey: to.key,
      path: connectionPath(placement.kind, from.center, fromRadius, to.center, toRadius),
      active,
      surfaceSpeed,
      runs:
        placement.kind === "chain"
          ? null
          : beltTangentRuns(
              from.center,
              fromRadius,
              to.center,
              toRadius,
              placement.kind === "crossed-belt" ? 1 : 0,
            ),
      length: connectionLength(placement.kind, from.center, fromRadius, to.center, toRadius),
      chainPitch,
    });
  }

  const outputs: OutputPose[] = level.outputs.map((output) => {
    const node = holeToNode.get(output.holeId);
    const rotor = node ? rotors.get(node.key) : undefined;
    const speed = rotor ? rotor.speed : 0;
    const direction: 1 | -1 = speed > 0 ? 1 : speed < 0 ? -1 : (output.direction ?? 1);
    const hole = level.holes.find((candidate) => candidate.id === output.holeId);
    return {
      id: output.id,
      kind: output.kind,
      satisfied: isOutputSatisfied(output, speed, rotor ? rotor.driven : false),
      speed,
      direction,
      center: node ? node.center : hole ? holePoint(hole) : { x: 0, y: 0 },
    };
  });

  return {
    gears,
    connections,
    outputs,
    jammed,
    solved: !jammed && outputs.every((output) => output.satisfied),
  };
}

export function evaluate(
  level: Level,
  placements: readonly Placement[],
): "playing" | "solved" | "jammed" {
  const result = drive(level, placements);
  if (result.jammed) {
    return "jammed";
  }
  return result.outputs.every((output) => output.satisfied) ? "solved" : "playing";
}

export function gearSlots(level: Level, placements: readonly Placement[]): GearSlot[] {
  const slots: GearSlot[] = [
    { holeId: level.motor.holeId, size: level.motor.size },
    ...level.outputs.map((output) => ({ holeId: output.holeId, size: output.size })),
  ];

  for (const placement of placements) {
    if (placement.kind === "gear") {
      slots.push({ holeId: placement.holeId, size: placement.size });
    }
  }

  return slots;
}

function slotsByHole(slots: readonly GearSlot[]): Map<string, GearSlot> {
  const map = new Map<string, GearSlot>();
  for (const slot of slots) {
    if (!map.has(slot.holeId)) {
      map.set(slot.holeId, slot);
    }
  }
  return map;
}

interface PlacementSlots {
  from: Hole;
  to: Hole;
  fromSlot: GearSlot;
  toSlot: GearSlot;
}

function placementSlots(
  holes: ReadonlyMap<string, Hole>,
  slots: readonly GearSlot[],
  fromHoleId: string,
  toHoleId: string,
): PlacementSlots | null {
  const from = holes.get(fromHoleId);
  const to = holes.get(toHoleId);
  const byHole = slotsByHole(slots);
  const fromSlot = byHole.get(fromHoleId);
  const toSlot = byHole.get(toHoleId);
  if (!from || !to || !fromSlot || !toSlot) {
    return null;
  }
  return { from, to, fromSlot, toSlot };
}

function linkPair(fromHoleId: string, toHoleId: string): string {
  return [fromHoleId, toHoleId].sort().join("|");
}

function canPlaceGear(
  holes: ReadonlyMap<string, Hole>,
  blocked: ReadonlySet<string>,
  occupied: ReadonlySet<string>,
  slots: readonly GearSlot[],
  next: Extract<Placement, { kind: "gear" }>,
): boolean {
  const hole = holes.get(next.holeId);
  if (!hole || blocked.has(next.holeId) || occupied.has(next.holeId)) {
    return false;
  }

  const center = holePoint(hole);
  const radius = gearRadius(next.size);
  for (const slot of slots) {
    const other = holes.get(slot.holeId);
    if (!other) {
      continue;
    }
    if (
      distanceBetween(center, holePoint(other)) <
      radius + gearRadius(slot.size) - CONTACT_TOLERANCE
    ) {
      return false;
    }
  }
  return true;
}

function canPlaceLooseBelt(
  slots: readonly GearSlot[],
  placements: readonly Placement[],
  next: Extract<Placement, { kind: "loose-belt" }>,
): boolean {
  if (!slots.some((slot) => slot.holeId === next.holeId)) {
    return false;
  }
  return !placements.some(
    (placement) => placement.kind === "loose-belt" && placement.holeId === next.holeId,
  );
}

function canPlaceLink(
  holes: ReadonlyMap<string, Hole>,
  slots: readonly GearSlot[],
  placements: readonly Placement[],
  next: Extract<Placement, { kind: "open-belt" | "crossed-belt" | "chain" | "axle" }>,
): boolean {
  if (next.fromHoleId === next.toHoleId) {
    return false;
  }
  const ends = placementSlots(holes, slots, next.fromHoleId, next.toHoleId);
  if (!ends) {
    return false;
  }

  const pair = linkPair(next.fromHoleId, next.toHoleId);
  for (const placement of placements) {
    if (
      placement.kind !== "open-belt" &&
      placement.kind !== "crossed-belt" &&
      placement.kind !== "chain" &&
      placement.kind !== "axle"
    ) {
      continue;
    }
    if (linkPair(placement.fromHoleId, placement.toHoleId) === pair) {
      return false;
    }
  }

  const distance = distanceBetween(holePoint(ends.from), holePoint(ends.to));
  if (next.kind === "axle") {
    // De as mag niet samenvallen met een tandcontact: dan doen de tanden mee.
    return distance > gearRadius(ends.fromSlot.size) + gearRadius(ends.toSlot.size);
  }
  return distance > Math.abs(gearRadius(ends.fromSlot.size) - gearRadius(ends.toSlot.size));
}

export function canPlace(level: Level, placements: readonly Placement[], next: Placement): boolean {
  const holes = new Map(level.holes.map((hole) => [hole.id, hole]));
  const blocked = new Set(level.blockedHoleIds);
  const slots = gearSlots(level, placements);
  const occupied = new Set(slots.map((slot) => slot.holeId));

  if (next.kind === "gear") {
    return canPlaceGear(holes, blocked, occupied, slots, next);
  }
  if (next.kind === "loose-belt") {
    return canPlaceLooseBelt(slots, placements, next);
  }
  return canPlaceLink(holes, slots, placements, next);
}

export function trayItemMatches(item: TrayItem, placement: Placement): boolean {
  switch (placement.kind) {
    case "gear":
      return item.kind === "gear" && item.size === placement.size;
    case "loose-belt":
      return (
        (item.kind === "belt" && item.crossed !== true && placement.link === "open-belt") ||
        (item.kind === "belt" && item.crossed === true && placement.link === "crossed-belt") ||
        (item.kind === "chain" && placement.link === "chain")
      );
    case "open-belt":
      return item.kind === "belt" && item.crossed !== true;
    case "crossed-belt":
      return item.kind === "belt" && item.crossed === true;
    case "chain":
      return item.kind === "chain";
    case "axle":
      return item.kind === "axle";
  }
}

function trayCanCover(
  tray: readonly TrayItem[],
  placements: readonly Placement[],
  used: boolean[],
): boolean {
  const first = placements[0];
  if (!first) {
    return true;
  }
  const rest = placements.slice(1);

  for (let index = 0; index < tray.length; index += 1) {
    if (used[index]) {
      continue;
    }
    const item = tray[index];
    if (!item || !trayItemMatches(item, first)) {
      continue;
    }
    used[index] = true;
    if (trayCanCover(tray, rest, used)) {
      used[index] = false;
      return true;
    }
    used[index] = false;
  }
  return false;
}

function describePlacement(placement: Placement): string {
  switch (placement.kind) {
    case "gear":
      return `gear at ${placement.holeId}`;
    case "loose-belt":
      return `loose-belt at ${placement.holeId}`;
    case "open-belt":
    case "crossed-belt":
    case "chain":
    case "axle":
      return `${placement.kind} ${placement.fromHoleId} -> ${placement.toHoleId}`;
  }
}

function validateHoles(level: Level, holes: Map<string, Hole>, errors: string[]): void {
  if (level.cols < 1 || level.rows < 1) {
    errors.push(`Level ${level.id} needs a positive board size`);
  }

  for (const hole of level.holes) {
    if (holes.has(hole.id)) {
      errors.push(`Duplicate hole id: ${hole.id}`);
    }
    holes.set(hole.id, hole);
    if (!Number.isInteger(hole.col) || !Number.isInteger(hole.row)) {
      errors.push(`Hole ${hole.id} is not on the grid`);
    }
    if (hole.col < 0 || hole.col >= level.cols || hole.row < 0 || hole.row >= level.rows) {
      errors.push(`Hole ${hole.id} falls outside the board`);
    }
  }
}

function validateOutputs(level: Level, holes: ReadonlyMap<string, Hole>, errors: string[]): void {
  const outputIds = new Set<string>();
  for (const output of level.outputs) {
    if (outputIds.has(output.id)) {
      errors.push(`Duplicate output id: ${output.id}`);
    }
    outputIds.add(output.id);
    if (!holes.has(output.holeId)) {
      errors.push(`Output ${output.id} is not on a hole`);
    }
  }
}

function validateTrayIds(level: Level, errors: string[]): void {
  const trayIds = new Set<string>();
  for (const item of level.tray) {
    if (trayIds.has(item.id)) {
      errors.push(`Duplicate tray id: ${item.id}`);
    }
    trayIds.add(item.id);
  }
}

function validateCatalogue(level: Level, errors: string[]): void {
  const levels = allLevels();
  if (levels.filter((other) => other.id === level.id).length > 1) {
    errors.push(`Duplicate level id: ${level.id}`);
  }
  if (levels.filter((other) => other.introduces === level.introduces).length > 1) {
    errors.push(`Duplicate introduces: ${level.introduces}`);
  }
}

function validateFixedParts(
  level: Level,
  holes: ReadonlyMap<string, Hole>,
  errors: string[],
): void {
  if (!holes.has(level.motor.holeId)) {
    errors.push(`Motor is not on a hole: ${level.motor.holeId}`);
  }

  const blocked = new Set<string>();
  for (const holeId of level.blockedHoleIds) {
    if (blocked.has(holeId)) {
      errors.push(`Duplicate blocked hole: ${holeId}`);
    }
    blocked.add(holeId);
    if (!holes.has(holeId)) {
      errors.push(`Blocked hole does not exist: ${holeId}`);
    }
  }
  if (blocked.has(level.motor.holeId)) {
    errors.push("Motor stands on a blocked hole");
  }
  for (const output of level.outputs) {
    if (blocked.has(output.holeId)) {
      errors.push(`Output ${output.id} stands on a blocked hole`);
    }
  }
}

function validateOverlaps(level: Level, holes: ReadonlyMap<string, Hole>, errors: string[]): void {
  const slots = gearSlots(level, level.solution);
  for (let first = 0; first < slots.length; first += 1) {
    for (let second = first + 1; second < slots.length; second += 1) {
      const a = slots[first] as GearSlot;
      const b = slots[second] as GearSlot;
      if (a.group && a.group === b.group) {
        continue;
      }
      const aHole = holes.get(a.holeId);
      const bHole = holes.get(b.holeId);
      if (!aHole || !bHole) {
        continue;
      }
      const gap =
        distanceBetween(holePoint(aHole), holePoint(bHole)) -
        (gearRadius(a.size) + gearRadius(b.size));
      if (gap < -CONTACT_TOLERANCE) {
        errors.push(`Gears overlap at ${a.holeId} and ${b.holeId}`);
      }
    }
  }
}

function validateTrayCover(level: Level, errors: string[]): void {
  if (
    !trayCanCover(
      level.tray,
      level.solution,
      level.tray.map(() => false),
    )
  ) {
    errors.push("Tray does not contain the parts used by the solution");
  }
}

function validateConnections(
  level: Level,
  holes: ReadonlyMap<string, Hole>,
  errors: string[],
): void {
  const finalSlots = slotsByHole(gearSlots(level, level.solution));
  for (const placement of level.solution) {
    if (
      placement.kind !== "open-belt" &&
      placement.kind !== "crossed-belt" &&
      placement.kind !== "chain" &&
      placement.kind !== "axle"
    ) {
      continue;
    }
    const from = holes.get(placement.fromHoleId);
    const to = holes.get(placement.toHoleId);
    const fromSlot = finalSlots.get(placement.fromHoleId);
    const toSlot = finalSlots.get(placement.toHoleId);
    if (!from || !to || !fromSlot || !toSlot) {
      errors.push(`Connection ${describePlacement(placement)} has no gear on both ends`);
      continue;
    }
    const distance = distanceBetween(holePoint(from), holePoint(to));
    const minimum =
      placement.kind === "axle"
        ? gearRadius(fromSlot.size) + gearRadius(toSlot.size)
        : Math.abs(gearRadius(fromSlot.size) - gearRadius(toSlot.size));
    if (distance <= minimum) {
      errors.push(`Connection ${describePlacement(placement)} has no room between the wheels`);
    }
  }
}

function validatePlaceableSolution(level: Level, errors: string[]): void {
  const placed: Placement[] = [];
  for (const placement of level.solution) {
    if (!canPlace(level, placed, placement)) {
      errors.push(`Solution placement cannot be placed: ${describePlacement(placement)}`);
    }
    placed.push(placement);
  }
}

function validateSolved(level: Level, errors: string[]): void {
  const result = evaluate(level, level.solution);
  if (result !== "solved") {
    errors.push(`Solution does not solve level ${level.id} (${result})`);
  }
}

export function validateLevel(level: Level): string[] {
  const errors: string[] = [];
  const holes = new Map<string, Hole>();

  validateHoles(level, holes, errors);
  validateOutputs(level, holes, errors);
  validateTrayIds(level, errors);
  validateCatalogue(level, errors);
  validateFixedParts(level, holes, errors);
  validateOverlaps(level, holes, errors);
  validateTrayCover(level, errors);
  validateConnections(level, holes, errors);
  validatePlaceableSolution(level, errors);
  validateSolved(level, errors);

  return errors;
}

/** De naam van een onderdeel in de la, in de actieve taal. */
export function trayLabel(item: TrayItem): string {
  const t = getTexts(gearTexts);
  switch (item.kind) {
    case "gear":
      return t.gears[item.size];
    case "belt":
      return item.crossed === true ? t.crossedChain : t.chain;
    case "chain":
      return t.chain;
    case "axle":
      return t.axle;
  }
}
