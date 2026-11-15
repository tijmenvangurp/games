import type { SolveContext } from '../SolveContext.ts'
import type { DeductionStep } from '../DeductionStep.ts'
import type { Puzzle } from '../../domain/Puzzle.ts'

/**
 * A single human-style deduction rule. `apply` either makes one unit of
 * progress (a placement or some eliminations) and returns the explainable
 * step, or returns null if the rule does not fire. `difficulty` ranks how
 * advanced the rule is (used later for difficulty rating and hints).
 */
export abstract class Technique {
  abstract readonly name: string
  abstract readonly difficulty: number
  abstract apply(ctx: SolveContext): DeductionStep | null

  /** Whether this technique can ever fire for the puzzle (skip pure overhead). */
  relevant(_puzzle: Puzzle): boolean {
    return true
  }
}
