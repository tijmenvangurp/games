import type { GameObject } from './GameObject.ts'

/**
 * A single grid cell. Objects are layered: `ground` (e.g. carpet) and `top`
 * (e.g. chair/table) so a chair can be stacked on a carpet.
 *
 * Occupiability: the topmost present object decides; if none, the ground does;
 * an empty floor IS occupiable. Only a blocking object (table, plant, shrub,
 * box, …) makes a tile unoccupiable.
 */
export class Tile {
  constructor(
    readonly row: number,
    readonly col: number,
    readonly roomId: string,
    readonly ground: GameObject | null,
    readonly top: GameObject | null,
  ) {}

  get occupiable(): boolean {
    if (this.top) return this.top.occupiable
    if (this.ground) return this.ground.occupiable
    return true
  }

  hasObjectType(type: string): boolean {
    return this.top?.type === type || this.ground?.type === type
  }

  objects(): GameObject[] {
    return [this.ground, this.top].filter((o): o is GameObject => o !== null)
  }
}
