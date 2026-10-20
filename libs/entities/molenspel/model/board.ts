/**
 * Het Molenspel (Nine Men's Morris).
 *
 * Het bord bestaat uit 24 punten: drie concentrische vierkanten van elk 8 punten
 * (hoekpunten en zijmiddens) plus vier verbindingen tussen de ringen.
 * De punten staan op een 7x7-raster; de coördinaten hieronder zijn rastercoördinaten.
 */

export interface MolenspelPoint {
  /** Index in het bord, 0 tot en met 23. */
  id: number;
  /** Rasterkolom, 0 tot en met 6. */
  col: number;
  /** Rasterrij, 0 tot en met 6. */
  row: number;
}

export const MOLENSPEL_POINTS: readonly MolenspelPoint[] = [
  { id: 0, col: 0, row: 0 },
  { id: 1, col: 3, row: 0 },
  { id: 2, col: 6, row: 0 },
  { id: 3, col: 1, row: 1 },
  { id: 4, col: 3, row: 1 },
  { id: 5, col: 5, row: 1 },
  { id: 6, col: 2, row: 2 },
  { id: 7, col: 3, row: 2 },
  { id: 8, col: 4, row: 2 },
  { id: 9, col: 0, row: 3 },
  { id: 10, col: 1, row: 3 },
  { id: 11, col: 2, row: 3 },
  { id: 12, col: 4, row: 3 },
  { id: 13, col: 5, row: 3 },
  { id: 14, col: 6, row: 3 },
  { id: 15, col: 2, row: 4 },
  { id: 16, col: 3, row: 4 },
  { id: 17, col: 4, row: 4 },
  { id: 18, col: 1, row: 5 },
  { id: 19, col: 3, row: 5 },
  { id: 20, col: 5, row: 5 },
  { id: 21, col: 0, row: 6 },
  { id: 22, col: 3, row: 6 },
  { id: 23, col: 6, row: 6 },
];

export interface MolenspelLine {
  /** Punt-ids langs de lijn. */
  points: readonly number[];
  /** Gesloten lijnen vormen een ring; open lijnen verbinden twee ringen. */
  closed: boolean;
}

/**
 * De lijnen op het bord: drie vierkanten en vier verbindingen tussen de ringen.
 * Opeenvolgende punten in een lijn zijn verbonden, dus de edges van het bord
 * volgen direct uit deze lijst.
 */
export const MOLENSPEL_LINES: readonly MolenspelLine[] = [
  // Buitenste vierkant.
  { points: [0, 1, 2, 14, 23, 22, 21, 9], closed: true },
  // Middelste vierkant.
  { points: [3, 4, 5, 13, 20, 19, 18, 10], closed: true },
  // Binnenste vierkant.
  { points: [6, 7, 8, 12, 17, 16, 15, 11], closed: true },
  // De vier verbindingen tussen de ringen.
  { points: [1, 4, 7], closed: false },
  { points: [14, 13, 12], closed: false },
  { points: [22, 19, 16], closed: false },
  { points: [9, 10, 11], closed: false },
];

/** Alle verbindingen tussen twee punten, als paren van punt-id's. */
export const MOLENSPEL_EDGES: readonly (readonly [number, number])[] = (() => {
  const edges: [number, number][] = [];
  const seen = new Set<string>();
  for (const line of MOLENSPEL_LINES) {
    const count = line.closed ? line.points.length : line.points.length - 1;
    for (let index = 0; index < count; index += 1) {
      const from = line.points[index] as number;
      const to = line.points[(index + 1) % line.points.length] as number;
      const key = from < to ? `${from}-${to}` : `${to}-${from}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      edges.push([from, to]);
    }
  }
  return edges;
})();

/** De directe buren van elk punt. */
export const MOLENSPEL_ADJACENCY: readonly (readonly number[])[] = (() => {
  const adjacency: number[][] = MOLENSPEL_POINTS.map(() => []);
  for (const [from, to] of MOLENSPEL_EDGES) {
    (adjacency[from] as number[]).push(to);
    (adjacency[to] as number[]).push(from);
  }
  return adjacency;
})();

function isCollinear(first: number, middle: number, last: number): boolean {
  const a = MOLENSPEL_POINTS[first] as MolenspelPoint;
  const b = MOLENSPEL_POINTS[middle] as MolenspelPoint;
  const c = MOLENSPEL_POINTS[last] as MolenspelPoint;
  return (b.col - a.col) * (c.row - a.row) === (b.row - a.row) * (c.col - a.col);
}

/**
 * Alle molentjes: drietalen punten op één horizontale of verticale lijn.
 * Er zijn er zestien, net als bij het klassieke molenspel.
 */
export const MOLENSPEL_MILLS: readonly (readonly number[])[] = (() => {
  const mills: number[][] = [];
  const seen = new Set<string>();
  for (let middle = 0; middle < MOLENSPEL_POINTS.length; middle += 1) {
    const neighbours = MOLENSPEL_ADJACENCY[middle] as readonly number[];
    for (const first of neighbours) {
      for (const last of neighbours) {
        if (first === last || !isCollinear(first, middle, last)) {
          continue;
        }
        const key = [first, middle, last].sort((a, b) => a - b).join("-");
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        mills.push([first, middle, last]);
      }
    }
  }
  return mills;
})();
