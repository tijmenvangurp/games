export {
  beltTangentRuns,
  boardRect,
  boardViewBox,
  connectionLength,
  connectionPath,
  gearPath,
  gearRadius,
  gearTeeth,
  holeCenter,
  WORM_SHAFT_CLEARANCE,
  wormShaft,
} from "./model/geometry";
export type { WormShaft } from "./model/geometry";
export { LEVEL_COUNT, allLevels, levelAt } from "./model/levels";
export {
  canPlace,
  drive,
  evaluate,
  gearSlots,
  trayItemMatches,
  trayLabel,
  validateLevel,
} from "./model/rules";
export type {
  BeltRun,
  ConnectionPose,
  DriveResult,
  GearPose,
  GearSize,
  Hole,
  Level,
  Motor,
  Output,
  OutputKind,
  OutputPose,
  Placement,
  TrayItem,
} from "./model/types";
