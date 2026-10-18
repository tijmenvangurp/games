import type { FrenchLesson } from "./types";

/**
 * Keeps lesson files data-only. Future runtime checks can be added here
 * without changing every lesson file.
 */
export function defineLesson(lesson: FrenchLesson): FrenchLesson {
  return lesson;
}
