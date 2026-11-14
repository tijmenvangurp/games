export { boardViewBox, gearPath, gearRadius, gearTeeth, holeCenter } from "./model/geometry";
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
