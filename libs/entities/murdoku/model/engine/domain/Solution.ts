import type { Cell, PersonId } from './types.ts'

/** A complete placement of every person on the board. */
export class Solution {
  constructor(private readonly placement: ReadonlyMap<PersonId, Cell>) {}

  cellOf(id: PersonId): Cell {
    const cell = this.placement.get(id)
    if (cell === undefined) {
      throw new Error(`Solution has no placement for person "${id}"`)
    }
    return cell
  }

  has(id: PersonId): boolean {
    return this.placement.has(id)
  }

  entries(): IterableIterator<[PersonId, Cell]> {
    return this.placement.entries()
  }
}
