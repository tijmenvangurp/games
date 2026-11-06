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
  1: { x: 9.752, y: 27.933 },
  2: { x: 8.697, y: 37.243 },
  3: { x: 9.224, y: 46.233 },
  4: { x: 9.224, y: 53.939 },
  5: { x: 9.311, y: 62.371 },
  6: { x: 11.667, y: 69.495 },
  7: { x: 16.042, y: 76.62 },
  8: { x: 20.641, y: 79.908 },
  9: { x: 25.801, y: 83.216 },
  10: { x: 33.542, y: 82.668 },
  11: { x: 41.282, y: 82.394 },
  12: { x: 48.462, y: 83.079 },
  13: { x: 55.641, y: 83.353 },
  14: { x: 64.054, y: 82.805 },
  15: { x: 70.337, y: 83.627 },
  16: { x: 76.394, y: 80.476 },
  17: { x: 81.891, y: 76.091 },
  18: { x: 85.369, y: 69.515 },
  19: { x: 87.949, y: 62.462 },
  20: { x: 89.183, y: 54.379 },
  21: { x: 88.622, y: 43.673 },
  22: { x: 88.51, y: 35.863 },
  23: { x: 87.388, y: 28.687 },
  24: { x: 84.247, y: 21.973 },
  25: { x: 79.087, y: 17.041 },
  26: { x: 73.141, y: 13.205 },
  27: { x: 66.635, y: 11.972 },
  28: { x: 60.128, y: 10.739 },
  29: { x: 51.939, y: 12.246 },
  30: { x: 43.862, y: 12.383 },
  31: { x: 37.692, y: 13.479 },
  32: { x: 31.635, y: 16.904 },
  33: { x: 26.699, y: 20.74 },
  34: { x: 22.772, y: 26.632 },
  35: { x: 20.978, y: 33.482 },
  36: { x: 21.538, y: 40.528 },
  37: { x: 21.538, y: 50.667 },
  38: { x: 20.641, y: 57.517 },
  39: { x: 21.651, y: 64.792 },
  40: { x: 26.474, y: 68.08 },
  41: { x: 31.859, y: 68.765 },
  42: { x: 39.263, y: 69.45 },
  43: { x: 46.891, y: 69.176 },
  44: { x: 54.295, y: 70.135 },
  45: { x: 61.923, y: 68.628 },
  46: { x: 67.981, y: 68.354 },
  47: { x: 73.029, y: 66.162 },
  48: { x: 76.394, y: 60.681 },
  49: { x: 76.394, y: 53.146 },
  50: { x: 76.731, y: 44.938 },
  51: { x: 77.628, y: 36.992 },
  52: { x: 74.263, y: 30.279 },
  53: { x: 69.888, y: 27.127 },
  54: { x: 63.942, y: 26.99 },
  55: { x: 56.09, y: 26.99 },
  56: { x: 47.901, y: 26.442 },
  57: { x: 40.385, y: 27.264 },
  58: { x: 35.224, y: 29.046 },
  59: { x: 31.186, y: 33.978 },
  60: { x: 31.522, y: 41.787 },
  61: { x: 30.962, y: 50.83 },
  62: { x: 33.654, y: 57.132 },
  63: { x: 45.208, y: 56.584 },
};

const OVERRIDE_KEY = "games.ganzenbord.board-points.v1";

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
    return toOverrides(JSON.parse(localStorage.getItem(OVERRIDE_KEY) ?? "null"));
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
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
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
