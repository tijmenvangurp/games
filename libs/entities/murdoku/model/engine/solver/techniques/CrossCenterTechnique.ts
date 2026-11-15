import { Technique } from './Technique.ts'
import type { SolveContext } from '../SolveContext.ts'
import type { DeductionStep, Elimination } from '../DeductionStep.ts'

/**
 * "Plus / cross" elimination. If every cell a person can still occupy lies in ONE
 * row R or ONE column C (their candidates form a "+" through (R,C)), that person
 * must end up in row R or in column C. Either way the intersection cell (R,C) is
 * consumed by their line — so NO ONE ELSE can stand there. And if (R,C) itself
 * isn't one of the person's cells, the person can't be there either ⇒ (R,C) is
 * provably empty and is crossed for everyone.
 *
 * Example: the only person allowed on chairs, with the chairs arranged in a row +
 * a column, can't put anyone on the empty tile where that row and column meet.
 *
 * Pure forward logic — no trial, no contradiction. Sound: a foreign occupant of
 * (R,C) would share row R or column C with the confined person (both lines have
 * exactly one occupant in a full permutation), which is impossible.
 */
export class CrossCenterTechnique extends Technique {
  readonly name = 'crossCenter'
  readonly difficulty = 3

  apply(ctx: SolveContext): DeductionStep | null {
    if (!ctx.fullPermutation) return null
    for (const id of ctx.state.unplaced()) {
      const cells = [...ctx.state.domain(id)]
      if (cells.length < 2) continue // a single cell is a naked single
      const rows = new Set(cells.map((c) => ctx.axisOf(c, 'row')))
      if (rows.size < 2) continue // confined to one row → hidden single's job
      for (const row of rows) {
        // Columns of the cells OUTSIDE this row — they must all share one column for
        // the candidates to fit on the cross through (row, col).
        const outCols = new Set<number>()
        for (const c of cells) if (ctx.axisOf(c, 'row') !== row) outCols.add(ctx.axisOf(c, 'col'))
        if (outCols.size !== 1) continue
        const col = [...outCols][0]
        const center = ctx.board.idx(row, col)
        if (!ctx.board.isOccupiable(center)) continue
        if (ctx.state.domain(id).has(center)) continue // the person COULD be there → not empty

        const eliminated: Elimination[] = []
        for (const other of ctx.state.unplaced()) {
          const removed = ctx.removeWhere(other, (c) => c === center)
          if (removed.length > 0) eliminated.push({ personId: other, cells: removed })
        }
        if (eliminated.length > 0) {
          return {
            technique: 'crossCenter',
            eliminated,
            explanation: {
              key: 'step.crossCenter',
              params: { name: id, cell: center, row: row + 1, col: col + 1 },
            },
          }
        }
      }
    }
    return null
  }
}
