import { Technique } from './Technique.ts'
import type { SolveContext } from '../SolveContext.ts'
import type { DeductionStep } from '../DeductionStep.ts'

/** A person with a single remaining candidate cell must stand there. */
export class NakedSingleTechnique extends Technique {
  readonly name = 'nakedSingle'
  readonly difficulty = 1

  apply(ctx: SolveContext): DeductionStep | null {
    for (const id of ctx.state.unplaced()) {
      const domain = ctx.state.domain(id)
      if (domain.size !== 1) continue
      const cell = [...domain][0]
      const eliminated = ctx.place(id, cell)
      const victim = ctx.isVictim(id)
      return {
        technique: victim ? 'victim' : 'nakedSingle',
        personId: id,
        placedCell: cell,
        eliminated,
        explanation: {
          key: victim ? 'step.victim' : 'step.nakedSingle',
          params: { name: id, cell },
        },
      }
    }
    return null
  }
}
