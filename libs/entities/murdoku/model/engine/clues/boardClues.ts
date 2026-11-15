import type { Solution } from '../domain/Solution.ts'
import type { Puzzle } from '../domain/Puzzle.ts'
import type { Explanation } from '../domain/types.ts'
import type { BoardClueJson } from '../io/LevelSchema.ts'

/**
 * A board-wide clue: a constraint on the whole solution rather than one suspect
 * (e.g. "exactly one person was in a mud puddle"). Shown separately in the UI.
 */
export abstract class BoardClue {
  abstract test(solution: Solution, puzzle: Puzzle): boolean
  abstract describe(): Explanation
}

/** Exactly `count` people stand on a cell carrying `object`. */
export class CountOnObjectClue extends BoardClue {
  constructor(
    readonly object: string,
    readonly count: number,
  ) {
    super()
  }
  test(solution: Solution, puzzle: Puzzle): boolean {
    let n = 0
    for (const [, cell] of solution.entries()) {
      if (puzzle.board.tileAt(cell).hasObjectType(this.object)) n++
    }
    return n === this.count
  }
  describe(): Explanation {
    return { key: 'boardClue.countOnObject', params: { object: this.object, count: this.count } }
  }
}

/** Exactly `count` rooms hold nobody (0 = "no room is empty"). */
export class EmptyRoomsClue extends BoardClue {
  constructor(readonly count: number) {
    super()
  }
  test(solution: Solution, puzzle: Puzzle): boolean {
    const occupied = new Set<string>()
    for (const [, cell] of solution.entries()) occupied.add(puzzle.board.roomIdOf(cell))
    let empty = 0
    for (const id of puzzle.board.rooms.keys()) if (!occupied.has(id)) empty++
    return empty === this.count
  }
  describe(): Explanation {
    return { key: 'boardClue.emptyRooms', params: { count: this.count } }
  }
}

/** Every room holds exactly `count` people. */
export class EveryRoomCountClue extends BoardClue {
  constructor(readonly count: number) {
    super()
  }
  test(solution: Solution, puzzle: Puzzle): boolean {
    const counts = new Map<string, number>()
    for (const [, cell] of solution.entries()) {
      const room = puzzle.board.roomIdOf(cell)
      counts.set(room, (counts.get(room) ?? 0) + 1)
    }
    for (const id of puzzle.board.rooms.keys()) {
      if ((counts.get(id) ?? 0) !== this.count) return false
    }
    return true
  }
  describe(): Explanation {
    return { key: 'boardClue.everyRoomCount', params: { count: this.count } }
  }
}

/** Build a BoardClue from its JSON representation. */
export function createBoardClue(json: BoardClueJson): BoardClue {
  switch (json.type) {
    case 'countOnObject':
      return new CountOnObjectClue(json.object, json.count)
    case 'emptyRooms':
      return new EmptyRoomsClue(json.count)
    case 'everyRoomCount':
      return new EveryRoomCountClue(json.count)
  }
}
