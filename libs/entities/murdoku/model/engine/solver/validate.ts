import { SearchSolver } from './SearchSolver.ts'
import { DeductionEngine } from './DeductionEngine.ts'
import type { Puzzle } from '../domain/Puzzle.ts'
import type { Solution } from '../domain/Solution.ts'
import type { DeductionResult } from './DeductionStep.ts'

/** The verdict of {@link checkLevel}. */
export interface LevelCheck {
  /** Number of solutions, capped at 2 (so `2` means "≥ 2 — ambiguous"). */
  solutions: number
  /** Exactly one solution. */
  unique: boolean
  /** Crackable by clean logic (no proof-by-contradiction). With `forwardOnly` the bar is
   *  straight FORWARD deduction (the generator's stricter standard); otherwise the human
   *  pipeline (forward + convergent + tight short contradiction) the editor and hints use. */
  solvable: boolean
  /** One valid solution (e.g. to name the murderer), or null if none exists. */
  solution: Solution | null
  /** The full deduction result (for `maxRank` / technique counts — e.g. the easy "rank ≤ 2"
   *  bar). `solvable` is just `deduction.solved`. */
  deduction: DeductionResult
  /** True when the (budgeted) search ran out of nodes — `solutions` is then only a lower
   *  bound and NO verdict may be drawn. Only set when a `budget` was passed. */
  aborted: boolean
}

/**
 * THE single source of truth for "is this level fit to play / save / ship". The editor's
 * Check button, the editor's Save gate, and the generator's shipping gate ALL call this, so
 * they can never disagree about whether a level is unique and solvable (DRY / KISS — one
 * check, used everywhere). `forwardOnly` only tightens the solvability bar; the uniqueness
 * count is identical for every caller.
 */
export function checkLevel(
  puzzle: Puzzle,
  opts: { forwardOnly?: boolean; budget?: number } = {},
): LevelCheck {
  const solver = new SearchSolver(puzzle)
  const budget = opts.budget ?? Infinity
  const solutions = solver.countSolutions(2, budget)
  let aborted = solver.aborted
  const solution = solutions > 0 ? solver.firstSolution(budget) : null
  aborted ||= solver.aborted
  const deduction = new DeductionEngine(puzzle, opts.forwardOnly ? { noCaseSplit: true } : {}).solve()
  return {
    solutions,
    unique: solutions === 1 && !aborted,
    solvable: deduction.solved,
    solution,
    deduction,
    aborted,
  }
}
