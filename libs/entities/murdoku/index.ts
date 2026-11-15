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

export { VICTIM_ID } from "./model/engine/domain/types";
export type { Cell, PersonId } from "./model/engine/domain/types";
export type { LevelJson } from "./model/engine/io/index";
