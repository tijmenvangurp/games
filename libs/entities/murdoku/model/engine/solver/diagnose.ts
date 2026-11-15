import { VICTIM_ID } from '../domain/types.ts'
import { Solution } from '../domain/Solution.ts'
import type { Cell, Explanation, PersonId } from '../domain/types.ts'
import type { Puzzle } from '../domain/Puzzle.ts'

/** One constraint a placement fails to satisfy, for explaining a wrong solution. */
export interface ClueFailure {
  /** The suspect whose own clue failed; null for board-wide rules. */
  personId: PersonId | null
  explanation: Explanation
}

/**
 * Every constraint a complete placement violates: each suspect's own clues, the
 * "victim was alone with exactly one suspect" rule, and the board-wide (global)
 * clues. Empty when the placement is a valid solution. Lets the UI tell the
 * player WHICH clue doesn't fit instead of only "something is wrong".
 */
export function unsatisfiedClues(
  puzzle: Puzzle,
  placement: ReadonlyMap<PersonId, Cell>,
): ClueFailure[] {
  const solution = new Solution(placement)
  const failures: ClueFailure[] = []

  for (const suspect of puzzle.suspects) {
    for (const clue of suspect.clues) {
      if (!clue.test(suspect.id, solution, puzzle)) {
        failures.push({ personId: suspect.id, explanation: clue.describe() })
      }
    }
  }

  // Core scenario rule: the victim shared a room with exactly one suspect.
  const board = puzzle.board
  if (solution.has(VICTIM_ID)) {
    const victimRoom = board.roomIdOf(solution.cellOf(VICTIM_ID))
    const withVictim = puzzle.suspects.filter(
      (s) => solution.has(s.id) && board.roomIdOf(solution.cellOf(s.id)) === victimRoom,
    ).length
    if (withVictim !== 1) {
      failures.push({ personId: null, explanation: { key: 'rule.aloneWithVictim' } })
    }
  }

  for (const clue of puzzle.boardClues) {
    if (!clue.test(solution, puzzle)) {
      failures.push({ personId: null, explanation: clue.describe() })
    }
  }

  return failures
}
