import { LESSONS } from "./lessons";
import type { Progress, RoundResult } from "./types";

export const MAX_LOG_ENTRIES = 200;

export function emptyProgress(): Progress {
  return { completed: [], best: {}, log: [] };
}

/** De eerste les staat open; elke volgende na het afronden van de vorige. */
export function isUnlocked(lessonId: string, progress: Progress): boolean {
  const index = LESSONS.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) {
    return false;
  }
  return index === 0 || progress.completed.includes(LESSONS[index - 1].id);
}

/** De eerste les die nog niet is afgerond, of de laatste als alles klaar is. */
export function nextLessonId(progress: Progress): string {
  const next = LESSONS.find((lesson) => !progress.completed.includes(lesson.id));
  return (next ?? LESSONS[LESSONS.length - 1]).id;
}

export function applyResult(progress: Progress, result: RoundResult, at: number): Progress {
  const completed =
    result.verdict === "ontgrendeld" && !progress.completed.includes(result.lessonId)
      ? [...progress.completed, result.lessonId]
      : progress.completed;
  const best = Math.max(progress.best[result.lessonId] ?? 0, result.accuracy);
  const log = [...progress.log, { lessonId: result.lessonId, accuracy: result.accuracy, at }];

  return {
    completed,
    best: { ...progress.best, [result.lessonId]: best },
    log: log.slice(-MAX_LOG_ENTRIES),
  };
}
