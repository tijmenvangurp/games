import type { Cell } from '../domain/types.ts'
import type { Puzzle } from '../domain/Puzzle.ts'

/** How much of the board the clues keep "interesting" at the START — before any
 *  deduction. Low coverage means most cells are dead on arrival ("da kann keiner
 *  stehen"), which makes a level feel empty and too easy. */
export interface CoverageReport {
  /** All occupiable cells. */
  total: number
  /** Union of ALL suspects' start candidates / total, 0..1. */
  ratio: number
  /** Union over only the RESTRICTED suspects / total, 0..1 — a suspect whose
   *  clue doesn't pin any cells ("allein", "im selben Raum wie X") covers the
   *  whole board trivially and would game the plain union. */
  constrainedRatio: number
  /** Mean of the per-suspect candidate counts / total, 0..1 — low when most
   *  people start pinned to a couple of cells, even if the union looks fine. */
  avgBreadth: number
  /** Candidate count of the TIGHTEST suspect (informational — tight anchors
   *  like "Dylan on one of two chairs" are a legitimate opener). */
  minSuspectCells: number
}

/** Start coverage from the clues alone (each suspect's own candidate cells — the
 *  blue highlight the player sees; victim excluded). */
export function startCoverage(puzzle: Puzzle): CoverageReport {
  const board = puzzle.board
  const occupiable = board.occupiableCells()
  const total = occupiable.length
  const union = new Set<Cell>()
  const constrainedUnion = new Set<Cell>()
  let minSuspectCells = total
  let breadthSum = 0
  for (const suspect of puzzle.suspects) {
    const domain = new Set<Cell>(occupiable)
    for (const clue of suspect.clues) {
      const cells = clue.candidateCells(board)
      if (cells) {
        for (const c of [...domain]) if (!cells.has(c)) domain.delete(c)
      }
    }
    const restricted = domain.size < total
    for (const c of domain) {
      union.add(c)
      if (restricted) constrainedUnion.add(c)
    }
    breadthSum += domain.size
    minSuspectCells = Math.min(minSuspectCells, domain.size)
  }
  const suspects = Math.max(1, puzzle.suspects.length)
  return {
    total,
    ratio: total === 0 ? 0 : union.size / total,
    constrainedRatio: total === 0 ? 0 : constrainedUnion.size / total,
    avgBreadth: total === 0 ? 0 : breadthSum / suspects / total,
    minSuspectCells,
  }
}
