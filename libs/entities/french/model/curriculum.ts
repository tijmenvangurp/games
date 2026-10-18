import { LESSON_ANIMAUX } from "./lessons/animaux";
import { LESSON_CORPS } from "./lessons/corps";
import { LESSON_ECOLE } from "./lessons/ecole";
import { LESSON_FAMILLE } from "./lessons/famille";
import { LESSON_METEO } from "./lessons/meteo";
import { LESSON_NOURRITURE } from "./lessons/nourriture";
import { LESSON_SALUTATIONS } from "./lessons/salutations";
import type { FrenchItem, FrenchLesson } from "./types";

/** One place that knows which lessons exist and in which order. */
export const FRENCH_CURRICULUM = [
  LESSON_SALUTATIONS,
  LESSON_ANIMAUX,
  LESSON_FAMILLE,
  LESSON_NOURRITURE,
  LESSON_ECOLE,
  LESSON_METEO,
  LESSON_CORPS,
] as const satisfies readonly FrenchLesson[];

export function listPublishedLessons(): readonly FrenchLesson[] {
  return FRENCH_CURRICULUM.filter((lesson) => lesson.status === "reviewed");
}

export function getLesson(lessonId: string): FrenchLesson | undefined {
  return FRENCH_CURRICULUM.find((lesson) => lesson.id === lessonId);
}

export function allFrenchItems(): readonly FrenchItem[] {
  return FRENCH_CURRICULUM.flatMap((lesson) => lesson.items);
}
