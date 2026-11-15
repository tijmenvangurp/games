import { Technique } from './Technique.ts'
import type { SolveContext } from '../SolveContext.ts'
import type { DeductionStep, Elimination } from '../DeductionStep.ts'

/**
 * Crossing-lines ("rectangle") elimination: if a person's few possible cells all
 * share a row or column with some other cell D, then wherever that person ends up
 * they block D — so nobody else can use it, and D can be crossed out. Classic
 * case: a person who must be on one of two chairs at opposite corners (1,1)/(3,3)
 * blocks (1,3) and (3,1) either way. Only the rows×cols of the small domain need
 * checking, so this is cheap and fires before the forcing fallbacks.
 */
export class RectangleTechnique extends Technique {
  readonly name = 'rectangle'
  readonly difficulty = 3

  apply(ctx: SolveContext): DeductionStep | null {
    for (const id of ctx.state.unplaced()) {
      const domain = [...ctx.state.domain(id)]
      if (domain.length < 2 || domain.length > 4) continue
      const rows = new Set(domain.map((c) => ctx.board.rc(c).row))
      const cols = new Set(domain.map((c) => ctx.board.rc(c).col))
      for (const r of rows) {
        for (const c of cols) {
          const d = ctx.board.idx(r, c)
          if (domain.includes(d)) continue
          // D is always blocked iff every candidate shares D's row or column.
          const alwaysBlocks = domain.every((cand) => {
            const p = ctx.board.rc(cand)
            return p.row === r || p.col === c
          })
          if (!alwaysBlocks) continue
          const eliminated: Elimination[] = []
          for (const other of ctx.state.unplaced()) {
            if (other === id) continue
            const removed = ctx.removeWhere(other, (x) => x === d)
            if (removed.length > 0) eliminated.push({ personId: other, cells: removed })
          }
          if (eliminated.length > 0) {
            return {
              technique: 'rectangle',
              personId: id,
              eliminated,
              explanation: { key: 'step.rectangle', params: { name: id, cell: d } },
            }
          }
        }
      }
    }
    return null
  }
}
