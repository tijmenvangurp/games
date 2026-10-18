import type { Geometry } from "./types";

export type UnitKind = "row" | "column" | "box";

export interface Unit {
  kind: UnitKind;
  indexes: number[];
}

/** All rows, columns and boxes of a board, each as a list of cell indexes. */
export function unitsFor(geometry: Geometry): Unit[] {
  const { size, boxRows, boxCols } = geometry;
  const units: Unit[] = [];

  for (let row = 0; row < size; row += 1) {
    units.push({
      kind: "row",
      indexes: Array.from({ length: size }, (_, col) => row * size + col),
    });
  }
  for (let col = 0; col < size; col += 1) {
    units.push({
      kind: "column",
      indexes: Array.from({ length: size }, (_, row) => row * size + col),
    });
  }

  const boxesPerBand = size / boxCols;
  const boxCount = (size / boxRows) * boxesPerBand;
  for (let box = 0; box < boxCount; box += 1) {
    const band = Math.floor(box / boxesPerBand);
    const stack = box % boxesPerBand;
    const indexes: number[] = [];
    for (let row = 0; row < boxRows; row += 1) {
      for (let col = 0; col < boxCols; col += 1) {
        indexes.push((band * boxRows + row) * size + stack * boxCols + col);
      }
    }
    units.push({ kind: "box", indexes });
  }

  return units;
}
