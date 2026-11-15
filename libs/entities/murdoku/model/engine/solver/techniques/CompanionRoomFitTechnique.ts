import { Technique } from './Technique.ts'
import { RoomAttributeClue, RoomCompanionClue, RoomExistsClue } from '../../clues/socialClues.ts'
import { AndClue } from '../../clues/compositeClues.ts'
import type { Clue } from '../../clues/Clue.ts'
import type { SolveContext } from '../SolveContext.ts'
import type { DeductionStep } from '../DeductionStep.ts'
import type { Cell, PersonId } from '../../domain/types.ts'
import type { Puzzle } from '../../domain/Puzzle.ts'

/** A required co-occupant: how many, who can be it, and which cells of a room qualify. */
interface Demand {
  count: number
  matches: (id: PersonId) => boolean
  /** Whether a cell can hold the companion (in-room for "alone with"; on/near the object
   *  for "someone X was on/near an object in my room"). */
  cellOk: (cell: Cell, room: string) => boolean
  key: string
}

function demandsOf(clue: Clue): ((ctx: SolveContext, subject: PersonId) => Demand)[] {
  if (clue instanceof RoomCompanionClue) {
    const { count, attribute, value } = clue
    return [
      (ctx, subject) => ({
        count,
        matches: (id) =>
          id !== subject &&
          id !== ctx.puzzle.victim.id &&
          ctx.puzzle.attributesOf(id)[attribute] === value,
        cellOk: () => true,
        key: 'step.companionFit',
      }),
    ]
  }
  if (clue instanceof RoomExistsClue) {
    return [
      (ctx, subject) => ({
        count: 1,
        matches: (id) => id !== subject && clue.matchesPerson(ctx.puzzle, id),
        cellOk: (cell, room) => clue.qualifies(ctx.board, cell, room),
        key: 'step.companionFit',
      }),
    ]
  }
  // "≥ N matching others in my room" (count ≥ 2): the N matches must be SUSPECTS that
  // physically fit alongside the subject — the victim can't be among them, because the
  // victim shares its room with exactly ONE suspect, so its presence allows no second
  // matching person at all (and N ≥ 2 needs ≥ 2). Confines the subject out of rooms that
  // can't seat N matching suspects. (Count 1 is left to the room-attribute room rule,
  // where the victim CAN be the single match.)
  if (
    clue instanceof RoomAttributeClue &&
    clue.quantifier === 'some' &&
    clue.excludeSelf &&
    clue.count >= 2
  ) {
    const { count, attribute, value } = clue
    return [
      (ctx, subject) => ({
        count,
        matches: (id) =>
          id !== subject &&
          id !== ctx.puzzle.victim.id &&
          ctx.puzzle.attributesOf(id)[attribute] === value,
        cellOk: () => true,
        key: 'step.companionFit',
      }),
    ]
  }
  if (clue instanceof AndClue) return clue.clues.flatMap(demandsOf)
  return []
}

/**
 * Within-room feasibility for a required co-occupant. If a suspect's clue needs `count`
 * people matching X in their room (alone-with-a-man, or "a man sat on a chair in my
 * room"), a candidate cell is impossible when those companions CAN'T physically fit the
 * room alongside the suspect — distinct rows AND columns, within everyone's domains, and
 * (for "on/near an object") on a qualifying cell. Catches the cases coarse room-counting
 * misses: e.g. the suspect sits on the room's only chair so no man can join, or the only
 * free cells left lie in a column reserved for someone else.
 *
 * Sound: the room is tiny, so we exhaustively try every companion placement and eliminate
 * a cell ONLY when none works.
 */
export class CompanionRoomFitTechnique extends Technique {
  readonly name = 'companionFit'
  readonly difficulty = 4

  override relevant(puzzle: Puzzle): boolean {
    return puzzle.suspects.some((s) => s.clues.some((c) => demandsOf(c).length > 0))
  }

  apply(ctx: SolveContext): DeductionStep | null {
    for (const suspect of ctx.puzzle.suspects) {
      if (ctx.state.placed.has(suspect.id)) continue
      const demands = suspect.clues.flatMap(demandsOf).map((make) => make(ctx, suspect.id))
      if (demands.length === 0) continue
      const removed = ctx.removeWhere(suspect.id, (cell) => {
        const room = ctx.board.roomIdOf(cell)
        return demands.some((d) => !this.canSeat(ctx, suspect.id, cell, room, d))
      })
      if (removed.length > 0) {
        return {
          technique: 'companionFit',
          personId: suspect.id,
          eliminated: [{ personId: suspect.id, cells: removed }],
          explanation: { key: 'step.companionFit', params: { name: suspect.id } },
        }
      }
    }
    return null
  }

  /** Can `count` distinct matching companions sit in `room` alongside the subject at
   *  `subjCell` — distinct rows AND columns, each within its domain, on a qualifying cell? */
  private canSeat(
    ctx: SolveContext,
    subject: PersonId,
    subjCell: Cell,
    room: string,
    d: Demand,
  ): boolean {
    if (d.count <= 0) return true
    const sub = ctx.board.rc(subjCell)
    // Already-PLACED matching companions in the room count toward the demand (they sit on
    // a distinct row/column from the subject's candidate cell by construction).
    let need = d.count
    for (const [id, cell] of ctx.state.placed) {
      if (id === subject || !d.matches(id)) continue
      if (ctx.board.roomIdOf(cell) === room && d.cellOk(cell, room)) need--
    }
    if (need <= 0) return true
    // Candidate (person, cell) seats: a matching person, a cell of theirs in the room that
    // qualifies and doesn't clash (row/column) with the subject.
    const seats: { id: PersonId; cell: Cell; row: number; col: number }[] = []
    for (const id of ctx.state.unplaced()) {
      if (id === subject || !d.matches(id)) continue
      for (const cell of ctx.cellsOf(id)) {
        if (ctx.board.roomIdOf(cell) !== room) continue
        const { row, col } = ctx.board.rc(cell)
        if (cell === subjCell || row === sub.row || col === sub.col) continue
        if (!d.cellOk(cell, room)) continue
        seats.push({ id, cell, row, col })
      }
    }
    // Pick `count` of them with distinct people, rows, and columns (bounded backtracking).
    const usedPeople = new Set<PersonId>()
    const usedRows = new Set<number>()
    const usedCols = new Set<number>()
    const pick = (from: number, need: number): boolean => {
      if (need === 0) return true
      for (let i = from; i < seats.length; i++) {
        const s = seats[i]
        if (usedPeople.has(s.id) || usedRows.has(s.row) || usedCols.has(s.col)) continue
        usedPeople.add(s.id)
        usedRows.add(s.row)
        usedCols.add(s.col)
        if (pick(i + 1, need - 1)) return true
        usedPeople.delete(s.id)
        usedRows.delete(s.row)
        usedCols.delete(s.col)
      }
      return false
    }
    return pick(0, need)
  }
}
