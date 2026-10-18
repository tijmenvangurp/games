import {
  PROGRESS_SCHEMA_VERSION,
  type ProgressVersion,
  type SyncableProgress,
  type SyncableSetting,
} from "./types";

function timestampOf(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Positive when `candidate` is newer than `reference`. Settings use
 * last-write-wins on `clientUpdatedAt`; the revision breaks an exact tie.
 */
export function compareProgressVersions(
  candidate: ProgressVersion,
  reference: ProgressVersion,
): number {
  const candidateTime = timestampOf(candidate.clientUpdatedAt);
  const referenceTime = timestampOf(reference.clientUpdatedAt);
  if (candidateTime !== referenceTime) {
    return candidateTime - referenceTime;
  }
  return candidate.revision - reference.revision;
}

function newerVersion(
  existing: ProgressVersion,
  incoming: ProgressVersion,
): { winner: ProgressVersion; other: ProgressVersion } {
  return compareProgressVersions(incoming, existing) >= 0
    ? { winner: incoming, other: existing }
    : { winner: existing, other: incoming };
}

function mergeSettings(
  winner: ProgressVersion,
  other: ProgressVersion,
): Readonly<Record<string, SyncableSetting>> | undefined {
  return winner.data.settings ?? other.data.settings;
}

function mergeBest(
  existing: ProgressVersion,
  incoming: ProgressVersion,
): Readonly<Record<string, number>> | undefined {
  const existingBest = existing.data.best;
  const incomingBest = incoming.data.best;
  if (!existingBest && !incomingBest) {
    return undefined;
  }

  const best: Record<string, number> = {};
  for (const [key, score] of Object.entries(existingBest ?? {})) {
    best[key] = score;
  }
  for (const [key, score] of Object.entries(incomingBest ?? {})) {
    best[key] = Math.max(best[key] ?? 0, score);
  }
  return best;
}

function mergeUnlocked(existing: ProgressVersion, incoming: ProgressVersion): number | undefined {
  const existingUnlocked = existing.data.unlocked;
  const incomingUnlocked = incoming.data.unlocked;
  if (existingUnlocked === undefined && incomingUnlocked === undefined) {
    return undefined;
  }
  return Math.max(existingUnlocked ?? 0, incomingUnlocked ?? 0);
}

/**
 * Pure merge of two snapshots of the same game.
 *
 * - settings: last-write-wins on `clientUpdatedAt`, revision as tiebreaker;
 * - best scores: per-key `max(existing, incoming)`;
 * - unlocked: `max(existing, incoming)`;
 * - a schema mismatch never merges: the local snapshot is kept.
 *
 * The function has no storage, fetch or React dependency so the server and
 * the client can share the same rules in tests.
 */
export function mergeProgressData(
  existing: ProgressVersion | null,
  incoming: ProgressVersion,
): SyncableProgress {
  if (existing && existing.schemaVersion !== incoming.schemaVersion) {
    return existing.data;
  }
  if (incoming.schemaVersion !== PROGRESS_SCHEMA_VERSION) {
    return existing?.data ?? {};
  }
  if (!existing) {
    return incoming.data;
  }

  const { winner, other } = newerVersion(existing, incoming);
  const result: {
    settings?: Readonly<Record<string, SyncableSetting>>;
    best?: Readonly<Record<string, number>>;
    unlocked?: number;
  } = {};

  const settings = mergeSettings(winner, other);
  if (settings) {
    result.settings = settings;
  }

  const best = mergeBest(existing, incoming);
  if (best) {
    result.best = best;
  }

  const unlocked = mergeUnlocked(existing, incoming);
  if (unlocked !== undefined) {
    result.unlocked = unlocked;
  }

  return result;
}

function recordsEqual(
  left: Readonly<Record<string, unknown>> | undefined,
  right: Readonly<Record<string, unknown>> | undefined,
): boolean {
  if (!left && !right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  return leftKeys.every((key, index) => key === rightKeys[index] && left[key] === right[key]);
}

/** Stable equality for deciding whether a merge changed anything. */
export function progressDataEquals(left: SyncableProgress, right: SyncableProgress): boolean {
  return (
    recordsEqual(left.settings, right.settings) &&
    recordsEqual(left.best, right.best) &&
    left.unlocked === right.unlocked
  );
}
