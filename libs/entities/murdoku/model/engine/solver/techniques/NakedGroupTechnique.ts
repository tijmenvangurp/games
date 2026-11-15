import { Technique } from './Technique.ts'
import { combinations } from './combinations.ts'
import type { Axis, SolveContext } from '../SolveContext.ts'
import type { DeductionStep, Elimination } from '../DeductionStep.ts'
import type { PersonId } from '../../domain/types.ts'

/**
 * If k people can only occupy k lines (rows or columns), those people fill
 * those lines exactly — so no one else may use them. Generalises the rulebook's
 * "overlapping fields" tip (k=1 confines one person; k=2 is a naked pair, …).
 * Sound regardless of full permutation.
 */
export class NakedGroupTechnique extends Technique {
  readonly name: string
  readonly difficulty = 3

  constructor(private readonly axis: Axis) {
    super()
    this.name = `nakedGroup-${axis}`
  }

  apply(ctx: SolveContext): DeductionStep | null {
    const unplaced = ctx.state.unplaced()
    const n = unplaced.length
    if (n < 2) return null

    const linesByPerson = new Map<PersonId, Set<number>>(
      unplaced.map((id) => [id, ctx.linesOf(id, this.axis)]),
    )

    // Cap group size: naked quads are the practical ceiling, and the subset count
    // explodes (2^n) on big boards, so never enumerate beyond k = 4.
    const maxK = Math.min(4, n - 1)
    for (let k = 1; k <= maxK; k++) {
      for (const subset of combinations(unplaced, k)) {
        const union = new Set<number>()
        for (const id of subset) {
          for (const line of linesByPerson.get(id)!) union.add(line)
        }
        if (union.size !== k) continue

        const others = unplaced.filter((id) => !subset.includes(id))
        const eliminated: Elimination[] = []
        for (const id of others) {
          const removed = ctx.removeWhere(id, (c) => union.has(ctx.axisOf(c, this.axis)))
          if (removed.length > 0) eliminated.push({ personId: id, cells: removed })
        }
        if (eliminated.length === 0) continue

        return {
          technique: this.axis === 'row' ? 'nakedGroupRows' : 'nakedGroupCols',
          eliminated,
          explanation: {
            key: this.axis === 'row' ? 'step.nakedGroupRows' : 'step.nakedGroupCols',
            params: {
              people: subset.join(','),
              lines: [...union]
                .sort((a, b) => a - b)
                .map((line) => line + 1)
                .join(', '),
            },
          },
        }
      }
    }
    return null
  }
}
