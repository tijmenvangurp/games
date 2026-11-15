import { UnaryClue } from './Clue.ts'
import type { Board } from '../domain/Board.ts'
import type { Solution } from '../domain/Solution.ts'
import type { Puzzle } from '../domain/Puzzle.ts'
import type { Cell, Explanation, PersonId } from '../domain/types.ts'

/**
 * Prepositional wording per object type: one is IN a tent, UNDER a parasol — everything
 * else reads "on". This only picks the template-key SUFFIX (onObjectIn/onObjectUnder,
 * uniqueOnObject…, roomExistsOn…); the locales carry the actual words, and both clue
 * renderers (Renderer.ts and ClueText.tsx) resolve the keys the same way.
 */
export const ON_OBJECT_KEY_SUFFIX: Record<string, 'In' | 'Under'> = {
  tent: 'In',
  parasol: 'Under',
  carriage: 'In',
  hottub: 'In',
  hammock: 'In',
}

/** "{name} was on a {object}." (in/under for tent/parasol) */
export class OnObjectClue extends UnaryClue {
  constructor(readonly object: string) {
    super()
  }
  candidateCells(board: Board): Set<Cell> {
    return board.cellsWithObject(this.object)
  }
  describe(): Explanation {
    const suffix = ON_OBJECT_KEY_SUFFIX[this.object] ?? ''
    return { key: `clue.onObject${suffix}`, params: { object: this.object } }
  }
}

/** "{name} was beside a {object}." (orthogonal + same room) */
export class NearObjectClue extends UnaryClue {
  constructor(readonly object: string) {
    super()
  }
  candidateCells(board: Board): Set<Cell> {
    return board.cellsNearObject(this.object)
  }
  describe(): Explanation {
    return { key: 'clue.nearObject', params: { object: this.object } }
  }
}

/** "{name} was beside a window." */
export class NearWindowClue extends UnaryClue {
  candidateCells(board: Board): Set<Cell> {
    return board.cellsNearWindow()
  }
  describe(): Explanation {
    return { key: 'clue.nearWindow' }
  }
}

/** "{name} was beside one of these objects." (any of a list — reads as one phrase) */
export class NearAnyObjectClue extends UnaryClue {
  constructor(readonly objects: string[]) {
    super()
  }
  candidateCells(board: Board): Set<Cell> {
    const out = new Set<Cell>()
    for (const object of this.objects) for (const c of board.cellsNearObject(object)) out.add(c)
    return out
  }
  describe(): Explanation {
    return { key: 'clue.nearObjectAny', params: { objects: this.objects.join(',') } }
  }
}

/** "{name} was beside a door." (doors are two-sided) */
export class NearDoorClue extends UnaryClue {
  candidateCells(board: Board): Set<Cell> {
    return board.cellsNearDoor()
  }
  describe(): Explanation {
    return { key: 'clue.nearDoor' }
  }
}

/** "{name} was outside / inside." (outdoor area vs indoor room) */
export class OutsideClue extends UnaryClue {
  constructor(readonly outside: boolean) {
    super()
  }
  candidateCells(board: Board): Set<Cell> {
    return board.cellsOutside(this.outside)
  }
  describe(): Explanation {
    return { key: this.outside ? 'clue.outside' : 'clue.inside' }
  }
}

/**
 * "{name} was in {room}." With `occupancy`, it also constrains who else shares it:
 * 'alone' = the subject is the room's only person (victim included), 'notAlone' =
 * at least one other person is there too. Being in the room is still the fixed
 * candidate set; the occupancy part (which depends on others) is checked in `test`.
 */
export class InRoomClue extends UnaryClue {
  constructor(
    readonly room: string,
    readonly occupancy: 'alone' | 'notAlone' | null = null,
  ) {
    super()
  }
  candidateCells(board: Board): Set<Cell> {
    return board.cellsInRoom(this.room)
  }
  override forbiddenForOthers(board: Board): Set<Cell> | null {
    // "alone in room X" → nobody else may stand in room X.
    return this.occupancy === 'alone' ? board.cellsInRoom(this.room) : null
  }
  override definiteCells(board: Board): Set<Cell> | null {
    // With an occupancy requirement, being in the room isn't enough to be true, so
    // it has no others-independent "definite" set (its negation prunes nothing).
    return this.occupancy ? null : this.candidateCells(board)
  }
  override test(subjectId: PersonId, solution: Solution, puzzle: Puzzle): boolean {
    const board = puzzle.board
    if (board.roomIdOf(solution.cellOf(subjectId)) !== this.room) return false
    if (!this.occupancy) return true
    let others = 0
    for (const id of puzzle.allIds()) {
      if (id === subjectId) continue
      if (board.roomIdOf(solution.cellOf(id)) === this.room) others++
    }
    return this.occupancy === 'alone' ? others === 0 : others >= 1
  }
  override violatedBy(
    subjectId: PersonId,
    placement: ReadonlyMap<PersonId, Cell>,
    puzzle: Puzzle,
  ): boolean {
    const board = puzzle.board
    const cell = placement.get(subjectId)
    if (cell === undefined) return false
    if (board.roomIdOf(cell) !== this.room) return true
    if (this.occupancy === 'alone') {
      for (const [id, c] of placement) {
        if (id !== subjectId && board.roomIdOf(c) === this.room) return true
      }
    }
    return false
  }
  describe(): Explanation {
    if (this.occupancy === 'alone') return { key: 'clue.inRoomAlone', params: { room: this.room } }
    if (this.occupancy === 'notAlone') return { key: 'clue.inRoomNotAlone', params: { room: this.room } }
    return { key: 'clue.inRoom', params: { room: this.room } }
  }
}

/** "{name} was in row {row}." (row is 0-indexed internally) */
export class InRowClue extends UnaryClue {
  constructor(readonly row: number) {
    super()
  }
  candidateCells(board: Board): Set<Cell> {
    return board.cellsInRow(this.row)
  }
  describe(): Explanation {
    return { key: 'clue.inRow', params: { row: this.row + 1 } }
  }
}

/** "{name} was in column {col}." (col is 0-indexed internally) */
export class InColClue extends UnaryClue {
  constructor(readonly col: number) {
    super()
  }
  candidateCells(board: Board): Set<Cell> {
    return board.cellsInCol(this.col)
  }
  describe(): Explanation {
    return { key: 'clue.inCol', params: { col: this.col + 1 } }
  }
}

/** "{name} was in a corner." */
export class CornerClue extends UnaryClue {
  candidateCells(board: Board): Set<Cell> {
    return board.cornerCells()
  }
  describe(): Explanation {
    return { key: 'clue.corner' }
  }
}

/** "{name} was beside a wall." (at least one side is a wall) */
export class AtWallClue extends UnaryClue {
  candidateCells(board: Board): Set<Cell> {
    return board.cellsAtWall()
  }
  describe(): Explanation {
    return { key: 'clue.atWall' }
  }
}
