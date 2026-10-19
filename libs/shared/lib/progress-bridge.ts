/**
 * Small, framework-free bridge between the game stores and the sync feature.
 *
 * Game stores register how to read and apply their syncable snapshot. The sync
 * feature (a feature layer above them) would otherwise have to import every
 * game feature, which FSD forbids. The bridge has no storage, fetch or React
 * dependency of its own.
 */
export interface LocalProgressAdapter {
  /** Reads the snapshot for a specific local profile (`p1`). */
  read: (profileId: string) => unknown;
  /** Applies a merged server snapshot to that profile's storage. */
  apply: (profileId: string, data: unknown) => void;
}

const adapters = new Map<string, LocalProgressAdapter>();
const progressListeners = new Set<(gameId: string) => void>();
const profileListeners = new Set<() => void>();
let suppressionDepth = 0;

export function registerProgressAdapter(gameId: string, adapter: LocalProgressAdapter): void {
  adapters.set(gameId, adapter);
}

export function getProgressAdapter(gameId: string): LocalProgressAdapter | undefined {
  return adapters.get(gameId);
}

/**
 * Tells the sync feature that a local game store changed. Nothing is sent when
 * no sync session is active; the local store remains the source of truth.
 */
export function notifyProgressChanged(gameId: string): void {
  if (suppressionDepth > 0) {
    return;
  }
  for (const listener of [...progressListeners]) {
    listener(gameId);
  }
}

export function subscribeProgressChanges(listener: (gameId: string) => void): () => void {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
}

/**
 * Applies a remote snapshot without echoing it back into the outbox. Adapter
 * apply functions wrap their store and storage writes in this helper.
 */
export function withSuppressedProgressEvents<T>(task: () => T): T {
  suppressionDepth += 1;
  try {
    return task();
  } finally {
    suppressionDepth -= 1;
  }
}

/** Signals that the local profile list or avatars changed. */
export function notifyProfilesChanged(): void {
  for (const listener of [...profileListeners]) {
    listener();
  }
}

export function subscribeProfilesChanged(listener: () => void): () => void {
  profileListeners.add(listener);
  return () => profileListeners.delete(listener);
}
