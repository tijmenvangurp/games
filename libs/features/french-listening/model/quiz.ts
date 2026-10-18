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
  const preferred = item.distractors?.length
    ? item.distractors
    : sameKind.map((candidate) => candidate.nl);
  const candidates = unique(preferred, item.nl);

  // Defensive fallback: the prototype lessons always provide enough options,
  // but a future lesson should never crash on a short pool.
  const fallback = unique(
    pool.map((candidate) => candidate.nl),
    item.nl,
  ).filter((value) => !candidates.includes(value));
  // Curated phrase distractors win; only short lessons need the fallback.
  const all =
    candidates.length >= FRENCH_OPTION_COUNT - 1 ? candidates : [...candidates, ...fallback];
  const distractors = shuffledIndexes(all.length, random)
    .slice(0, FRENCH_OPTION_COUNT - 1)
    .map((index) => all[index]);

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
