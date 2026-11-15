import { Clue } from './Clue.ts'
import type { Board } from '../domain/Board.ts'
import type { Solution } from '../domain/Solution.ts'
import type { Puzzle } from '../domain/Puzzle.ts'
import type { Cell, Explanation, PersonId } from '../domain/types.ts'

/** Negation: "not (…)". */
export class NotClue extends Clue {
  constructor(readonly inner: Clue) {
    super()
  }

  test(subjectId: PersonId, solution: Solution, puzzle: Puzzle): boolean {
    return !this.inner.test(subjectId, solution, puzzle)
  }

  override candidateCells(board: Board): Set<Cell> | null {
    // Exclude only cells where the inner clue is DEFINITELY true (independent of
    // others). For uniqueness / occupancy / relational clues that's null → the
    // negation prunes nothing here and is enforced by `test`.
    const definite = this.inner.definiteCells(board)
    if (definite === null) return null
    const out = new Set<Cell>()
    for (const cell of board.occupiableCells()) {
      if (!definite.has(cell)) out.add(cell)
    }
    return out
  }

  override definiteCells(board: Board): Set<Cell> | null {
    // "not X" is GUARANTEED exactly where X is impossible — outside X's candidate
    // cells. Keeps a double negation (not(not(X))) fully deducible.
    const candidates = this.inner.candidateCells(board)
    if (candidates === null) return null
    const out = new Set<Cell>()
    for (const cell of board.occupiableCells()) {
      if (!candidates.has(cell)) out.add(cell)
    }
    return out
  }

  describe(): Explanation {
    return { key: 'clue.not', children: [this.inner.describe()] }
  }
}

/** Conjunction: all children must hold. */
export class AndClue extends Clue {
  constructor(readonly clues: readonly Clue[]) {
    super()
  }

  test(subjectId: PersonId, solution: Solution, puzzle: Puzzle): boolean {
    return this.clues.every((c) => c.test(subjectId, solution, puzzle))
  }

  override candidateCells(board: Board): Set<Cell> | null {
    // Every child is necessary, so intersect the computable ones. Children
    // without a fixed set (e.g. `alone`) simply add no pruning here.
    const sets = this.clues
      .map((c) => c.candidateCells(board))
      .filter((s): s is Set<Cell> => s !== null)
    if (sets.length === 0) return null
    const acc = new Set(sets[0])
    for (const set of sets.slice(1)) {
      for (const cell of [...acc]) {
        if (!set.has(cell)) acc.delete(cell)
      }
    }
    return acc
  }

  override violatedBy(
    subjectId: PersonId,
    placement: ReadonlyMap<PersonId, Cell>,
    puzzle: Puzzle,
  ): boolean {
    return this.clues.some((c) => c.violatedBy(subjectId, placement, puzzle))
  }

  describe(): Explanation {
    return { key: 'clue.and', children: this.clues.map((c) => c.describe()) }
  }
}

/** Disjunction: at least one child must hold. */
export class OrClue extends Clue {
  constructor(readonly clues: readonly Clue[]) {
    super()
  }

  test(subjectId: PersonId, solution: Solution, puzzle: Puzzle): boolean {
    return this.clues.some((c) => c.test(subjectId, solution, puzzle))
  }

  override candidateCells(board: Board): Set<Cell> | null {
    const sets = this.clues.map((c) => c.candidateCells(board))
    if (sets.some((s) => s === null)) return null
    const out = new Set<Cell>()
    for (const set of sets as Set<Cell>[]) {
      for (const cell of set) out.add(cell)
    }
    return out
  }

  describe(): Explanation {
    return { key: 'clue.or', children: this.clues.map((c) => c.describe()) }
  }
}
