import type { Cell, PersonId } from "../engine/domain/types";
import type { LevelJson } from "../engine/io/LevelSchema";
import levels from "./levels.json";
import { MURDOKU_CASE_SPECS, MURDOKU_DEFAULT_CASE_ID } from "./specs";
import type { MurdokuCase } from "./types";

interface StoredMurdokuCase {
  id: string;
  level: LevelJson;
  solution: Record<PersonId, Cell>;
}

interface StoredMurdokuLevels {
  version: number;
  cases: StoredMurdokuCase[];
}

const STORED = levels as unknown as StoredMurdokuLevels;
const BY_ID = new Map(STORED.cases.map((entry) => [entry.id, entry]));

/**
 * De twaalf eigen zaken van Wie was het?, in de volgorde van de vaste lijst.
 *
 * De borden komen uit `levels.json`, dat build-time is gemaakt door
 * `scripts/generate-murdoku-levels.ts`. De titel en intro staan in `specs.ts`.
 * Geen enkele zaak is een boekzaak of een levelbestand uit de MIT-repo.
 */
export const MURDOKU_CASES: readonly MurdokuCase[] = MURDOKU_CASE_SPECS.map((spec) => {
  const stored = BY_ID.get(spec.id);
  if (!stored) {
    throw new Error(`Zaak ${spec.id} ontbreekt in levels.json; draai \`pnpm run murdoku:levels\`.`);
  }
  return {
    id: spec.id,
    title: spec.title,
    intro: spec.intro,
    level: stored.level,
    solution: stored.solution,
  };
});

export { MURDOKU_DEFAULT_CASE_ID };

/** Zoekt een zaak op id; `null` als de id niet bestaat. */
export function murdokuCaseById(id: string): MurdokuCase | null {
  return MURDOKU_CASES.find((entry) => entry.id === id) ?? null;
}
