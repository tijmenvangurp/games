import type { FrenchItem, FrenchLesson } from "./types";

export interface CurriculumIssue {
  path: string;
  message: string;
}

export interface CurriculumValidationOptions {
  /** Receives a filename such as `animaux-chat.mp3`; returns whether it exists. */
  audioExists?: (fileName: string) => boolean;
}

const MIN_WORDS = 10;
const MIN_PHRASES = 5;
const MIN_PHRASE_DISTRACTORS = 3;

function issue(path: string, message: string): CurriculumIssue {
  return { path, message };
}

function validateLessonHeader(lesson: FrenchLesson, seenLessonIds: Set<string>): CurriculumIssue[] {
  const issues: CurriculumIssue[] = [];

  if (!lesson.id.trim()) {
    issues.push(issue("lesson", "Lesson id is empty."));
  } else if (seenLessonIds.has(lesson.id)) {
    issues.push(issue(lesson.id, "Duplicate lesson id."));
  } else {
    seenLessonIds.add(lesson.id);
  }

  if (!lesson.title.trim()) {
    issues.push(issue(lesson.id, "Lesson title is empty."));
  }
  if (!lesson.subtitle.trim()) {
    issues.push(issue(lesson.id, "Lesson subtitle is empty."));
  }

  return issues;
}

function validateItems(lesson: FrenchLesson, seenItemIds: Set<string>): CurriculumIssue[] {
  const issues: CurriculumIssue[] = [];

  for (const item of lesson.items) {
    const path = `${lesson.id}/${item.id}`;
    if (!item.id.trim()) {
      issues.push(issue(path, "Item id is empty."));
    } else if (seenItemIds.has(item.id)) {
      issues.push(issue(path, "Duplicate item id."));
    } else {
      seenItemIds.add(item.id);
      if (!item.id.startsWith(`${lesson.id}-`)) {
        issues.push(issue(path, `Item id must start with "${lesson.id}-".`));
      }
    }

    if (!item.fr.trim()) {
      issues.push(issue(path, "French text is empty."));
    }
    if (!item.nl.trim()) {
      issues.push(issue(path, "Dutch translation is empty."));
    }
  }

  return issues;
}

function validateTranslations(lesson: FrenchLesson): CurriculumIssue[] {
  const issues: CurriculumIssue[] = [];
  const seen = new Map<string, string>();

  for (const item of lesson.items) {
    const existing = seen.get(item.nl);
    if (existing) {
      issues.push(issue(`${lesson.id}/${item.id}`, `Duplicate Dutch translation of ${existing}.`));
    } else {
      seen.set(item.nl, item.id);
    }
  }

  return issues;
}

function validateExample(item: FrenchItem, path: string): CurriculumIssue[] {
  if (!item.example) {
    return [];
  }
  const issues: CurriculumIssue[] = [];
  if (!item.example.fr.trim()) {
    issues.push(issue(path, "Example sentence is empty."));
  }
  if (!item.example.nl.trim()) {
    issues.push(issue(path, "Example translation is empty."));
  }
  return issues;
}

function validateContrast(item: FrenchItem, lesson: FrenchLesson, path: string): CurriculumIssue[] {
  if (!item.contrastWith) {
    return [];
  }
  const issues: CurriculumIssue[] = [];
  const ids = new Set(lesson.items.map((candidate) => candidate.id));
  for (const contrastId of item.contrastWith) {
    if (contrastId === item.id) {
      issues.push(issue(path, "Item cannot contrast with itself."));
    } else if (!ids.has(contrastId)) {
      issues.push(issue(path, `Unknown contrast item "${contrastId}".`));
    }
  }
  return issues;
}

