import type { Language } from "@shared/i18n";
import { LESSONS } from "./lessons";
import type { Lesson } from "./types";

type LessonText = Pick<Lesson, "title" | "description">;

/** Engelse titel en uitleg per les. De Nederlandse tekst staat in de les zelf. */
const ENGLISH_LESSONS: Readonly<Record<string, LessonText>> = {
  "f-j": {
    title: "F and J",
    description: "Feel the little bumps and put your index fingers on them.",
  },
  "d-k": { title: "D and K", description: "Your middle fingers join in." },
  "s-l": { title: "S and L", description: "Now your ring fingers." },
  "a-puntkomma": { title: "A and ;", description: "It's the little fingers' turn." },
  "g-h": { title: "G and H", description: "Your index fingers reach sideways." },
  basisrij: { title: "The whole home row", description: "All ten keys mixed up." },
  "woorden-1": { title: "Short words", description: "Words with three or four letters." },
  "woorden-2": { title: "Longer words", description: "Words with four or five letters." },
};

const LESSON_TEXTS: Readonly<Record<Language, Readonly<Record<string, LessonText>>>> = {
  nl: Object.fromEntries(LESSONS.map((lesson) => [lesson.id, lesson])),
  en: ENGLISH_LESSONS,
};

/** Titel en uitleg van een les in de gekozen taal. */
export function lessonText(lesson: Lesson, language: Language): LessonText {
  return LESSON_TEXTS[language][lesson.id];
}
