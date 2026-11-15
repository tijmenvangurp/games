import { canPlace, drive, gearSlots, holeCenter, type Level, type Placement } from "@entities/gear";

type WormPlacement = Extract<Placement, { kind: "worm" }>;

function wormBetween(fromHoleId: string, toHoleId: string): WormPlacement {
  return {
    kind: "worm",
    fromHoleId,
    toHoleId,
  };
}

/**
 * Picks the second gear the worm shaft should lie on. The player only taps one
 * gear; the shaft spans to the gear that best continues the machine. Both
 * orientations are tried because the shaft is a two-way connector.
 */
export function autoWormPlacement(
  level: Level,
  placements: readonly Placement[],
  holeId: string,
): WormPlacement | null {
  const slots = gearSlots(level, placements);
  if (!slots.some((slot) => slot.holeId === holeId)) {
    return null;
  }

  let best: { placement: WormPlacement; score: number } | null = null;

  for (const partner of slots) {
    if (partner.holeId === holeId) {
      continue;
    }
    for (const reversed of [false, true]) {
      const placement = reversed
        ? wormBetween(partner.holeId, holeId)
        : wormBetween(holeId, partner.holeId);
      if (!canPlace(level, placements, placement)) {
        continue;
      }

      const result = drive(level, [...placements, placement]);
      const satisfied = result.outputs.filter((output) => output.satisfied).length;
      const selectedPose = result.gears.find((pose) => pose.holeId === holeId);
      const partnerPose = result.gears.find((pose) => pose.holeId === partner.holeId);

      let score = 0;
      if (satisfied > 0) {
        score -= 12 * satisfied;
      }
      if (partnerPose?.driven) {
        score -= 4;
      }
      if (selectedPose?.driven) {
        score -= 2;
      }
      score +=
        Math.abs(
          Math.hypot(
            holeCenter(level, holeId).x - holeCenter(level, level.motor.holeId).x,
            holeCenter(level, holeId).y - holeCenter(level, level.motor.holeId).y,
          ) -
            Math.hypot(
              holeCenter(level, partner.holeId).x - holeCenter(level, level.motor.holeId).x,
              holeCenter(level, partner.holeId).y - holeCenter(level, level.motor.holeId).y,
            ),
        ) / 280;

      if (!best || score < best.score) {
        best = { placement, score };
      }
    }
  }

  return best?.placement ?? null;
}
