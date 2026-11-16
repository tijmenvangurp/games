import { generateLevel } from "./engine/generator/index";
import type { GenerateOptions } from "./engine/generator/index";
import { loadLevel } from "./engine/io/index";
import type { LevelJson } from "./engine/io/index";
import { Puzzle } from "./engine/domain/Puzzle";
import { Solution } from "./engine/domain/Solution";
import type { Cell, PersonId } from "./engine/domain/types";
import { SearchSolver, checkLevel, findMurderer, unsatisfiedClues } from "./engine/solver/index";
import type { ClueFailure, LevelCheck, MurdererResult } from "./engine/solver/index";

/** Een level uit JSON, of een al geladen bord. */
type MurdokuLevelSource = LevelJson | Puzzle;

/** Een plaatsing als leesbare kaart of als gewoon object. */
type MurdokuPlacement = ReadonlyMap<PersonId, Cell> | Readonly<Record<PersonId, Cell>>;

function toPuzzle(source: MurdokuLevelSource): Puzzle {
  return source instanceof Puzzle ? source : loadLevel(source);
}

function toMap(placement: MurdokuPlacement): Map<PersonId, Cell> {
  return placement instanceof Map ? new Map(placement) : new Map(Object.entries(placement));
}

/** Laadt een level-JSON tot een bord met alle regels en aanwijzingen. */
export function loadMurdokuLevel(level: LevelJson): Puzzle {
  return loadLevel(level);
}

/**
 * Controleert een level: aantal oplossingen (tot 2), of het uniek en logisch
 * oplosbaar is, en geeft één oplossing terug.
 */
export function checkMurdokuLevel(
  source: MurdokuLevelSource,
  options: { forwardOnly?: boolean } = {},
): LevelCheck {
  return checkLevel(toPuzzle(source), options);
}

/** Telt oplossingen tot `limit` (standaard 2: genoeg om te weten of het uniek is). */
export function countMurdokuSolutions(source: MurdokuLevelSource, limit = 2): number {
  return new SearchSolver(toPuzzle(source)).countSolutions(limit);
}

/** De dader: de enige verdachte in de kamer van het slachtoffer. */
export function findMurdokuMurderer(
  source: MurdokuLevelSource,
  placement: MurdokuPlacement,
): MurdererResult {
  return findMurderer(toPuzzle(source), new Solution(toMap(placement)));
}

/**
 * Controleert een volledige plaatsing tegen alle aanwijzingen, de
 * slachtofferregel en de bordbrede aanwijzingen. Leeg betekent: alles klopt.
 */
export function validateMurdokuPlacement(
  source: MurdokuLevelSource,
  placement: MurdokuPlacement,
): ClueFailure[] {
  return unsatisfiedClues(toPuzzle(source), toMap(placement));
}

/** De plaatsing als kaart van persoon naar cel. */
export function placementOf(solution: Solution): Map<PersonId, Cell> {
  return new Map(solution.entries());
}

/** Genereert een compleet level-JSON; bedoeld voor build-time gebruik. */
export function generateMurdokuLevel(options: GenerateOptions): LevelJson {
  return generateLevel(options);
}
