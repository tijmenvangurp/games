import type { GearSize, Hole, Placement, TrayItem } from "../types";

/** Stable hole id for a grid position. */
export function holeId(col: number, row: number): string {
  return `${col},${row}`;
}

/** Every hole on a cols x rows board, row by row. */
export function createHoles(cols: number, rows: number): Hole[] {
  const holes: Hole[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      holes.push({ id: holeId(col, row), col, row });
    }
  }
  return holes;
}

export function trayGear(id: string, size: GearSize): TrayItem {
  return { id, kind: "gear", size };
}

/** Level-data helper for the worm drive in chapters 3-4. */
export function trayWorm(id: string, ratio = 0.5, direction: 1 | -1 = -1): TrayItem {
  return { id, kind: "worm", ratio, direction };
}

export function trayBelt(id: string, crossed = false): TrayItem {
  return crossed ? { id, kind: "belt", crossed: true } : { id, kind: "belt" };
}

export function trayChain(id: string): TrayItem {
  return { id, kind: "chain" };
}

export function gearAt(col: number, row: number, size: GearSize): Placement {
  return { kind: "gear", holeId: holeId(col, row), size };
}

/** Level-data helper for the worm drive in chapters 3-4. */
export function wormAt(
  from: readonly [number, number],
  to: readonly [number, number],
  ratio = 0.5,
  direction: 1 | -1 = -1,
): Placement {
  return {
    kind: "worm",
    fromHoleId: holeId(from[0], from[1]),
    toHoleId: holeId(to[0], to[1]),
    ratio,
    direction,
  };
}

export function beltAt(
  kind: "open-belt" | "crossed-belt" | "chain",
  from: readonly [number, number],
  to: readonly [number, number],
): Placement {
  return {
    kind,
    fromHoleId: holeId(from[0], from[1]),
    toHoleId: holeId(to[0], to[1]),
  };
}
