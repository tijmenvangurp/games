import { Technique } from './Technique.ts'
import { SameRoomClue } from '../../clues/relationalClues.ts'
import { AndClue } from '../../clues/compositeClues.ts'
import type { Clue } from '../../clues/Clue.ts'
import type { PersonId } from '../../domain/types.ts'
import type { Puzzle } from '../../domain/Puzzle.ts'
import type { SolveContext } from '../SolveContext.ts'
import type { DeductionStep, Elimination } from '../DeductionStep.ts'

/** Certain "same room as X" clues (top-level or inside an AND — not an OR branch). */
function sameRoomClues(clue: Clue): SameRoomClue[] {
  if (clue instanceof SameRoomClue) return [clue]
  if (clue instanceof AndClue) return clue.clues.flatMap(sameRoomClues)
  return []
}

/**
 * Capacity reasoning from the Latin-square constraint (full permutation only): a room
 * holds at most `roomsCapacity` people, because each sits in a distinct row AND column.
 *  - Rule A: a room already filled by its guaranteed/placed occupants admits no one else.
 *  - Rule B: two people who must share a room can't pick a room that has no space left
 *    for both — e.g. Chefbüro spans 2 rows, the victim's-room logic already forces Doris
 *    there, so Aaron and Estella (who must be together) can't both join it.
 * Both only ever remove provably-impossible cells.
 */
export class RoomCapacityTechnique extends Technique {
  readonly name = 'roomCapacity'
  readonly difficulty = 4

  override relevant(puzzle: Puzzle): boolean {
    const full =
      puzzle.people().length === puzzle.board.width && puzzle.board.width === puzzle.board.height
    if (!full) return false
    return puzzle.suspects.some((s) => s.clues.some((c) => sameRoomClues(c).length > 0))
  }

  apply(ctx: SolveContext): DeductionStep | null {
    if (!ctx.fullPermutation) return null
    return this.applyFullRooms(ctx) ?? this.applyPairCapacity(ctx)
  }

  /** People forced into `room` (placed there, or with every candidate inside it). */
  private forcedInRoom(ctx: SolveContext, room: string, exclude: ReadonlySet<PersonId>): number {
    let n = 0
    for (const person of ctx.puzzle.people()) {
      if (exclude.has(person.id)) continue
      const placed = ctx.state.placed.get(person.id)
      if (placed !== undefined) {
        if (ctx.roomOf(placed) === room) n++
      } else if (ctx.guaranteedRoomOf(person.id) === room) {
        n++
      }
    }
    return n
  }

  private allRooms(ctx: SolveContext): Set<string> {
    const rooms = new Set<string>()
    for (const cell of ctx.board.occupiableCells()) rooms.add(ctx.roomOf(cell))
    return rooms
  }

  /** Rule A: room full of guaranteed/placed occupants → remove it from everyone else. */
  private applyFullRooms(ctx: SolveContext): DeductionStep | null {
    for (const room of this.allRooms(ctx)) {
      const cap = ctx.roomsCapacity([room])
      if (this.forcedInRoom(ctx, room, new Set()) < cap) continue
      const eliminated: Elimination[] = []
      for (const id of ctx.state.unplaced()) {
        if (ctx.guaranteedRoomOf(id) === room) continue // already counted as an occupant
        const removed = ctx.removeWhere(id, (c) => ctx.roomOf(c) === room)
        if (removed.length > 0) eliminated.push({ personId: id, cells: removed })
      }
      if (eliminated.length > 0) {
        return {
          technique: 'roomCapacity',
          eliminated,
          explanation: { key: 'step.roomCapacityFull', params: { room } },
        }
      }
    }
    return null
  }

  /** Rule B: a same-room pair can't share a room that can't hold two more. */
  private applyPairCapacity(ctx: SolveContext): DeductionStep | null {
    for (const suspect of ctx.puzzle.suspects) {
      const p = suspect.id
      if (ctx.state.placed.has(p)) continue
      for (const clue of suspect.clues.flatMap(sameRoomClues)) {
        const q = clue.target
        const pair = new Set<PersonId>([p, q])
        const shared = [...ctx.roomsOf(p)].filter((r) => ctx.roomsOf(q).has(r))
        for (const room of shared) {
          if (this.forcedInRoom(ctx, room, pair) + 2 <= ctx.roomsCapacity([room])) continue
          const eliminated: Elimination[] = []
          for (const id of [p, q]) {
            if (ctx.state.placed.has(id)) continue
            const removed = ctx.removeWhere(id, (c) => ctx.roomOf(c) === room)
            if (removed.length > 0) eliminated.push({ personId: id, cells: removed })
          }
          if (eliminated.length > 0) {
            return {
              technique: 'roomCapacity',
              personId: p,
              eliminated,
              explanation: { key: 'step.roomCapacityPair', params: { name: p, target: q, room } },
            }
          }
        }
      }
    }
    return null
  }
}
