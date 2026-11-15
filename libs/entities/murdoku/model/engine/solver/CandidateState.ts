import type { Cell, PersonId } from '../domain/types.ts'

/** Mutable solving state: per-person candidate cells plus confirmed placements. */
export class CandidateState {
  private readonly domains = new Map<PersonId, Set<Cell>>()
  readonly placed = new Map<PersonId, Cell>()

  setDomain(id: PersonId, cells: Iterable<Cell>): void {
    this.domains.set(id, new Set(cells))
  }

  domain(id: PersonId): Set<Cell> {
    const d = this.domains.get(id)
    if (!d) throw new Error(`No domain for person "${id}"`)
    return d
  }

  unplaced(): PersonId[] {
    return [...this.domains.keys()].filter((id) => !this.placed.has(id))
  }

  place(id: PersonId, cell: Cell): void {
    this.placed.set(id, cell)
    this.domains.delete(id)
  }

  /** Deep copy (independent domains and placements) for hypothetical reasoning. */
  clone(): CandidateState {
    const copy = new CandidateState()
    for (const [id, cells] of this.domains) copy.domains.set(id, new Set(cells))
    for (const [id, cell] of this.placed) copy.placed.set(id, cell)
    return copy
  }
}
