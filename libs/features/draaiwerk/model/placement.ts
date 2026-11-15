import {
  gearRadius,
  gearSlots,
  holeCenter,
  trayItemMatches,
  type Level,
  type Placement,
  type TrayItem,
} from "@entities/gear";

export type LinkTrayItem = Extract<TrayItem, { kind: "belt" | "chain" }>;

export type LinkPlacementKind = "open-belt" | "crossed-belt" | "chain";

function distance(first: { x: number; y: number }, second: { x: number; y: number }): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

/** The tray item that is currently selected, if any. */
export function selectedTrayItem(level: Level, selectedTrayId: string | null): TrayItem | null {
  if (!selectedTrayId) {
    return null;
  }
  return level.tray.find((item) => item.id === selectedTrayId) ?? null;
}

/** Every hole that already holds a fixed or placed part. */
export function occupiedHoleIds(level: Level, placements: readonly Placement[]): Set<string> {
  const ids = new Set<string>([
    level.motor.holeId,
    ...level.outputs.map((output) => output.holeId),
  ]);

  for (const placement of placements) {
    if (placement.kind === "gear") {
      ids.add(placement.holeId);
    }
    if (placement.kind === "worm") {
      ids.add(placement.shaftHoleId);
      ids.add(placement.wheelHoleId);
    }
  }

  return ids;
}

/** Every gear-like part on the board, used for overlap checks. */

function linkPair(fromHoleId: string, toHoleId: string): string {
  return [fromHoleId, toHoleId].sort().join("|");
}

export type LinkPlacement = Extract<Placement, { kind: LinkPlacementKind }>;

export function isLinkPlacement(placement: Placement): placement is LinkPlacement {
  return (
    placement.kind === "open-belt" ||
    placement.kind === "crossed-belt" ||
    placement.kind === "chain"
  );
}

export function connectionKey(placement: LinkPlacement): string {
  return `${placement.kind}:${placement.fromHoleId}:${placement.toHoleId}`;
}

/** Every hole a placement occupies. */
export function holesForPlacement(placement: Placement): Set<string> {
  if (placement.kind === "gear") {
    return new Set([placement.holeId]);
  }
  if (placement.kind === "worm") {
    return new Set([placement.shaftHoleId, placement.wheelHoleId]);
  }
  if (placement.kind === "loose-belt") {
    return new Set([placement.holeId]);
  }
  return new Set([placement.fromHoleId, placement.toHoleId]);
}

type GearPlacement = Extract<Placement, { kind: "gear" }>;
type WormPlacement = Extract<Placement, { kind: "worm" }>;
type LooseBeltPlacement = Extract<Placement, { kind: "loose-belt" }>;

function rejectGear(
  level: Level,
  next: GearPlacement,
  blocked: ReadonlySet<string>,
  occupied: ReadonlySet<string>,
  slots: ReturnType<typeof gearSlots>,
): string {
  const hole = level.holes.find((candidate) => candidate.id === next.holeId);
  if (!hole) {
    return "Dat gat bestaat niet.";
  }
  if (blocked.has(next.holeId)) {
    return "Dit gat is geblokkeerd.";
  }
  if (occupied.has(next.holeId)) {
    return "Hier zit al een tandwiel.";
  }

  const center = holeCenter(level, next.holeId);
  const radius = gearRadius(next.size);
  const clash = slots.some(
    (slot) => distance(center, holeCenter(level, slot.holeId)) < radius + gearRadius(slot.size) - 1,
  );
  return clash ? "Dit tandwiel botst met een ander." : "Dat past hier niet.";
}

function rejectWorm(
  level: Level,
  next: WormPlacement,
  blocked: ReadonlySet<string>,
  occupied: ReadonlySet<string>,
  slots: ReturnType<typeof gearSlots>,
): string {
  if (blocked.has(next.shaftHoleId) || blocked.has(next.wheelHoleId)) {
    return "Eén van deze gaten is geblokkeerd.";
  }
  if (occupied.has(next.shaftHoleId) || occupied.has(next.wheelHoleId)) {
    return "Op dit gat zit al iets.";
  }
  if (next.shaftHoleId === next.wheelHoleId) {
    return "Kies twee verschillende gaten.";
  }

  const shaft = holeCenter(level, next.shaftHoleId);
  const wheel = holeCenter(level, next.wheelHoleId);
  const shaftRadius = gearRadius(next.shaftSize);
  const wheelRadius = gearRadius(next.wheelSize);
  if (distance(shaft, wheel) <= shaftRadius + wheelRadius + 1) {
    return "De wormas is te kort: kies een gat verder weg.";
  }

  const clash = slots.some((slot) => {
    const center = holeCenter(level, slot.holeId);
    const radius = gearRadius(slot.size);
    return (
      distance(shaft, center) < shaftRadius + radius - 1 ||
      distance(wheel, center) < wheelRadius + radius - 1
    );
  });
  return clash ? "De wormas botst met een tandwiel." : "Dat past hier niet.";
}

