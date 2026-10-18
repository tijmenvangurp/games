import { LESSON_ANIMAUX } from "./lessons/animaux";
import type { FrenchItem, FrenchLesson } from "./types";

/** One place that knows which lessons exist and in which order. */
export const FRENCH_CURRICULUM = [LESSON_ANIMAUX] as const satisfies readonly FrenchLesson[];

export function listPublishedLessons(): readonly FrenchLesson[] {
  return FRENCH_CURRICULUM.filter((lesson) => lesson.status === "reviewed");
}

export function getLesson(lessonId: string): FrenchLesson | undefined {
  return FRENCH_CURRICULUM.find((lesson) => lesson.id === lessonId);
}

export function allFrenchItems(): readonly FrenchItem[] {
  return FRENCH_CURRICULUM.flatMap((lesson) => lesson.items);
}
