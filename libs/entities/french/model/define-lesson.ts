import type { FrenchItem, FrenchLesson } from "./types";

type LessonWithIds<Id extends string, ItemId extends string> = FrenchLesson & {
  id: Id;
  items: readonly (FrenchItem & { id: ItemId })[];
};

/**
 * Keeps lesson files data-only. Future runtime checks can be added here
 * without changing every lesson file. Lesson and item ids stay literal, so the
 * compiler can check that every item has an English meaning.
 */
export function defineLesson<const Id extends string, ItemId extends string>(
  lesson: LessonWithIds<Id, ItemId>,
): LessonWithIds<Id, ItemId> {
  return lesson;
}
