import type { Cell } from "./engine/domain/types";

/**
 * Of een volledige plaatsing de bordregel volgt: één persoon per rij en per
 * kolom. De engine bewaakt die regel in de solver, maar niet in de losse
 * aanwijzingen, dus controle en validatie toetsen hem zelf.
 */
export function onePersonEachLine(cells: Iterable<Cell>, width: number): boolean {
  const rows = new Set<number>();
  const cols = new Set<number>();
  for (const cell of cells) {
    const row = Math.floor(cell / width);
    const col = cell % width;
    if (rows.has(row) || cols.has(col)) return false;
    rows.add(row);
    cols.add(col);
  }
  return true;
}
