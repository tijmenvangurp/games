import { createSeed, mulberry32, shuffledIndexes } from "@shared/lib";
import { subjectsFor } from "./config";
import type { Country, FlagLevel, FlagScope, FlagSubject } from "./types";

/** A round has eight pieces: enough to puzzle, short enough for one sitting. */
const PUZZLE_ROUND_SIZE = 8;

/** A scope needs at least a few countries with an outline to be a puzzle. */
const MIN_PUZZLE_COUNTRIES = 4;

export interface PuzzleQuestion {
  id: number;
  /** The country whose shape is the piece, and the slot it belongs in. */
  country: Country;
}

export interface PuzzleRound {
  scope: FlagScope;
  level: FlagLevel;
  seed: number;
  questions: readonly PuzzleQuestion[];
}

function hasOutline(subject: FlagSubject): subject is Country {
  if (!("numeric" in subject)) {
    return false;
  }

  return typeof subject.numeric === "string" && subject.numeric !== "";
}

/**
 * The countries of a scope that Natural Earth has an outline for. Small island
 * states without an outline cannot be a puzzle piece, so they are left out.
 */
function puzzlePool(scope: FlagScope, shapeCodes: ReadonlySet<string>): readonly Country[] {
  return subjectsFor(scope).filter(
    (subject): subject is Country => hasOutline(subject) && shapeCodes.has(subject.numeric),
  );
}

function distanceBetween(left: Country, right: Country): number {
  const radians = Math.PI / 180;
  const deltaLatitude = (right.latitude - left.latitude) * radians;
  const deltaLongitude = (right.longitude - left.longitude) * radians;
  const leftLatitude = left.latitude * radians;
  const rightLatitude = right.latitude * radians;
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(deltaLongitude / 2) ** 2;

  return 2 * Math.asin(Math.sqrt(a));
}

/**
 * Picks the pieces for one round, around a random anchor country. The nearest
 * neighbours keep the map zoomed in on one region, so the pieces and the empty
 * slots stay big enough to touch on a phone.
 *
 * The caller supplies the ISO numeric codes that the world atlas actually has,
 * so the selection matches the map that will be drawn.
 */
export function createPuzzleRound(
  scope: FlagScope,
  level: FlagLevel,
  shapeCodes: ReadonlySet<string>,
  seed: number = createSeed(),
): PuzzleRound {
  const pool = puzzlePool(scope, shapeCodes);
  if (pool.length < MIN_PUZZLE_COUNTRIES) {
    throw new Error(`Te weinig landen met een kaart voor ${scope}`);
  }

  const random = mulberry32(seed);
  const size = Math.min(PUZZLE_ROUND_SIZE, pool.length);
  const anchor = pool[Math.floor(random() * pool.length)] as Country;
  const nearest = pool
    .filter((country) => country.code !== anchor.code)
    .sort((left, right) => {
      const difference = distanceBetween(anchor, left) - distanceBetween(anchor, right);

      return difference !== 0 ? difference : left.code.localeCompare(right.code);
    })
    .slice(0, size - 1);
  const chosen = shuffledIndexes(size, random).map(
    (index) => [anchor, ...nearest][index] as Country,
  );

  return {
    scope,
    level,
    seed,
    questions: chosen.map((country, id) => ({ id, country })),
  };
}
