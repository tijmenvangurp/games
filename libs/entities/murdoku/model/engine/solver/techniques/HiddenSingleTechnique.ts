import { Technique } from './Technique.ts'
import type { Axis, SolveContext } from '../SolveContext.ts'
import type { DeductionStep } from '../DeductionStep.ts'

/**
 * In a full permutation every row/column holds exactly one person. If only one
 * person can occupy a still-empty line, that person is confined to it.
 */
export class HiddenSingleTechnique extends Technique {
  readonly name: string
  readonly difficulty = 2

  constructor(private readonly axis: Axis) {
    super()
    this.name = `hiddenSingle-${axis}`
  }

  apply(ctx: SolveContext): DeductionStep | null {
    if (!ctx.fullPermutation) return null
    const size = this.axis === 'row' ? ctx.board.height : ctx.board.width
    const used = ctx.usedLines(this.axis)
    const unplaced = ctx.state.unplaced()

    for (let line = 0; line < size; line++) {
      if (used.has(line)) continue
      const candidates = unplaced.filter((id) =>
        [...ctx.state.domain(id)].some((c) => ctx.axisOf(c, this.axis) === line),
      )
      if (candidates.length !== 1) continue
      const id = candidates[0]
      // The cells still open in this line — all belong to `id`, since no one else has a
      // candidate here. Naming them is the WHY: "every other cell in the line is ruled
      // out, only these remain, so the line's occupant is this person."
      const open = [...ctx.state.domain(id)]
        .filter((c) => ctx.axisOf(c, this.axis) === line)
        .sort((a, b) => a - b)
      const removed = ctx.removeWhere(id, (c) => ctx.axisOf(c, this.axis) !== line)
      if (removed.length === 0) continue
      // The subject may be the VICTIM (it occupies a row/column too) — then the wording is
      // "only the victim, no suspect", not "…and not the victim".
      const base = this.axis === 'row' ? 'hiddenSingleRow' : 'hiddenSingleCol'
      return {
        technique: base,
        personId: id,
        eliminated: [{ personId: id, cells: removed }],
        explanation: {
          key: `step.${base}${ctx.isVictim(id) ? 'Victim' : ''}`,
          params: { name: id, line: line + 1, cells: open.join(',') },
        },
      }
    }
    return null
  }
}
