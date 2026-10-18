import type { FrenchItem, FrenchLesson } from "@entities/french";
import { createSeed, mulberry32, shuffledIndexes } from "@shared/lib";

export const FRENCH_OPTION_COUNT = 4;

export interface FrenchQuestion {
  item: FrenchItem;
  /** Four Dutch options, including the correct one, already shuffled. */
  options: string[];
  correctIndex: number;
  seed: number;
}

function unique(values: readonly string[], exclude: string): string[] {
  const seen = new Set<string>([exclude]);
  const result: string[] = [];
  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }
  return result;
}

function contrastDistractors(item: FrenchItem, pool: readonly FrenchItem[]): string[] {
  const byId = new Map(pool.map((candidate) => [candidate.id, candidate.nl]));
  return (item.contrastWith ?? [])
    .map((id) => byId.get(id))
    .filter((value): value is string => Boolean(value));
}

function curatedDistractors(item: FrenchItem, pool: readonly FrenchItem[]): string[] | null {
  if (item.distractors?.length) {
    return [...item.distractors];
  }
  if (!item.contrastWith?.length) {
    return null;
  }
  const values = contrastDistractors(item, pool);
  return values.length > 0 ? values : null;
}

function chooseDistractors(
  candidates: readonly string[],
  fallback: readonly string[],
  random: () => number,
): string[] {
  if (candidates.length >= FRENCH_OPTION_COUNT - 1) {
    return shuffledIndexes(candidates.length, random)
      .slice(0, FRENCH_OPTION_COUNT - 1)
      .map((index) => candidates[index]);
  }

  const fill = shuffledIndexes(fallback.length, random)
    .slice(0, FRENCH_OPTION_COUNT - 1 - candidates.length)
    .map((index) => fallback[index]);
  return [...candidates, ...fill];
}

/**
 * Builds one listening question. Words draw their distractors from other words
 * in the same lesson; phrases use the curated `distractors` so the options stay
 * plausible instead of becoming random sentences.
 */
export function createFrenchQuestion(
  item: FrenchItem,
  pool: readonly FrenchItem[],
  seed: number = createSeed(),
): FrenchQuestion {
  const random = mulberry32(seed);
  const sameKind = pool.filter((candidate) => candidate.kind === item.kind);
  const curated = curatedDistractors(item, pool);
  const preferred = curated ?? sameKind.map((candidate) => candidate.nl);
  const candidates = unique(preferred, item.nl);

  // Fill from the wider pool only when a lesson has fewer than three curated
  // or same-kind candidates.
  const fallback = unique(
    pool.map((candidate) => candidate.nl),
    item.nl,
  ).filter((value) => !candidates.includes(value));
  const distractors = chooseDistractors(candidates, fallback, random);

  const options = [item.nl, ...distractors];
  for (let index = options.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    const current = options[index];
    options[index] = options[swapWith];
    options[swapWith] = current;
  }

  return {
    item,
    options,
    correctIndex: options.indexOf(item.nl),
    seed,
  };
}

/** Shuffles the reviewed items once, so a lesson feels different every time. */
export function createFrenchQueue(lesson: FrenchLesson, seed: number = createSeed()): FrenchItem[] {
  const items = lesson.items.filter((item) => item.reviewed);
  const order = shuffledIndexes(items.length, mulberry32(seed));
  return order.map((index) => items[index]);
}
