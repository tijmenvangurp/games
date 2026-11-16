import type { Cell, PersonId } from "../engine/domain/types";
import type { LevelJson } from "../engine/io/LevelSchema";

/**
 * De buit van een zaak: het gestolen voorwerp dat op het bord staat.
 *
 * De engine kent intern nog een `victim`-persoon voor de rij/kolom-bijectie en
 * de daderregel. Voor de speler is dat de buit: een voorwerp, geen slachtoffer.
 * De UI toont de naam en het lokale elementicoon bij het vakje van de buit.
 */
export interface MurdokuLoot {
  /** Nederlandse naam met lidwoord, bijvoorbeeld "de huissleutel". */
  name: string;
  /** Bestandsnaam zonder `.svg` uit `apps/games/public/elements/`. */
  icon: string;
}

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
  /** De gestolen buit van deze zaak; de levelnaam van de interne victim. */
  loot: MurdokuLoot;
  level: LevelJson;
  solution: Readonly<Record<PersonId, Cell>>;
}
