/**
 * Wie was het? — de 1:1 overgenomen MIT-engine achter een eigen public API.
 *
 * De engine is pure TypeScript zonder React of DOM. De bron staat in
 * `model/engine/`; de spel- en UI-laag praat alleen met de functies hieronder.
 */
export { ENGINE_VERSION } from "./model/engine/index";

export {
  checkMurdokuLevel,
  countMurdokuSolutions,
  findMurdokuMurderer,
  generateMurdokuLevel,
  loadMurdokuLevel,
  placementOf,
  validateMurdokuPlacement,
} from "./model/murdoku";

export { MURDOKU_CASES, MURDOKU_DEFAULT_CASE_ID, murdokuCaseById } from "./model/cases/cases";
export { validateMurdokuCases } from "./model/cases/validate";
export type { MurdokuCase } from "./model/cases/types";

export { nextMurdokuHint } from "./model/hints";
export type { MurdokuHint } from "./model/hints";

export { VICTIM_ID } from "./model/engine/domain/types";
export type { Cell, PersonId } from "./model/engine/domain/types";
export type { LevelJson } from "./model/engine/io/index";

/**
 * De renderlaag (feature `murdoku-game`) leest het bord rechtstreeks: het
 * kamernaamKey, de objecttypes en de vakjes. Deze exports zijn de minimale
 * oppervlakte daarvoor — geen extra spellogica.
 */
export {
  MULTI_CELL_TYPES,
  VOID_ROOM,
  isWaterRoom,
  AndClue,
  AtWallClue,
  BesideSameObjectClue,
  CornerClue,
  DirectionFromObjectClue,
  InColClue,
  InRoomClue,
  InRowClue,
  NearAnyObjectClue,
  NearDoorClue,
  NearObjectClue,
  NearWindowClue,
  NotClue,
  OnObjectClue,
  OrClue,
  OutsideClue,
  SameLineAsObjectClue,
  SameRoomAsObjectClue,
  UniqueNearDoorClue,
  UniqueNearObjectClue,
  UniqueNearWindowClue,
  UniqueOnObjectClue,
  UniqueOutsideClue,
} from "./model/engine/index";
export type { Board, Clue, Explanation, Puzzle, Side } from "./model/engine/index";
