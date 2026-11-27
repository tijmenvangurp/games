import type { DriveResult, Level } from "@entities/gear";
import { getTexts } from "@shared/i18n";
import { draaiwerkTexts } from "./texts";

/** One clear status line for the HUD, in priority order. */
export function statusMessage(
  level: Level,
  result: DriveResult,
  feedback: string | null,
  instruction: string,
  allUsed: boolean,
): string {
  const t = getTexts(draaiwerkTexts);
  if (result.solved) {
    return t.solved;
  }
  if (result.jammed) {
    return t.jammed;
  }
  if (feedback) {
    return feedback;
  }
  if (result.outputs.some((output) => output.kind === "generator" && output.satisfied)) {
    return t.lampOn;
  }
  if (result.outputs.some((output) => output.kind === "lift" && output.satisfied)) {
    return t.liftUp;
  }
  if (result.outputs.some((output) => output.kind === "target" && output.satisfied)) {
    return t.targetRight;
  }

  const target = result.outputs.find(
    (output) => output.kind === "target" && output.speed !== 0 && !output.satisfied,
  );
  if (target) {
    const config = level.outputs.find((output) => output.id === target.id);
    if (config?.direction !== undefined && target.direction !== config.direction) {
      return t.wrongDirection;
    }
    if (config?.minSpeed !== undefined || config?.maxSpeed !== undefined) {
      return t.meterOff;
    }
    return t.wrongDirection;
  }

  if (result.outputs.some((output) => output.kind === "generator" && output.speed !== 0)) {
    return t.needsSpeed;
  }
  if (result.outputs.some((output) => output.kind === "lift" && output.speed !== 0)) {
    return t.needsSlow;
  }
  if (allUsed) {
    return t.allUsed;
  }
  return instruction;
}
