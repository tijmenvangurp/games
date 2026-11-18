import type { DriveResult, Level } from "@entities/gear";

export const JAMMED =
  "Vastgelopen. De beweging botst. Haal een onderdeel weg of probeer een andere plek.";

const METER_OFF = "De meter staat nog niet in het groen.";
const NEEDS_SPEED = "De lamp heeft meer snelheid nodig.";
const NEEDS_SLOW = "De lift gaat te snel. Maak de overbrenging langzamer.";
const WRONG_DIRECTION = "Het doel draait de andere kant op. Probeer een andere route.";
const ALL_USED = "Alle onderdelen zijn gebruikt. Haal er één weg en probeer opnieuw.";

/** One clear status line for the HUD, in priority order. */
export function statusMessage(
  level: Level,
  result: DriveResult,
  feedback: string | null,
  instruction: string,
  allUsed: boolean,
): string {
  if (result.solved) {
    return "Level gehaald.";
  }
  if (result.jammed) {
    return JAMMED;
  }
  if (feedback) {
    return feedback;
  }
  if (result.outputs.some((output) => output.kind === "generator" && output.satisfied)) {
    return "De lamp brandt.";
  }
  if (result.outputs.some((output) => output.kind === "lift" && output.satisfied)) {
    return "De lift gaat omhoog.";
  }
  if (result.outputs.some((output) => output.kind === "target" && output.satisfied)) {
    return "Het doel draait de goede kant op.";
  }

  const target = result.outputs.find(
    (output) => output.kind === "target" && output.speed !== 0 && !output.satisfied,
  );
  if (target) {
    const config = level.outputs.find((output) => output.id === target.id);
    if (config?.direction !== undefined && target.direction !== config.direction) {
      return WRONG_DIRECTION;
    }
    if (config?.minSpeed !== undefined || config?.maxSpeed !== undefined) {
      return METER_OFF;
    }
    return WRONG_DIRECTION;
  }

  if (result.outputs.some((output) => output.kind === "generator" && output.speed !== 0)) {
    return NEEDS_SPEED;
  }
  if (result.outputs.some((output) => output.kind === "lift" && output.speed !== 0)) {
    return NEEDS_SLOW;
  }
  if (allUsed) {
    return ALL_USED;
  }
  return instruction;
}
