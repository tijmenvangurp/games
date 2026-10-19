import { createSeed, mulberry32, shuffledIndexes } from "@shared/lib";
import { subjectsFor } from "./config";
import type { FlagLevel, FlagScope, FlagSubject } from "./types";

/** A round has eight pieces: enough to puzzle, short enough for one sitting. */
const PUZZLE_ROUND_SIZE = 8;

/** A scope needs at least a few shapes to be a puzzle. */
const MIN_PUZZLE_COUNTRIES = 4;

export interface PuzzleQuestion {
  id: number;
  /** The subject whose shape is the piece, and the slot it belongs in. */
  subject: FlagSubject;
}

export interface PuzzleRound {
  scope: FlagScope;
  level: FlagLevel;
  seed: number;
  questions: readonly PuzzleQuestion[];
}

/** The subjects of a scope that actually have a shape to play with. */
function puzzlePool(scope: FlagScope, available: ReadonlySet<string>): readonly FlagSubject[] {
  return subjectsFor(scope).filter((subject) => available.has(subject.code));
}

/**
 * Picks the pieces for one round, around a random anchor country. The nearest
 * neighbours keep the map zoomed in on one region, so the pieces and the empty
 * slots stay big enough to touch on a phone.
 *
 * The caller supplies the codes that the geometry actually has (country
 * outlines or province shapes), so the selection matches the map that will be
 * drawn.
 */
export function createPuzzleRound(
  scope: FlagScope,
  level: FlagLevel,
  available: ReadonlySet<string>,
  seed: number = createSeed(),
): PuzzleRound {
  const pool = puzzlePool(scope, available);
  if (pool.length < MIN_PUZZLE_COUNTRIES) {
    throw new Error(`Te weinig landen met een kaart voor ${scope}`);
  }

  const random = mulberry32(seed);
  const size = Math.min(PUZZLE_ROUND_SIZE, pool.length);
  const anchor = pool[Math.floor(random() * pool.length)] as FlagSubject;
  const nearest = pool
    .filter((subject) => subject.code !== anchor.code)
    .sort((left, right) => {
      const difference = distanceBetween(anchor, left) - distanceBetween(anchor, right);

      return difference !== 0 ? difference : left.code.localeCompare(right.code);
    })
    .slice(0, size - 1);
  const chosen = shuffledIndexes(size, random).map(
    (index) => [anchor, ...nearest][index] as FlagSubject,
  );

  return {
    scope,
    level,
    seed,
    questions: chosen.map((subject, id) => ({ id, subject })),
  };
}

function distanceBetween(left: FlagSubject, right: FlagSubject): number {
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
