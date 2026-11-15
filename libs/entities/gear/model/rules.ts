import {
  connectionPath,
  gearRadius,
  gearTeeth,
  holePoint,
  type ConnectionKind,
  type Point,
} from "./geometry";
import { allLevels } from "./levels";
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
  TrayItem,
} from "./types";

const SPEED_EPSILON = 1e-9;
const MESH_TOLERANCE = 1;
const CONTACT_TOLERANCE = 1;

interface GearNode {
  key: string;
  holeId: string;
  size: GearSize;
  center: Point;
  visual?: "worm-shaft" | "worm-wheel";
  /** The two ends of one worm assembly share this id and never mesh. */
  wormGroup?: string;
}

interface GearEdge {
  kind: "mesh" | "rigid" | "worm" | ConnectionKind;
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

    if (placement.kind === "worm") {
      const occupiedAlready =
        occupied.has(placement.shaftHoleId) || occupied.has(placement.wheelHoleId);
      if (
        !holeIds.has(placement.shaftHoleId) ||
        !holeIds.has(placement.wheelHoleId) ||
        occupiedAlready
      ) {
        continue;
      }
      const group = `worm:${placement.shaftHoleId}:${placement.wheelHoleId}`;
      add({
        key: `worm:${placement.shaftHoleId}`,
        holeId: placement.shaftHoleId,
        size: placement.shaftSize,
        visual: "worm-shaft",
        wormGroup: group,
      });
      add({
        key: `worm:${placement.wheelHoleId}`,
        holeId: placement.wheelHoleId,
        size: placement.wheelSize,
        visual: "worm-wheel",
        wormGroup: group,
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

function buildEdges(
  nodes: readonly GearNode[],
  placements: readonly Placement[],
): Map<string, GearEdge[]> {
  const adjacency = new Map<string, GearEdge[]>();

  for (let first = 0; first < nodes.length; first += 1) {
    for (let second = first + 1; second < nodes.length; second += 1) {
      const a = nodes[first] as GearNode;
      const b = nodes[second] as GearNode;
      if (a.wormGroup && a.wormGroup === b.wormGroup) {
        continue;
      }
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

  const wormGroups = new Map<string, GearNode[]>();
  for (const node of nodes) {
    if (!node.wormGroup) {
      continue;
    }
    const group = wormGroups.get(node.wormGroup);
    if (group) {
      group.push(node);
    } else {
      wormGroups.set(node.wormGroup, [node]);
    }
  }
  for (const group of wormGroups.values()) {
    const shaft = group.find((node) => node.visual === "worm-shaft");
    const wheel = group.find((node) => node.visual === "worm-wheel");
    if (!shaft || !wheel || group.length !== 2) {
      continue;
    }
    const placement = placements.find(
      (candidate) =>
        candidate.kind === "worm" &&
        candidate.shaftHoleId === shaft.holeId &&
        candidate.wheelHoleId === wheel.holeId,
    );
    if (!placement || placement.kind !== "worm") {
      continue;
    }
    // A worm drive is deliberately one-way: the motor drives the shaft, the
    // wheel is the output. It does not back-drive.
    addEdge(adjacency, {
      kind: "worm",
      from: shaft.key,
      to: wheel.key,
      speedFactor: placement.direction * placement.ratio,
      phase: "free",
    });
  }

  const byHole = new Map(nodes.map((node) => [node.holeId, node]));
  for (const placement of placements) {
    if (
      placement.kind !== "open-belt" &&
      placement.kind !== "crossed-belt" &&
      placement.kind !== "chain"
    ) {
      continue;
    }
    const from = byHole.get(placement.fromHoleId);
    const to = byHole.get(placement.toHoleId);
    if (!from || !to || from.key === to.key) {
      continue;
    }
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
      visual: node.visual,
      layer: "front",
      driven: rotor ? rotor.driven : false,
      jammed: rotor ? rotor.jammed : false,
    };
  });

  const connections: ConnectionPose[] = [];
  for (const placement of placements) {
    if (
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
    connections.push({
      key: `${placement.kind}:${placement.fromHoleId}:${placement.toHoleId}`,
      kind: placement.kind,
      fromKey: from.key,
      toKey: to.key,
      path: connectionPath(
        placement.kind,
        from.center,
        gearRadius(from.size),
        to.center,
        gearRadius(to.size),
      ),
      active: Boolean(fromRotor?.driven && toRotor?.driven && !jammed),
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
    if (placement.kind === "worm") {
      const group = `worm:${placement.shaftHoleId}:${placement.wheelHoleId}`;
      slots.push({ holeId: placement.shaftHoleId, size: placement.shaftSize, group });
      slots.push({ holeId: placement.wheelHoleId, size: placement.wheelSize, group });
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

function canPlaceWorm(
  holes: ReadonlyMap<string, Hole>,
  blocked: ReadonlySet<string>,
  occupied: ReadonlySet<string>,
  slots: readonly GearSlot[],
  next: Extract<Placement, { kind: "worm" }>,
): boolean {
  if (next.shaftHoleId === next.wheelHoleId) {
    return false;
  }
  if (next.ratio <= 0 || next.ratio > 1) {
    return false;
  }
  const shaft = holes.get(next.shaftHoleId);
  const wheel = holes.get(next.wheelHoleId);
  if (!shaft || !wheel || blocked.has(next.shaftHoleId) || blocked.has(next.wheelHoleId)) {
    return false;
  }
  if (occupied.has(next.shaftHoleId) || occupied.has(next.wheelHoleId)) {
    return false;
  }

  const shaftCenter = holePoint(shaft);
  const wheelCenter = holePoint(wheel);
  const shaftRadius = gearRadius(next.shaftSize);
  const wheelRadius = gearRadius(next.wheelSize);
  if (distanceBetween(shaftCenter, wheelCenter) <= shaftRadius + wheelRadius + CONTACT_TOLERANCE) {
    return false;
  }

  for (const slot of slots) {
    const other = holes.get(slot.holeId);
    if (!other) {
      continue;
    }
    const center = holePoint(other);
    const radius = gearRadius(slot.size);
    if (distanceBetween(shaftCenter, center) < shaftRadius + radius - CONTACT_TOLERANCE) {
      return false;
    }
    if (distanceBetween(wheelCenter, center) < wheelRadius + radius - CONTACT_TOLERANCE) {
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
  next: Extract<Placement, { kind: "open-belt" | "crossed-belt" | "chain" }>,
): boolean {
  if (next.fromHoleId === next.toHoleId) {
    return false;
  }
  const from = holes.get(next.fromHoleId);
  const to = holes.get(next.toHoleId);
  const byHole = slotsByHole(slots);
  const fromSlot = byHole.get(next.fromHoleId);
  const toSlot = byHole.get(next.toHoleId);
  if (!from || !to || !fromSlot || !toSlot) {
    return false;
  }

  const pair = linkPair(next.fromHoleId, next.toHoleId);
  for (const placement of placements) {
    if (
      placement.kind !== "open-belt" &&
      placement.kind !== "crossed-belt" &&
      placement.kind !== "chain"
    ) {
      continue;
    }
    if (linkPair(placement.fromHoleId, placement.toHoleId) === pair) {
      return false;
    }
  }

  const distance = distanceBetween(holePoint(from), holePoint(to));
  return distance > Math.abs(gearRadius(fromSlot.size) - gearRadius(toSlot.size));
}

export function canPlace(level: Level, placements: readonly Placement[], next: Placement): boolean {
  const holes = new Map(level.holes.map((hole) => [hole.id, hole]));
  const blocked = new Set(level.blockedHoleIds);
  const slots = gearSlots(level, placements);
  const occupied = new Set(slots.map((slot) => slot.holeId));

  if (next.kind === "gear") {
    return canPlaceGear(holes, blocked, occupied, slots, next);
  }
  if (next.kind === "worm") {
    return canPlaceWorm(holes, blocked, occupied, slots, next);
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
    case "worm":
      return (
        item.kind === "worm" &&
        item.ratio === placement.ratio &&
        item.direction === placement.direction &&
        item.shaftSize === placement.shaftSize &&
        item.wheelSize === placement.wheelSize
      );
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
    case "worm":
      return `worm ${placement.shaftHoleId} -> ${placement.wheelHoleId}`;
    case "loose-belt":
      return `loose-belt at ${placement.holeId}`;
    case "open-belt":
    case "crossed-belt":
    case "chain":
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

function validateWormGeometry(
  level: Level,
  holes: ReadonlyMap<string, Hole>,
  errors: string[],
): void {
  for (const placement of level.solution) {
    if (placement.kind !== "worm") {
      continue;
    }
    const shaftHole = holes.get(placement.shaftHoleId);
    const wheelHole = holes.get(placement.wheelHoleId);
    if (!shaftHole || !wheelHole) {
      errors.push(`Wormas ${placement.shaftHoleId} -> ${placement.wheelHoleId} leaves the board`);
      continue;
    }
    if (placement.ratio <= 0 || placement.ratio > 1) {
      errors.push(`Wormas ${placement.shaftHoleId} -> ${placement.wheelHoleId} needs a ratio`);
    }
    const gap =
      distanceBetween(holePoint(shaftHole), holePoint(wheelHole)) -
      (gearRadius(placement.shaftSize) + gearRadius(placement.wheelSize));
    if (gap <= CONTACT_TOLERANCE) {
      errors.push(`Wormas ${placement.shaftHoleId} -> ${placement.wheelHoleId} touches itself`);
    }
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
      placement.kind !== "chain"
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
    if (distance <= Math.abs(gearRadius(fromSlot.size) - gearRadius(toSlot.size))) {
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
  validateWormGeometry(level, holes, errors);
  validateConnections(level, holes, errors);
  validatePlaceableSolution(level, errors);
  validateSolved(level, errors);

  return errors;
}

const SIZE_LABELS: Record<GearSize, string> = {
  1: "klein",
  2: "middelgroot",
  3: "groot",
};

export function trayLabel(item: TrayItem): string {
  switch (item.kind) {
    case "gear": {
      const label = SIZE_LABELS[item.size];
      return `${label.charAt(0).toUpperCase()}${label.slice(1)} tandwiel`;
    }
    case "worm":
      return item.ratio <= 0.25 ? "Wormas, grote vertraging" : "Wormas";
    case "belt":
      return item.crossed === true ? "Gekruiste riem" : "Open riem";
    case "chain":
      return "Ketting";
  }
}