function validatePhrase(item: FrenchItem, path: string, required: boolean): CurriculumIssue[] {
  if (!required || item.kind !== "phrase") {
    return [];
  }
  const distractors = item.distractors ?? [];
  if (distractors.length < MIN_PHRASE_DISTRACTORS) {
    return [issue(path, `Phrase needs at least ${MIN_PHRASE_DISTRACTORS} distractors.`)];
  }

  const issues: CurriculumIssue[] = [];
  const unique = new Set(distractors);
  if (unique.size !== distractors.length) {
    issues.push(issue(path, "Phrase distractors must be unique."));
  }
  if (unique.has(item.nl)) {
    issues.push(issue(path, "Phrase distractor cannot equal the answer."));
  }
  return issues;
}

function validateReviewedSize(lesson: FrenchLesson): CurriculumIssue[] {
  if (lesson.status !== "reviewed") {
    return [];
  }
  const words = lesson.items.filter((item) => item.kind === "word");
  const phrases = lesson.items.filter((item) => item.kind === "phrase");
  const issues: CurriculumIssue[] = [];

  if (words.length < MIN_WORDS) {
    issues.push(issue(lesson.id, `Reviewed lesson needs at least ${MIN_WORDS} words.`));
  }
  if (phrases.length < MIN_PHRASES) {
    issues.push(issue(lesson.id, `Reviewed lesson needs at least ${MIN_PHRASES} phrases.`));
  }
  return issues;
}

function validateWordAudio(
  item: FrenchItem,
  path: string,
  options: CurriculumValidationOptions,
): CurriculumIssue[] {
  if (!options.audioExists) {
    return [];
  }
  return options.audioExists(`${item.id}.mp3`)
    ? []
    : [issue(path, `Missing audio file "${item.id}.mp3".`)];
}

function validateExampleAudio(
  item: FrenchItem,
  path: string,
  options: CurriculumValidationOptions,
): CurriculumIssue[] {
  if (!options.audioExists || !item.example) {
    return [];
  }
  return options.audioExists(`${item.id}-example.mp3`)
    ? []
    : [issue(path, `Missing example audio file "${item.id}-example.mp3".`)];
}

function validateReviewedItem(
  item: FrenchItem,
  path: string,
  options: CurriculumValidationOptions,
): CurriculumIssue[] {
  const issues: CurriculumIssue[] = [];
  if (!item.reviewed) {
    issues.push(issue(path, "Reviewed lesson contains an unreviewed item."));
  }
  if (item.kind === "word" && !item.example) {
    issues.push(issue(path, "Word needs an example sentence."));
  }
  issues.push(...validateWordAudio(item, path, options));
  issues.push(...validateExampleAudio(item, path, options));
  return issues;
}

function validateReviewedItems(
  lesson: FrenchLesson,
  options: CurriculumValidationOptions,
): CurriculumIssue[] {
  if (lesson.status !== "reviewed") {
    return [];
  }
  const issues: CurriculumIssue[] = [];
  for (const item of lesson.items) {
    issues.push(...validateReviewedItem(item, `${lesson.id}/${item.id}`, options));
  }
  return issues;
}

/**
 * One content contract for every lesson. The app, the generator and the tests
 * use the same rules, so a new lesson cannot silently ship incomplete.
 */
export function validateCurriculum(
  curriculum: readonly FrenchLesson[],
  options: CurriculumValidationOptions = {},
): CurriculumIssue[] {
  const issues: CurriculumIssue[] = [];
  const lessonIds = new Set<string>();
  const itemIds = new Set<string>();

  for (const lesson of curriculum) {
    issues.push(...validateLessonHeader(lesson, lessonIds));
    issues.push(...validateItems(lesson, itemIds));
    issues.push(...validateTranslations(lesson));
    issues.push(...validateReviewedSize(lesson));
    issues.push(...validateReviewedItems(lesson, options));

    for (const item of lesson.items) {
      const path = `${lesson.id}/${item.id}`;
      issues.push(...validateExample(item, path));
      issues.push(...validateContrast(item, lesson, path));
      issues.push(...validatePhrase(item, path, lesson.status === "reviewed"));
    }
  }

  return issues;
}
