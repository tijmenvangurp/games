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
    if (placement.kind === "lying-as") {
      ids.add(placement.holeA);
      ids.add(placement.holeB);
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

  if (next.kind === "gear") {
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
      (slot) =>
        distance(center, holeCenter(level, slot.holeId)) < radius + gearRadius(slot.size) - 1,
    );
    return clash ? "Dit tandwiel botst met een ander." : "Dat past hier niet.";
  }

  if (next.kind === "lying-as") {
    if (blocked.has(next.holeA) || blocked.has(next.holeB)) {
      return "Eén van deze gaten is geblokkeerd.";
    }
    if (occupied.has(next.holeA) || occupied.has(next.holeB)) {
      return "Op dit gat zit al iets.";
    }
    if (next.holeA === next.holeB) {
      return "Kies twee verschillende gaten.";
    }

    const first = holeCenter(level, next.holeA);
    const second = holeCenter(level, next.holeB);
    const firstRadius = gearRadius(next.sizeA);
    const secondRadius = gearRadius(next.sizeB);
    if (distance(first, second) <= firstRadius + secondRadius + 1) {
      return "De as is te kort: kies een gat verder weg.";
    }

    const clash = slots.some((slot) => {
      const center = holeCenter(level, slot.holeId);
      const radius = gearRadius(slot.size);
      return (
        distance(first, center) < firstRadius + radius - 1 ||
        distance(second, center) < secondRadius + radius - 1
      );
    });
    return clash ? "De as botst met een tandwiel." : "Dat past hier niet.";
  }

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

function samePlacement(first: Placement, second: Placement): boolean {
  if (first.kind !== second.kind) {
    return false;
  }

  switch (first.kind) {
    case "gear":
      return second.kind === "gear" && first.holeId === second.holeId && first.size === second.size;
    case "lying-as":
      return (
        second.kind === "lying-as" &&
        ((first.holeA === second.holeA &&
          first.holeB === second.holeB &&
          first.sizeA === second.sizeA &&
          first.sizeB === second.sizeB) ||
          (first.holeA === second.holeB &&
            first.holeB === second.holeA &&
            first.sizeA === second.sizeB &&
            first.sizeB === second.sizeA))
      );
    case "open-belt":
    case "crossed-belt":
    case "chain":
      return (
        isLinkPlacement(second) &&
        second.kind === first.kind &&
        linkPair(first.fromHoleId, first.toHoleId) === linkPair(second.fromHoleId, second.toHoleId)
      );
  }
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
  if (key.startsWith("gear:") || key.startsWith("as:")) {
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
