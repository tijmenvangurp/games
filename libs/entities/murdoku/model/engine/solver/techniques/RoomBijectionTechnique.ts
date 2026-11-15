import { Technique } from './Technique.ts'
import { EmptyRoomsClue } from '../../clues/boardClues.ts'
import { DirectionClue, OffsetClue } from '../../clues/relationalClues.ts'
import { AndClue } from '../../clues/compositeClues.ts'
import { combinations } from './combinations.ts'
import type { Clue } from '../../clues/Clue.ts'
import type { SolveContext } from '../SolveContext.ts'
import type { DeductionStep } from '../DeductionStep.ts'
import type { Cell, PersonId } from '../../domain/types.ts'
import type { Puzzle } from '../../domain/Puzzle.ts'

/** A positional coupling between two suspects that depends ONLY on their two cells —
 *  a direction ("north of X") or an exact offset. These are the couplings that can break
 *  a symmetric room split ("one of them is up, the other down — and H is north of E"). */
interface Relation {
  subject: PersonId
  clue: DirectionClue | OffsetClue
}

/** The direction/offset relations of a clue that are CERTAIN (top-level, or inside an AND —
 *  an OR branch is not certain), each pointing at another named suspect. */
function relationsOf(subject: PersonId, clue: Clue): Relation[] {
  if (clue instanceof DirectionClue || clue instanceof OffsetClue) return [{ subject, clue }]
  if (clue instanceof AndClue) return clue.clues.flatMap((c) => relationsOf(subject, c))
  return []
}

/**
 * "No empty rooms" room split — the closed-group room matching a human does straight from
 * the rule, no trial:
 *
 *  A closed group of k suspects whose combined still-possible rooms are exactly k rooms,
 *  and NO other suspect can reach any of those rooms, must fill them one-to-one — every
 *  room needs a suspect (no room is empty; the victim only ever shares the murderer's
 *  room, so it never fills one on its own), only these k suspects can be there, and there
 *  are exactly k of them ⇒ each room holds exactly one of the group.
 *
 *  That bijection alone confines the group to its territory (already known). What it ADDS
 *  is symmetry-breaking via a positional clue between two members: if putting suspect X in
 *  room rx would force partner Y into a room where their "X was north of Y / east of …"
 *  clue can never hold (e.g. the guest room lies entirely north of the bedroom, and H is
 *  north of E ⇒ E can't take the guest room), that cell is impossible.
 *
 *  Sound: a cell is removed only when NO assignment of the group to the rooms — with the
 *  suspect on that cell's room — lets every positional clue between two members hold. The
 *  real solution is such an assignment, so its cells always survive.
 */
export class RoomBijectionTechnique extends Technique {
  readonly name = 'roomBijection'
  readonly difficulty = 4

  private hasNoEmpty(puzzle: Puzzle): boolean {
    return puzzle.boardClues.some((c) => c instanceof EmptyRoomsClue && c.count === 0)
  }

  override relevant(puzzle: Puzzle): boolean {
    if (!this.hasNoEmpty(puzzle)) return false
    const suspects = new Set(puzzle.suspects.map((s) => s.id))
    return puzzle.suspects.some((s) =>
      s.clues.flatMap((c) => relationsOf(s.id, c)).some((r) => suspects.has(r.clue.target)),
    )
  }

  apply(ctx: SolveContext): DeductionStep | null {
    if (!this.hasNoEmpty(ctx.puzzle)) return null
    const suspects = ctx.puzzle.suspects.map((s) => s.id)
    const unplaced = ctx.state.unplaced().filter((id) => !ctx.isVictim(id))
    // Positional couplings between two suspects (both endpoints must be suspects).
    const relations = ctx.puzzle.suspects
      .flatMap((s) => s.clues.flatMap((c) => relationsOf(s.id, c)))
      .filter((r) => suspects.includes(r.clue.target))
    if (relations.length === 0) return null

    const maxK = Math.min(4, unplaced.length - 1)
    for (let k = 2; k <= maxK; k++) {
      for (const group of combinations(unplaced, k)) {
        // The group's territory: every room its members can still be in.
        const rooms = new Set<string>()
        for (const g of group) for (const r of ctx.roomsOf(g)) rooms.add(r)
        if (rooms.size !== k) continue
        // Closure: no OTHER suspect (placed or not) can reach the territory, so the group
        // are the only possible occupants of these k rooms.
        const outsiderInside = suspects.some(
          (id) => !group.includes(id) && [...ctx.roomsOf(id)].some((r) => rooms.has(r)),
        )
        if (outsiderInside) continue
        const step = this.resolve(ctx, group, [...rooms], relations)
        if (step) return step
      }
    }
    return null
  }

  /** With the bijection established, remove every group cell whose room, once assigned to
   *  that member, leaves no way to place the rest so all positional couplings still hold. */
  private resolve(
    ctx: SolveContext,
    group: PersonId[],
    rooms: string[],
    relations: Relation[],
  ): DeductionStep | null {
    const inGroup = new Set(group)
    const couplings = relations.filter((r) => inGroup.has(r.subject) && inGroup.has(r.clue.target))
    if (couplings.length === 0) return null
    for (const g of group) {
      for (const room of ctx.roomsOf(g)) {
        if (this.matchable(ctx, group, rooms, couplings, new Map([[g, room]]))) continue
        const removed = ctx.removeWhere(g, (c) => ctx.roomOf(c) === room)
        if (removed.length > 0) {
          return {
            technique: 'roomBijection',
            personId: g,
            eliminated: [{ personId: g, cells: removed }],
            explanation: {
              key: 'step.roomBijection',
              params: { people: group.join(','), name: g, room },
            },
          }
        }
      }
    }
    return null
  }

  /** Does SOME assignment of the group to distinct rooms (respecting `fixed`) satisfy every
   *  positional coupling between two members? Backtracking over the ≤ k! permutations. */
  private matchable(
    ctx: SolveContext,
    group: PersonId[],
    rooms: string[],
    couplings: Relation[],
    fixed: Map<PersonId, string>,
  ): boolean {
    const assign = new Map(fixed)
    const used = new Set(fixed.values())
    const rest = group.filter((g) => !assign.has(g))
    const allHold = (): boolean =>
      couplings.every((c) =>
        this.compatible(ctx, c, assign.get(c.subject)!, assign.get(c.clue.target)!),
      )
    const bt = (i: number): boolean => {
      if (i === rest.length) return allHold()
      const g = rest[i]
      for (const room of rooms) {
        if (used.has(room)) continue
        assign.set(g, room)
        used.add(room)
        if (bt(i + 1)) return true
        assign.delete(g)
        used.delete(room)
      }
      return false
    }
    return bt(0)
  }

  /** Can the coupling's clue hold with its subject somewhere in `rP` and its target in
   *  `rQ`? True iff some still-possible cell-pair in those rooms satisfies it. */
  private compatible(ctx: SolveContext, rel: Relation, rP: string, rQ: string): boolean {
    const { subject, clue } = rel
    const target = clue.target
    const pCells = ctx.cellsOf(subject).filter((c) => ctx.roomOf(c) === rP)
    const qCells = ctx.cellsOf(target).filter((c) => ctx.roomOf(c) === rQ)
    for (const cp of pCells) {
      for (const cq of qCells) {
        const pair = new Map<PersonId, Cell>([
          [subject, cp],
          [target, cq],
        ])
        if (!clue.violatedBy(subject, pair, ctx.puzzle)) return true
      }
    }
    return false
  }
}
