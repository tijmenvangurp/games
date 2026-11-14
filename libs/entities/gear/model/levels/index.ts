import type { Level } from "../types";
import { CHAPTER_1_LEVELS } from "./chapter-1";
import { CHAPTER_2_LEVELS } from "./chapter-2";
import { CHAPTER_3_LEVELS } from "./chapter-3";
import { CHAPTER_4_LEVELS } from "./chapter-4";

const ALL_LEVELS: readonly Level[] = [
  ...CHAPTER_1_LEVELS,
  ...CHAPTER_2_LEVELS,
  ...CHAPTER_3_LEVELS,
  ...CHAPTER_4_LEVELS,
];

export const LEVEL_COUNT = ALL_LEVELS.length;

export function allLevels(): readonly Level[] {
  return ALL_LEVELS;
}

export function levelAt(index: number): Level {
  const level = ALL_LEVELS[index];
  if (!level) {
    throw new Error(`Unknown Draaiwerk level: ${index}`);
  }
  return level;
}
