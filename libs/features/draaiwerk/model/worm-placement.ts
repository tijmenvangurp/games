import {
  canPlace,
  drive,
  gearRadius,
  gearSlots,
  holeCenter,
  type Hole,
  type Level,
  type Placement,
  type TrayItem,
} from "@entities/gear";

type WormTrayItem = Extract<TrayItem, { kind: "worm" }>;
type WormPlacement = Extract<Placement, { kind: "worm" }>;

function wormAt(
  shaftHole: Hole,
  wheelHole: Hole,
  item: WormTrayItem,
  reversed: boolean,
): WormPlacement {
  const shaft = reversed ? wheelHole : shaftHole;
  const wheel = reversed ? shaftHole : wheelHole;
  return {
    kind: "worm",
    shaftHoleId: shaft.id,
    wheelHoleId: wheel.id,
    shaftSize: item.shaftSize,
    wheelSize: item.wheelSize,
    ratio: item.ratio,
    direction: item.direction,
  };
}

function contactCount(
  level: Level,
  placements: readonly Placement[],
  placement: WormPlacement,
): number {
  const slots = gearSlots(level, placements);
  const shaft = holeCenter(level, placement.shaftHoleId);
  const wheel = holeCenter(level, placement.wheelHoleId);
  let contacts = 0;
  for (const slot of slots) {
    const center = holeCenter(level, slot.holeId);
    const radius = gearRadius(slot.size);
    const shaftContact =
      Math.abs(
        Math.hypot(shaft.x - center.x, shaft.y - center.y) -
          (gearRadius(placement.shaftSize) + radius),
      ) <= 1;
    const wheelContact =
      Math.abs(
        Math.hypot(wheel.x - center.x, wheel.y - center.y) -
          (gearRadius(placement.wheelSize) + radius),
      ) <= 1;
    if (shaftContact) {
      contacts += 1;
    }
    if (wheelContact) {
      contacts += 1;
    }
  }
  return contacts;
}

/**
 * Picks the worm placement that best continues the machine around `holeId`.
 * The player only has to drop or tap one hole; the second hole and the
 * direction of the shaft follow from what is already on the board.
 */
export function autoWormPlacement(
  level: Level,
  placements: readonly Placement[],
  holeId: string,
  item: WormTrayItem,
): WormPlacement | null {
  const hole = level.holes.find((candidate) => candidate.id === holeId);
  if (!hole) {
    return null;
  }

  let best: { placement: WormPlacement; score: number } | null = null;

  for (const partner of level.holes) {
    if (partner.id === hole.id) {
      continue;
    }
    for (const reversed of [false, true]) {
      const placement = wormAt(hole, partner, item, reversed);
      if (!canPlace(level, placements, placement)) {
        continue;
      }

      const result = drive(level, [...placements, placement]);
      const shaft = result.gears.find((pose) => pose.key === `worm:${placement.shaftHoleId}`);
      const wheel = result.gears.find((pose) => pose.key === `worm:${placement.wheelHoleId}`);
      const satisfied = result.outputs.filter((output) => output.satisfied).length;

      let score = 0;
      if (satisfied > 0) {
        score -= 12 * satisfied;
      }
      if (shaft?.driven) {
        score -= 6;
      }
      if (wheel?.driven) {
        score -= 3;
      }
      score -= 1.5 * contactCount(level, placements, placement);

      const shaftCenter = holeCenter(level, placement.shaftHoleId);
      const wheelCenter = holeCenter(level, placement.wheelHoleId);
      const motor = holeCenter(level, level.motor.holeId);
      score +=
        (Math.hypot(shaftCenter.x - motor.x, shaftCenter.y - motor.y) -
          Math.hypot(wheelCenter.x - motor.x, wheelCenter.y - motor.y)) /
        280;

      if (hole.row === partner.row) {
        score -= 0.5;
      }
      score += Math.hypot(hole.col - partner.col, hole.row - partner.row) * 0.25;

      if (!best || score < best.score) {
        best = { placement, score };
      }
    }
  }

  return best?.placement ?? null;
}
