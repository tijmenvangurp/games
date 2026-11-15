import { Technique } from './Technique.ts'
import { EmptyRoomsClue } from '../../clues/boardClues.ts'
import {
  AloneWithClue,
  NotAloneClue,
  RoomAttributeClue,
  RoomCompanionClue,
  RoomExistsClue,
} from '../../clues/socialClues.ts'
import { SameRoomClue } from '../../clues/relationalClues.ts'
import { AndClue } from '../../clues/compositeClues.ts'
import type { Clue } from '../../clues/Clue.ts'
import type { SolveContext } from '../SolveContext.ts'
import type { DeductionStep, Elimination } from '../DeductionStep.ts'
import type { Puzzle } from '../../domain/Puzzle.ts'

/** A clue that FORCES its subject to share the room with ≥1 other person ("never
 *  alone") — so that suspect must sit in a room that holds more than just them. */
function neverAlone(clue: Clue): boolean {
  if (clue instanceof RoomCompanionClue) return clue.count >= 1
  if (clue instanceof NotAloneClue) return true
  if (clue instanceof SameRoomClue) return true // "same room as X" ⇒ X is a roommate
  if (clue instanceof AloneWithClue) return clue.people.length + clue.extraCount >= 1
  if (clue instanceof RoomExistsClue) return true // "someone (else) was … in my room"
  if (clue instanceof RoomAttributeClue) {
    return clue.quantifier === 'some' && clue.excludeSelf && clue.count >= 1
  }
  if (clue instanceof AndClue) return clue.clues.some(neverAlone)
  return false
}

/**
 * Room bijection under an "exactly N rooms empty" clue, once the empty rooms are known.
 *
 * With R rooms, N of them provably empty, and S suspects, the R−N occupied rooms hold all
 * S suspects, so `S − (R−N)` suspects sit in a room that already has someone (the "surplus"
 * doublers). The ONLY suspects that can double up are the ones a clue forces to share a room
 * ("never alone" — alone-with-a-man, not-alone, same-room-as-X …). So when EXACTLY the
 * never-alone suspects account for the surplus, every OTHER suspect is a room's sole
 * occupant: the non-doubler suspects match the occupied rooms one-to-one. That bijection is
 * a Sudoku-like unit over them:
 *  - a non-doubler confined to one room reserves it (no OTHER non-doubler may enter);
 *  - a room only one non-doubler can reach confines that suspect to it.
 *
 * Sound: only fires when the surplus is exactly 1 and there is exactly one never-alone
 * suspect (or the surplus is 0 with none) — then each occupied room provably holds a distinct
 * non-doubler, so the real solution always respects the bijection. Restricting to that case
 * avoids the unsound corner where two doublers could share one room, leaving it with no
 * non-doubler.
 */
export class RoomAssignmentTechnique extends Technique {
  readonly name = 'roomAssignment'
  readonly difficulty = 4

  override relevant(puzzle: Puzzle): boolean {
    return puzzle.boardClues.some((c) => c instanceof EmptyRoomsClue)
  }

  apply(ctx: SolveContext): DeductionStep | null {
    const clue = ctx.puzzle.boardClues.find((c): c is EmptyRoomsClue => c instanceof EmptyRoomsClue)
    if (!clue) return null

    const allRooms = [...ctx.board.rooms.keys()]
    const suspects = ctx.puzzle.suspects.map((s) => s.id)
    const reachable = (room: string): boolean => suspects.some((id) => ctx.roomsOf(id).has(room))
    const deadRooms = allRooms.filter((r) => !reachable(r))
    // Only sound once EVERY empty room is pinned down (no suspect can reach it).
    if (deadRooms.length !== clue.count) return null
    const liveRooms = allRooms.filter(reachable)

    const surplus = suspects.length - liveRooms.length
    const wild = ctx.puzzle.suspects.filter((s) => s.clues.some(neverAlone)).map((s) => s.id)
    // Sound, simple case: at most one doubled room, accounted for by one never-alone suspect.
    if (surplus > 1 || wild.length !== surplus) return null
    const isWild = new Set(wild)
    const core = suspects.filter((id) => !isWild.has(id))
    if (core.length !== liveRooms.length) return null

    // (1) A core suspect confined to a room reserves it — every OTHER core suspect leaves it.
    for (const sid of core) {
      const rooms = ctx.roomsOf(sid)
      if (rooms.size !== 1) continue
      const room = [...rooms][0]
      const eliminated: Elimination[] = []
      for (const other of ctx.state.unplaced()) {
        if (other === sid || isWild.has(other) || other === ctx.puzzle.victim.id) continue
        const removed = ctx.removeWhere(other, (c) => ctx.roomOf(c) === room)
        if (removed.length > 0) eliminated.push({ personId: other, cells: removed })
      }
      if (eliminated.length > 0) {
        return {
          technique: 'roomAssignment',
          personId: sid,
          eliminated,
          explanation: { key: 'step.roomAssignmentReserve', params: { name: sid, room } },
        }
      }
    }

    // (2) A room only one core suspect can still reach must hold that suspect.
    for (const room of liveRooms) {
      const reach = core.filter(
        (id) => !ctx.state.placed.has(id) && ctx.roomsOf(id).has(room),
      )
      if (reach.length !== 1) continue
      const id = reach[0]
      if (ctx.roomsOf(id).size === 1) continue // already confined
      const removed = ctx.removeWhere(id, (c) => ctx.roomOf(c) !== room)
      if (removed.length > 0) {
        return {
          technique: 'roomAssignment',
          personId: id,
          eliminated: [{ personId: id, cells: removed }],
          explanation: { key: 'step.roomAssignmentConfine', params: { name: id, room } },
        }
      }
    }
    return null
  }
}
