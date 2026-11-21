import {
  canPlace,
  gearRadius,
  gearSlots,
  holeCenter,
  trayItemMatches,
  type GearPose,
  type Level,
  type Placement,
  type TrayItem,
} from "@entities/gear";
import { getTexts } from "@shared/i18n";
import { draaiwerkTexts } from "./texts";

export type LinkTrayItem = Extract<TrayItem, { kind: "belt" | "chain" }>;

export type LinkPlacementKind = "open-belt" | "crossed-belt" | "chain";

/** How close the virtual pulley must be to a wheel before it snaps, in board units. */
const GEAR_SNAP_DISTANCE = 16;

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
  if (placement.kind === "loose-belt") {
    return new Set([placement.holeId]);
  }
  return new Set([placement.fromHoleId, placement.toHoleId]);
}

type GearPlacement = Extract<Placement, { kind: "gear" }>;
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
    return getTexts(draaiwerkTexts).holeMissing;
  }
  if (blocked.has(next.holeId)) {
    return getTexts(draaiwerkTexts).holeBlocked;
  }
  if (occupied.has(next.holeId)) {
    return getTexts(draaiwerkTexts).holeTaken;
  }

  const center = holeCenter(level, next.holeId);
  const radius = gearRadius(next.size);
  const clash = slots.some(
    (slot) => distance(center, holeCenter(level, slot.holeId)) < radius + gearRadius(slot.size) - 1,
  );
  return clash ? getTexts(draaiwerkTexts).gearClash : getTexts(draaiwerkTexts).doesNotFit;
}

function rejectLooseBelt(next: LooseBeltPlacement, slots: ReturnType<typeof gearSlots>): string {
  if (!slots.some((slot) => slot.holeId === next.holeId)) {
    return getTexts(draaiwerkTexts).noGearHere;
  }
  return getTexts(draaiwerkTexts).chainHere;
}

function rejectLink(level: Level, placements: readonly Placement[], next: LinkPlacement): string {
  const slots = gearSlots(level, placements);
  const from = slots.find((slot) => slot.holeId === next.fromHoleId);
  const to = slots.find((slot) => slot.holeId === next.toHoleId);
  if (!from || !to) {
    return getTexts(draaiwerkTexts).noGearHere;
  }
  if (next.fromHoleId === next.toHoleId) {
    return getTexts(draaiwerkTexts).twoDifferentGears;
  }

  const pair = linkPair(next.fromHoleId, next.toHoleId);
  const duplicate = placements.some(
    (placement) =>
      isLinkPlacement(placement) && linkPair(placement.fromHoleId, placement.toHoleId) === pair,
  );
  if (duplicate) {
    return getTexts(draaiwerkTexts).alreadyLinked;
  }

  const span = distance(holeCenter(level, next.fromHoleId), holeCenter(level, next.toHoleId));
  return span <= Math.abs(gearRadius(from.size) - gearRadius(to.size))
    ? getTexts(draaiwerkTexts).chainTooShort
    : getTexts(draaiwerkTexts).doesNotFit;
}

/**
 * Explains why `canPlace` rejected a part, in child-friendly words, in the active language. Only called
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
    case "loose-belt":
      return rejectLooseBelt(next, slots);
    default:
      return rejectLink(level, placements, next);
  }
}

function sameGear(first: GearPlacement, second: GearPlacement): boolean {
  return first.holeId === second.holeId && first.size === second.size;
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
  if (key.startsWith("gear:")) {
    return key.slice("gear:".length);
  }
  return null;
}

export function linkPlacementKind(item: LinkTrayItem): LinkPlacementKind {
  if (item.kind === "chain") {
    return "chain";
  }
  return item.crossed === true ? "crossed-belt" : "open-belt";
}

export interface LooseBeltTarget {
  pose: GearPose;
  distance: number;
  /** The virtual pulley is close enough to snap onto this wheel. */
  snapped: boolean;
}

/**
 * The wheel a dragged loose belt would connect to from `point`: the nearest one
 * where the link is actually allowed. Returns null when no wheel can take it.
 */
export function looseBeltTarget(
  level: Level,
  placements: readonly Placement[],
  gears: readonly GearPose[],
  anchorHoleId: string,
  link: LinkPlacementKind,
  point: { x: number; y: number },
): LooseBeltTarget | null {
  const without = placements.filter(
    (placement) => !(placement.kind === "loose-belt" && placement.holeId === anchorHoleId),
  );

  let best: LooseBeltTarget | null = null;
  for (const gear of gears) {
    if (gear.holeId === anchorHoleId) {
      continue;
    }
    const next: LinkPlacement = {
      kind: link,
      fromHoleId: anchorHoleId,
      toHoleId: gear.holeId,
    };
    if (!canPlace(level, without, next)) {
      continue;
    }
    const span = distance(gear.center, point);
    if (best && span >= best.distance) {
      continue;
    }
    best = {
      pose: gear,
      distance: span,
      snapped: span <= gearRadius(gear.size) + GEAR_SNAP_DISTANCE,
    };
  }
  return best;
}
