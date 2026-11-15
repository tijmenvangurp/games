import { BASE_ELEMENT_IDS, isElementId, type ElementId } from "@entities/alchemy";

const STORAGE_KEY = "games.mengelmoes.v1";

export const MAX_BOARD_ELEMENTS = 12;

interface StoredBoardElement {
  elementId: ElementId;
  x: number;
  y: number;
}

interface StoredAlchemyState {
  discovered: ElementId[];
  board: StoredBoardElement[];
}

function fallbackState(): StoredAlchemyState {
  return { discovered: [...BASE_ELEMENT_IDS], board: [] };
}

export const FALLBACK_ALCHEMY_STATE: StoredAlchemyState = fallbackState();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isStoredBoardElement(value: unknown): value is StoredBoardElement {
  return (
    isRecord(value) &&
    typeof value.elementId === "string" &&
    isElementId(value.elementId) &&
    isCoordinate(value.x) &&
    isCoordinate(value.y)
  );
}

function uniqueElementIds(value: unknown): ElementId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<ElementId>();
  for (const item of value) {
    if (typeof item === "string" && isElementId(item)) {
      seen.add(item);
    }
  }
  return [...seen];
}

/** Keeps the four base elements available even after a partial or old save. */
export function normalizeDiscovered(value: unknown): ElementId[] {
  const ids = new Set(uniqueElementIds(value));
  for (const base of BASE_ELEMENT_IDS) {
    ids.add(base);
  }
  return [...ids];
}

export function loadAlchemyState(): StoredAlchemyState {
  try {
    if (typeof localStorage === "undefined") {
      return fallbackState();
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallbackState();
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return fallbackState();
    }

    const discovered = normalizeDiscovered(parsed.discovered);
    const discoveredSet = new Set(discovered);
    const board = Array.isArray(parsed.board)
      ? parsed.board
          .filter(isStoredBoardElement)
          .filter((item) => discoveredSet.has(item.elementId))
          .slice(0, MAX_BOARD_ELEMENTS)
      : [];

    return { discovered, board };
  } catch {
    return fallbackState();
  }
}

export function saveAlchemyState(state: StoredAlchemyState): void {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        discovered: state.discovered,
        board: state.board.slice(0, MAX_BOARD_ELEMENTS),
      }),
    );
  } catch {
    // Storage may be unavailable; the in-memory game still works.
  }
}
