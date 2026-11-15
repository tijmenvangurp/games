import { Technique } from './Technique.ts'
import { EmptyRoomsClue } from '../../clues/boardClues.ts'
import type { SolveContext } from '../SolveContext.ts'
import type { DeductionStep, Elimination } from '../DeductionStep.ts'
import type { Puzzle } from '../../domain/Puzzle.ts'
import type { Cell } from '../../domain/types.ts'

/**
 * Board clue "exactly N rooms are empty" — two forward deductions a human makes
 * straight from the rule, no trial:
 *
 *  A. Enough rooms are ALREADY certainly occupied (R−N of them) ⇒ every other room
 *     must stay empty ⇒ nobody may be placed there. (The player's "B can't go here,
 *     that would leave the wrong number of rooms empty".)
 *  B. Exactly N rooms can no longer hold anyone ⇒ every other room must be occupied ⇒
 *     a room only one person can still reach confines that person to it.
 *
 * The victim never opens a NEW room (it always shares the murderer's), so a room counts
 * as occupied as soon as one suspect is certain to be in it.
 */
export class EmptyRoomsTechnique extends Technique {
  readonly name = 'emptyRooms'
  readonly difficulty = 4

  override relevant(puzzle: Puzzle): boolean {
    return puzzle.boardClues.some((c) => c instanceof EmptyRoomsClue)
  }

  apply(ctx: SolveContext): DeductionStep | null {
    const clue = ctx.puzzle.boardClues.find((c): c is EmptyRoomsClue => c instanceof EmptyRoomsClue)
    if (!clue) return null
    const n = clue.count
    const rooms = [...ctx.board.rooms.keys()]
    const occupiedTarget = rooms.length - n
    if (occupiedTarget < 0) return null

    // Occupancy is reckoned over SUSPECTS only: the victim never occupies a room on its
    // own (it sits with the murderer), so "empty" means "no suspect here". Counting the
    // victim as a possible occupant would mask exactly the deductions a player makes.
    const suspects = ctx.state.unplaced().filter((id) => !ctx.isVictim(id))
    // Rooms with a CERTAIN suspect (a placed suspect, or an unplaced suspect all of whose
    // candidates lie in one room) and rooms a suspect can still reach at all.
    const certain = new Set<string>()
    for (const [id, cell] of ctx.state.placed) {
      if (!ctx.isVictim(id)) certain.add(ctx.board.roomIdOf(cell))
    }
    for (const id of suspects) {
      const where = ctx.roomsOf(id)
      if (where.size === 1) certain.add([...where][0])
    }
    const live = new Set<string>(certain)
    for (const id of suspects) for (const r of ctx.roomsOf(id)) live.add(r)

    // A. The occupied quota is met → every other room must end empty, so NObody (suspect
    //    or victim) may be placed there.
    if (certain.size === occupiedTarget) {
      const eliminated: Elimination[] = []
      for (const id of ctx.state.unplaced()) {
        const removed = ctx.removeWhere(id, (c) => !certain.has(ctx.board.roomIdOf(c)))
        if (removed.length > 0) eliminated.push({ personId: id, cells: removed })
      }
      if (eliminated.length > 0) {
        return {
          technique: 'emptyRooms',
          eliminated,
          explanation: { key: 'step.emptyRoomsAllOccupied', params: { count: n } },
        }
      }
    }

    // B. Exactly N rooms can no longer hold a suspect → every other room must be occupied;
    //    a room only one suspect can still reach confines that suspect to it.
    const deadEmpty = rooms.filter((r) => !live.has(r))
    if (deadEmpty.length === n) {
      for (const room of rooms) {
        if (certain.has(room) || !live.has(room)) continue
        const possible = suspects.filter((id) => ctx.roomsOf(id).has(room))
        if (possible.length !== 1) continue
        const id = possible[0]
        const removed = ctx.removeWhere(id, (c) => ctx.board.roomIdOf(c) !== room)
        if (removed.length > 0) {
          return {
            technique: 'emptyRooms',
            personId: id,
            eliminated: [{ personId: id, cells: removed }],
            explanation: { key: 'step.emptyRoomsConfine', params: { name: id, room, count: n } },
          }
        }
      }

      // C. LINE PROJECTION — every live room must hold a suspect. If a room's still-reachable
      //    suspect cells all lie in ONE row (or column), that room's occupant sits in that
      //    line; each line holds at most one person, so it IS that line's occupant → every
      //    cell of the line OUTSIDE the room is empty (for everyone, victim included).
      //    ("The store-room can only be filled in row 5 ⇒ cross the rest of row 5.")
      for (const room of rooms) {
        if (!live.has(room)) continue
        const placedHere = [...ctx.state.placed].some(
          ([id, cell]) => !ctx.isVictim(id) && ctx.board.roomIdOf(cell) === room,
        )
        if (placedHere) continue // its occupant's line is already known + propagated
        const inRoom: Cell[] = []
        for (const id of suspects) {
          for (const c of ctx.state.domain(id)) if (ctx.board.roomIdOf(c) === room) inRoom.push(c)
        }
        if (inRoom.length === 0) continue
        for (const axis of ['row', 'col'] as const) {
          const lines = new Set(inRoom.map((c) => ctx.axisOf(c, axis)))
          if (lines.size !== 1) continue
          const line = [...lines][0]
          const eliminated: Elimination[] = []
          for (const id of ctx.state.unplaced()) {
            const removed = ctx.removeWhere(
              id,
              (c) => ctx.axisOf(c, axis) === line && ctx.board.roomIdOf(c) !== room,
            )
            if (removed.length > 0) eliminated.push({ personId: id, cells: removed })
          }
          if (eliminated.length > 0) {
            return {
              technique: 'emptyRooms',
              eliminated,
              explanation: { key: 'step.emptyRoomsLine', params: { room, line: axis, num: line + 1 } },
            }
          }
        }
      }
    }
    return null
  }
}
