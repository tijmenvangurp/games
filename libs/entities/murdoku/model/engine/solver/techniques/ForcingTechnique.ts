import { Technique } from './Technique.ts'
import type { SearchSolver } from '../SearchSolver.ts'
import type { Cell, Explanation, PersonId } from '../../domain/types.ts'
import type { SolveContext } from '../SolveContext.ts'
import type { DeductionStep } from '../DeductionStep.ts'

/**
 * Proof by contradiction WITH a readable trace, focused on the person who has the
 * fewest options left. For each of that person's candidate cells we assume they
 * sit there and propagate the transparent rules (`base`) on a copy, recording
 * every consequence. The recorded steps form an explanation chain ("if X here →
 * … → impossible") that closes either:
 *   - transparently — someone runs out of cells, the victim can't be alone, the
 *     grid stops fitting ('forcing'); or
 *   - by the exhaustive search confirming no completion exists, after showing the
 *     visible consequences ('satForcing' — the honest fallback for deep cases).
 * Either way the candidate is eliminated, so no hint is ever a bare "contradiction".
 */
export class ForcingTechnique extends Technique {
  readonly name = 'forcing'
  readonly difficulty = 7

  constructor(
    private readonly base: Technique[],
    private readonly searcher: SearchSolver,
  ) {
    super()
  }

  /** How many of the most-constrained people to scan for a readable contradiction.
   *  Bounded so the work stays small on big boards instead of scanning everyone. */
  private static readonly SCAN = 3

  apply(ctx: SolveContext): DeductionStep | null {
    const ranked = [...ctx.state.unplaced()]
      .filter((id) => ctx.state.domain(id).size >= 2)
      .sort((a, b) => ctx.state.domain(a).size - ctx.state.domain(b).size)
    if (ranked.length === 0) return null

    // Pass 1: a readable contradiction among the FEW most-constrained people.
    for (const id of ranked.slice(0, ForcingTechnique.SCAN)) {
      for (const cell of [...ctx.state.domain(id)]) {
        const trial = ctx.clone()
        trial.place(id, cell)
        const { steps, dead } = this.runToContradiction(trial)
        if (dead) return this.eliminate(ctx, id, cell, steps, dead, 'forcing')
      }
    }

    // Pass 2: exhaustive disproof of a cell of the MOST-constrained person only
    // (the search is the fast oracle); show the visible consequences then "checked".
    const id = ranked[0]
    for (const cell of [...ctx.state.domain(id)]) {
      const forced = new Map<PersonId, Cell>(ctx.state.placed)
      forced.set(id, cell)
      if (this.searcher.hasSolutionWith(forced)) continue
      const trial = ctx.clone()
      trial.place(id, cell)
      const { steps } = this.runToContradiction(trial)
      return this.eliminate(ctx, id, cell, steps, { key: 'contra.exhausted' }, 'satForcing')
    }
    return null
  }

  /** Build the elimination step for an impossible `cell`, with its consequence chain. */
  private eliminate(
    ctx: SolveContext,
    id: PersonId,
    cell: Cell,
    steps: DeductionStep[],
    ending: Explanation,
    technique: 'forcing' | 'satForcing',
  ): DeductionStep {
    const removed = ctx.removeWhere(id, (c) => c === cell)
    return {
      technique,
      personId: id,
      eliminated: [{ personId: id, cells: removed }],
      explanation: { key: 'step.forcing', params: { name: id, cell } },
      chain: [
        { key: 'step.assume', params: { name: id, cell } },
        ...steps.map((s) => s.explanation),
        ending,
      ],
    }
  }

  /** Propagate the base rules until a contradiction surfaces or nothing changes. */
  private runToContradiction(trial: SolveContext): {
    steps: DeductionStep[]
    dead: Explanation | null
  } {
    const steps: DeductionStep[] = []
    for (;;) {
      const dead = trial.deadReason()
      if (dead) return { steps, dead }
      let progressed = false
      for (const technique of this.base) {
        const step = technique.apply(trial)
        if (step) {
          steps.push(step)
          progressed = true
          break
        }
      }
      if (!progressed) return { steps, dead: null }
    }
  }
}
