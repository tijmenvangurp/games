import type { FrenchItem, FrenchLesson } from "@entities/french";
import { createSeed, mulberry32, shuffledIndexes } from "@shared/lib";

export interface SortCategory {
  lessonId: string;
  label: string;
}

export interface SortWord {
  item: FrenchItem;
  lessonId: string;
}

export interface SortRound {
  categories: SortCategory[];
  words: SortWord[];
}

function reviewedWords(lesson: FrenchLesson): FrenchItem[] {
  return lesson.items.filter((item) => item.kind === "word" && item.reviewed);
}

function eligibleSortLessons(lessons: readonly FrenchLesson[]): FrenchLesson[] {
  return lessons.filter(
    (lesson) => lesson.status === "reviewed" && reviewedWords(lesson).length > 0,
  );
}

function pickCategories(
  lessons: readonly FrenchLesson[],
  count: number,
  random: () => number,
): SortCategory[] {
  return shuffledIndexes(lessons.length, random)
    .slice(0, count)
    .map((index) => ({
      lessonId: lessons[index].id,
      label: lessons[index].category,
    }));
}

function pickWords(
  categories: readonly SortCategory[],
  lessons: readonly FrenchLesson[],
  count: number,
  random: () => number,
): SortWord[] {
  const words: SortWord[] = [];
  for (const category of categories) {
    const lesson = lessons.find((candidate) => candidate.id === category.lessonId);
    if (!lesson) {
      continue;
    }
    const candidates = reviewedWords(lesson);
    for (const index of shuffledIndexes(candidates.length, random).slice(0, count)) {
      words.push({ item: candidates[index], lessonId: lesson.id });
    }
  }
  return words;
}

export function createSortRound(
  lessons: readonly FrenchLesson[],
  seed: number = createSeed(),
  categoryCount = 3,
  wordsPerCategory = 2,
): SortRound {
  const random = mulberry32(seed);
  const eligible = eligibleSortLessons(lessons);
  const categories = pickCategories(eligible, Math.min(categoryCount, eligible.length), random);
  const words = pickWords(categories, eligible, wordsPerCategory, random);
  const order = shuffledIndexes(words.length, random);
  return { categories, words: order.map((index) => words[index]) };
}

export function isSortCorrect(word: SortWord, categoryId: string): boolean {
  return word.lessonId === categoryId;
}
