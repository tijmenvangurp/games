/**
 * Leest en schrijft JSON in localStorage zonder de app te laten crashen als
 * opslag ontbreekt of vol zit. Spellen blijven dan gewoon in het geheugen
 * werken.
 */
export function readStoredJson(key: string): unknown {
  try {
    if (typeof localStorage === "undefined") {
      return null;
    }

    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function writeStoredJson(key: string, value: unknown): void {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable; the in-memory game still works.
  }
}
