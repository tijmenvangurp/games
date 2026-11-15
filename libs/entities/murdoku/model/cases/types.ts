import type { Cell, PersonId } from "../engine/domain/types";
import type { LevelJson } from "../engine/io/LevelSchema";

/**
 * Eén eigen zaak van Wie was het?: het bord, de Nederlandse titel en intro, en
 * de oplossing die de controle gebruikt.
 *
 * De oplossing staat bewust in de data: de client hoeft dan niet te zoeken en
 * de build-time generator is de enige plek die de zaak oplost.
 */
export interface MurdokuCase {
  /** Eigen, leesbare id; nooit de `gen-…`-id van de generator. */
  id: string;
  title: string;
  intro: string;
  level: LevelJson;
  solution: Readonly<Record<PersonId, Cell>>;
}
