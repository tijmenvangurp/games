/**
 * Games that may sync progress. The ids mirror `gameCatalog` in
 * `libs/entities/game`; the Worker keeps its own copy so the bundle does not
 * depend on the client library. `tests/api/progress.test.ts` asserts that both
 * lists stay identical.
 */
export const PROGRESS_GAME_IDS = [
  "sudoku",
  "math-trainer",
  "arrows",
  "seek",
  "word-search",
  "memory",
  "pokemon-quiz",
  "chess-tutorial",
  "chess-puzzles",
  "french-listening",
] as const;

export type ProgressGameId = (typeof PROGRESS_GAME_IDS)[number];

export function isProgressGameId(value: unknown): value is ProgressGameId {
  return typeof value === "string" && (PROGRESS_GAME_IDS as readonly string[]).includes(value);
}
