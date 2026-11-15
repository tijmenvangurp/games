/**
 * Middelpunten van de 63 vakjes op de hergebruikte kaart
 * `apps/games/public/ganzenbord/board.webp`, uitgedrukt in procenten van de
 * kaart. De punten zijn één keer met de hand gekalibreerd op de scan, van
 * vakje 1 linksonder met de klok mee naar buiten en daarna via de binnenring
 * naar vakje 63 onder de ganzenprent.
 */
export interface BoardPoint {
  readonly x: number;
  readonly y: number;
}

export const CELL_POINTS: Readonly<Record<number, BoardPoint>> = {
  1: { x: 9.917, y: 28.242 },
  2: { x: 8.844, y: 38.188 },
  3: { x: 9.38, y: 47.791 },
  4: { x: 9.38, y: 56.023 },
  5: { x: 9.469, y: 65.031 },
  6: { x: 11.865, y: 72.641 },
  7: { x: 16.314, y: 80.253 },
  8: { x: 20.991, y: 83.765 },
  9: { x: 26.238, y: 87.299 },
  10: { x: 34.111, y: 86.714 },
  11: { x: 41.982, y: 86.421 },
  12: { x: 49.283, y: 87.153 },
  13: { x: 56.584, y: 87.445 },
  14: { x: 65.14, y: 86.86 },
  15: { x: 71.529, y: 87.738 },
  16: { x: 77.689, y: 84.372 },
  17: { x: 83.279, y: 79.688 },
  18: { x: 86.816, y: 72.663 },
  19: { x: 89.44, y: 65.128 },
  20: { x: 90.695, y: 56.493 },
  21: { x: 90.124, y: 45.057 },
  22: { x: 90.01, y: 36.713 },
  23: { x: 88.869, y: 29.048 },
  24: { x: 85.675, y: 21.875 },
  25: { x: 80.427, y: 16.607 },
  26: { x: 74.381, y: 12.509 },
  27: { x: 67.764, y: 11.192 },
  28: { x: 61.147, y: 9.874 },
  29: { x: 52.819, y: 11.484 },
  30: { x: 44.605, y: 11.631 },
  31: { x: 38.331, y: 12.801 },
  32: { x: 32.171, y: 16.46 },
  33: { x: 27.152, y: 20.558 },
  34: { x: 23.158, y: 26.852 },
  35: { x: 21.334, y: 34.17 },
  36: { x: 21.903, y: 41.697 },
  37: { x: 21.903, y: 52.528 },
  38: { x: 20.991, y: 59.846 },
  39: { x: 22.018, y: 67.617 },
  40: { x: 26.923, y: 71.13 },
  41: { x: 32.399, y: 71.862 },
  42: { x: 39.928, y: 72.593 },
  43: { x: 47.686, y: 72.301 },
  44: { x: 55.215, y: 73.325 },
  45: { x: 62.973, y: 71.715 },
  46: { x: 69.133, y: 71.422 },
  47: { x: 74.267, y: 69.081 },
  48: { x: 77.689, y: 63.226 },
  49: { x: 77.689, y: 55.176 },
  50: { x: 78.032, y: 46.408 },
  51: { x: 78.944, y: 37.92 },
  52: { x: 75.522, y: 30.748 },
  53: { x: 71.073, y: 27.381 },
  54: { x: 65.026, y: 27.235 },
  55: { x: 57.041, y: 27.235 },
  56: { x: 48.713, y: 26.649 },
  57: { x: 41.069, y: 27.527 },
  58: { x: 35.821, y: 29.431 },
  59: { x: 31.715, y: 34.7 },
  60: { x: 32.056, y: 43.042 },
  61: { x: 31.487, y: 52.702 },
  62: { x: 34.224, y: 59.434 },
  63: { x: 45.974, y: 58.849 },
};

/** Vlak boven vakje 1, waar de pionnen voor de eerste worp klaarstaan. */
export const START_POINT: BoardPoint = { x: 9.917, y: 25.6 };

const OVERRIDE_KEY = "games.ganzenbord.board-points.v1";
/** Ophogen zodra de uitsnede van het bord verandert; oude percentages kloppen dan niet meer. */
const BOARD_REVISION = 2;

function isPercent(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function isPoint(value: unknown): value is BoardPoint {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const point = value as Partial<BoardPoint>;
  return isPercent(point.x) && isPercent(point.y);
}

function toOverrides(parsed: unknown): Record<number, BoardPoint> {
  if (typeof parsed !== "object" || parsed === null) {
    return {};
  }
  const overrides: Record<number, BoardPoint> = {};
  for (const [key, value] of Object.entries(parsed)) {
    const square = Number(key);
    if (Number.isInteger(square) && square >= 1 && square <= 63 && isPoint(value)) {
      overrides[square] = { x: value.x, y: value.y };
    }
  }
  return overrides;
}

function readOverrides(): Readonly<Record<number, BoardPoint>> {
  try {
    const stored = JSON.parse(localStorage.getItem(OVERRIDE_KEY) ?? "null") as {
      readonly revision?: number;
      readonly points?: unknown;
    } | null;
    if (stored?.revision !== BOARD_REVISION) {
      return {};
    }
    return toOverrides(stored.points);
  } catch {
    return {};
  }
}

/** De puntjes zoals ze op dit toestel zijn bijgesteld, bovenop de vaste waarden. */
export function loadCellPoints(): Readonly<Record<number, BoardPoint>> {
  return { ...CELL_POINTS, ...readOverrides() };
}

function changedFromBase(point: BoardPoint, base: BoardPoint | undefined): boolean {
  return base !== undefined && (base.x !== point.x || base.y !== point.y);
}

/** Bewaart alleen de afwijkingen, zodat een latere kaartupdate de rest meeneemt. */
export function saveCellPoints(points: Readonly<Record<number, BoardPoint>>): void {
  const overrides: Record<number, BoardPoint> = {};
  for (const [key, point] of Object.entries(points)) {
    const square = Number(key);
    if (isPoint(point) && changedFromBase(point, CELL_POINTS[square])) {
      overrides[square] = { x: point.x, y: point.y };
    }
  }
  try {
    localStorage.setItem(
      OVERRIDE_KEY,
      JSON.stringify({ revision: BOARD_REVISION, points: overrides }),
    );
  } catch {
    // Zonder opslag werkt de rest van het spel gewoon met de vaste waarden.
  }
}

export function clearCellPoints(): void {
  try {
    localStorage.removeItem(OVERRIDE_KEY);
  } catch {
    // Niets op te ruimen.
  }
}