function rejectLooseBelt(next: LooseBeltPlacement, slots: ReturnType<typeof gearSlots>): string {
  if (!slots.some((slot) => slot.holeId === next.holeId)) {
    return "Op dit gat zit nog geen tandwiel.";
  }
  return "Hier hangt al een riem.";
}

function rejectLink(level: Level, placements: readonly Placement[], next: LinkPlacement): string {
  const slots = gearSlots(level, placements);
  const from = slots.find((slot) => slot.holeId === next.fromHoleId);
  const to = slots.find((slot) => slot.holeId === next.toHoleId);
  if (!from || !to) {
    return "Op dit gat zit nog geen tandwiel.";
  }
  if (next.fromHoleId === next.toHoleId) {
    return "Kies twee verschillende tandwielen.";
  }

  const pair = linkPair(next.fromHoleId, next.toHoleId);
  const duplicate = placements.some(
    (placement) =>
      isLinkPlacement(placement) && linkPair(placement.fromHoleId, placement.toHoleId) === pair,
  );
  if (duplicate) {
    return "Deze twee zijn al verbonden.";
  }

  const span = distance(holeCenter(level, next.fromHoleId), holeCenter(level, next.toHoleId));
  return span <= Math.abs(gearRadius(from.size) - gearRadius(to.size))
    ? "De riem past niet tussen deze wielen."
    : "Dat past hier niet.";
}

/**
 * Explains why `canPlace` rejected a part, in child-friendly Dutch. Only called
 * after the engine said no, so the last line is a safe fallback.
 */
export function rejectionFor(
  level: Level,
  placements: readonly Placement[],
  next: Placement,
): string {
  const blocked = new Set(level.blockedHoleIds);
  const occupied = occupiedHoleIds(level, placements);
  const slots = gearSlots(level, placements);

  switch (next.kind) {
    case "gear":
      return rejectGear(level, next, blocked, occupied, slots);
    case "worm":
      return rejectWorm(level, next, blocked, occupied, slots);
    case "loose-belt":
      return rejectLooseBelt(next, slots);
    default:
      return rejectLink(level, placements, next);
  }
}

function sameGear(first: GearPlacement, second: GearPlacement): boolean {
  return first.holeId === second.holeId && first.size === second.size;
}

function sameWorm(first: WormPlacement, second: WormPlacement): boolean {
  return (
    first.ratio === second.ratio &&
    first.direction === second.direction &&
    first.shaftHoleId === second.shaftHoleId &&
    first.wheelHoleId === second.wheelHoleId &&
    first.shaftSize === second.shaftSize &&
    first.wheelSize === second.wheelSize
  );
}

function sameLooseBelt(first: LooseBeltPlacement, second: LooseBeltPlacement): boolean {
  return first.holeId === second.holeId && first.link === second.link;
}

function sameLink(first: LinkPlacement, second: LinkPlacement): boolean {
  return (
    linkPair(first.fromHoleId, first.toHoleId) === linkPair(second.fromHoleId, second.toHoleId)
  );
}

function samePlacement(first: Placement, second: Placement): boolean {
  if (first.kind !== second.kind) {
    return false;
  }
  if (first.kind === "gear") {
    return sameGear(first, second as GearPlacement);
  }
  if (first.kind === "worm") {
    return sameWorm(first, second as WormPlacement);
  }
  if (first.kind === "loose-belt") {
    return sameLooseBelt(first, second as LooseBeltPlacement);
  }
  return sameLink(first, second as LinkPlacement);
}

/** The next part of the authored solution that is not on the board yet. */
export function nextSolutionPlacement(
  level: Level,
  placements: readonly Placement[],
): Placement | null {
  return (
    level.solution.find(
      (solution) => !placements.some((placement) => samePlacement(placement, solution)),
    ) ?? null
  );
}

/** The hole behind a drive pose key, without trusting that the pose exists. */
export function holeForGearKey(level: Level, key: string): string | null {
  if (key === "motor") {
    return level.motor.holeId;
  }
  if (key.startsWith("output:")) {
    const id = key.slice("output:".length);
    return level.outputs.find((output) => output.id === id)?.holeId ?? null;
  }
  if (key.startsWith("gear:") || key.startsWith("worm:")) {
    return key.slice(key.indexOf(":") + 1);
  }
  return null;
}

export function linkPlacementKind(item: LinkTrayItem): LinkPlacementKind {
  if (item.kind === "chain") {
    return "chain";
  }
  return item.crossed === true ? "crossed-belt" : "open-belt";
}
