import type { Attempt, Progress } from "./types";

export const MAX_LOG_ENTRIES = 200;

export function emptyProgress(): Progress {
  return { best: {}, log: [] };
}

export function applyAttempt(progress: Progress, attempt: Attempt): Progress {
  const key = `${attempt.theme}-${attempt.level}`;
  const best = Math.max(progress.best[key] ?? 0, attempt.firstTry);
  const log = [...progress.log, attempt].slice(-MAX_LOG_ENTRIES);
  return { best: { ...progress.best, [key]: best }, log };
}
