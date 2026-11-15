import { Technique } from './Technique.ts'
import { aloneWithList } from './RoomReasoningTechnique.ts'
import type { AloneWithClue } from '../../clues/socialClues.ts'
import type { SolveContext } from '../SolveContext.ts'
import type { DeductionStep, Elimination } from '../DeductionStep.ts'
import type { Cell, PersonId } from '../../domain/types.ts'
import type { Puzzle } from '../../domain/Puzzle.ts'

/**
 * Whole-group room reasoning for "alone with [people] and N matching extras":
 * the subject, the named people and the extras form ONE group that shares a room.
 * Three sound, forward deductions (no trial placements):
 *  - **exclude** a room the group provably can't be in — a member has no cell
 *    there, someone outside the group is guaranteed there (incl. the victim),
 *    too few possible extras can reach it, or it simply can't hold the group;
 *  - **identify** the extras once the subject's room is certain: if exactly N
 *    candidates remain for the N extra slots, each of them must be in that room;
 *  - **direction**: with a single identified extra and a directional clue
 *    ("one of them east of her"), prune the side that can't satisfy it.
 */
export class GroupRoomTechnique extends Technique {
  readonly name = 'groupRoom'
  readonly difficulty = 5

  override relevant(puzzle: Puzzle): boolean {
    return puzzle.suspects.some((s) => s.clues.flatMap(aloneWithList).length > 0)
  }

  apply(ctx: SolveContext): DeductionStep | null {
    for (const suspect of ctx.puzzle.suspects) {
      for (const clue of suspect.clues.flatMap(aloneWithList)) {
        const step =
          this.applyRoomExclusion(ctx, suspect.id, clue) ??
          this.applyRoomSaturation(ctx, suspect.id, clue) ??
          this.applyMemberIdentification(ctx, suspect.id, clue) ??
          this.applyDirFeasibility(ctx, suspect.id, clue)
        if (step) return step
      }
    }
    return null
  }

  /** The suspects who could fill an "extra" slot (matching, not in the group). */
  private extraCandidates(ctx: SolveContext, id: PersonId, clue: AloneWithClue): PersonId[] {
    const members = new Set<PersonId>([id, ...clue.people])
    return ctx.puzzle.suspects
      .map((s) => s.id)
      .filter((p) => !members.has(p) && ctx.puzzle.attributesOf(p)[clue.attribute] === clue.value)
  }

  /** Whether a person still has a cell (placed or candidate) in the room. */
  private canBeIn(ctx: SolveContext, p: PersonId, room: string): boolean {
    return ctx.cellsOf(p).some((c) => ctx.roomOf(c) === room)
  }

  /** Room a person is certainly in (placed, or whole domain inside it), or null. */
  private certainRoom(ctx: SolveContext, p: PersonId): string | null {
    const placed = ctx.state.placed.get(p)
    return placed !== undefined ? ctx.roomOf(placed) : ctx.guaranteedRoomOf(p)
  }

  /** Rule 1: strike every room the whole group provably can't occupy. */
  private applyRoomExclusion(
    ctx: SolveContext,
    id: PersonId,
    clue: AloneWithClue,
  ): DeductionStep | null {
    const victim = ctx.puzzle.victim.id
    // Rare corner: with no named people the victim himself could be the matching
    // extra (the murder scene) — none of the reasoning below is safe then.
    if (clue.people.length === 0 && ctx.puzzle.attributesOf(victim)[clue.attribute] === clue.value) {
      return null
    }
    const members = [id, ...clue.people]
    const groupSize = members.length + clue.extraCount
    const extras = this.extraCandidates(ctx, id, clue)

    const rooms = new Set<string>()
    for (const m of members) for (const r of ctx.roomsOf(m)) rooms.add(r)

    for (const room of rooms) {
      const why = this.roomImpossible(ctx, room, members, extras, clue.extraCount, groupSize)
      if (!why) continue
      const eliminated: Elimination[] = []
      for (const m of members) {
        if (ctx.state.placed.has(m)) continue
        const removed = ctx.removeWhere(m, (c) => ctx.roomOf(c) === room)
        if (removed.length > 0) eliminated.push({ personId: m, cells: removed })
      }
      if (eliminated.length > 0) {
        return {
          technique: 'groupRoom',
          personId: id,
          eliminated,
          explanation: { key: why, params: { name: id, room, size: groupSize } },
        }
      }
    }
    return null
  }

  /** The i18n key explaining why the group can't be in `room`, or null if it can. */
  private roomImpossible(
    ctx: SolveContext,
    room: string,
    members: PersonId[],
    extras: PersonId[],
    extraCount: number,
    groupSize: number,
  ): string | null {
    // A member with no cell in the room sinks the whole group.
    if (members.some((m) => !this.canBeIn(ctx, m, room))) return 'step.groupRoomMemberOut'

    // Someone guaranteed in the room who can't belong to the group (the victim, a
    // non-matching outsider, or more guaranteed matchers than there are slots).
    let guaranteedExtras = 0
    for (const person of ctx.puzzle.people()) {
      if (members.includes(person.id)) continue
      if (this.certainRoom(ctx, person.id) !== room) continue
      if (person.id === ctx.puzzle.victim.id || !extras.includes(person.id)) {
        return 'step.groupRoomForeign'
      }
      if (++guaranteedExtras > extraCount) return 'step.groupRoomForeign'
    }

    // Too few possible extras can still reach the room.
    if (extras.filter((p) => this.canBeIn(ctx, p, room)).length < extraCount) {
      return 'step.groupRoomNoExtra'
    }

    // The room can't geometrically hold the group (full permutation: distinct
    // rows AND columns per person bound a room's occupancy).
    if (ctx.fullPermutation && ctx.roomsCapacity([room]) < groupSize) {
      return 'step.groupRoomCapacity'
    }
    return null
  }

  /** Rule 5: subject's room is certain and every extra slot is provably taken →
   *  all non-members leave the room (even people who would have matched). */
  private applyRoomSaturation(
    ctx: SolveContext,
    id: PersonId,
    clue: AloneWithClue,
  ): DeductionStep | null {
    const room = this.certainRoom(ctx, id)
    if (!room) return null
    const extras = this.extraCandidates(ctx, id, clue)
    const guaranteed = extras.filter((p) => this.certainRoom(ctx, p) === room)
    if (guaranteed.length < clue.extraCount) return null
    const keep = new Set<PersonId>([id, ...clue.people, ...guaranteed])
    const eliminated: Elimination[] = []
    for (const other of ctx.state.unplaced()) {
      if (keep.has(other)) continue
      const removed = ctx.removeWhere(other, (c) => ctx.roomOf(c) === room)
      if (removed.length > 0) eliminated.push({ personId: other, cells: removed })
    }
    if (eliminated.length === 0) return null
    return {
      technique: 'groupRoom',
      personId: id,
      eliminated,
      explanation: { key: 'step.groupRoomFull', params: { name: id, room } },
    }
  }

  /** Rules 2+3: subject's room certain → pin down the extras (and the direction). */
  private applyMemberIdentification(
    ctx: SolveContext,
    id: PersonId,
    clue: AloneWithClue,
  ): DeductionStep | null {
    if (clue.extraCount === 0) return null
    const room = this.certainRoom(ctx, id)
    if (!room) return null
    const possible = this.extraCandidates(ctx, id, clue).filter((p) => this.canBeIn(ctx, p, room))
    if (possible.length !== clue.extraCount) return null

    // Exactly as many candidates as slots → every one of them is in the room.
    for (const p of possible) {
      if (ctx.state.placed.has(p)) continue
      const removed = ctx.removeWhere(p, (c) => ctx.roomOf(c) !== room)
      if (removed.length > 0) {
        return {
          technique: 'groupRoom',
          personId: id,
          eliminated: [{ personId: p, cells: removed }],
          explanation: { key: 'step.groupRoomMember', params: { name: id, target: p, room } },
        }
      }
    }

    // "One of them was <dir> of the subject": with a single extra, that extra and
    // the subject constrain each other along the axis.
    if (clue.dir && clue.extraCount === 1) {
      const extra = possible[0]
      const step =
        this.applyDirection(ctx, id, extra, clue, false) ??
        this.applyDirection(ctx, extra, id, clue, true)
      if (step) return step
    }
    return null
  }

  /** Does an extra at `extra` satisfy "dir of the subject at `subject`"? */
  private dirSatisfied(
    ctx: SolveContext,
    extra: Cell,
    subject: Cell,
    dir: AloneWithClue['dir'],
  ): boolean {
    const e = ctx.board.rc(extra)
    const s = ctx.board.rc(subject)
    if (dir === 'north') return e.row < s.row
    if (dir === 'south') return e.row > s.row
    if (dir === 'east') return e.col > s.col
    return e.col < s.col
  }

  /** Two cells that can't be occupied simultaneously (same cell / row / column). */
  private clashes(ctx: SolveContext, a: Cell, b: Cell): boolean {
    if (a === b) return true
    const pa = ctx.board.rc(a)
    const pb = ctx.board.rc(b)
    return pa.row === pb.row || pa.col === pb.col
  }

  /**
   * Rule 4 — directional feasibility inside a certain room, for a single extra:
   * any group-eligible person standing in the subject's room IS the extra, so
   *  - an eligible person's cell in the room with NO subject cell it could be
   *    `dir` of is impossible (e.g. Gina west of every cell Branka could take);
   *  - a subject cell with NO eligible extra cell `dir` of it is impossible.
   */
  private applyDirFeasibility(
    ctx: SolveContext,
    id: PersonId,
    clue: AloneWithClue,
  ): DeductionStep | null {
    if (!clue.dir || clue.extraCount !== 1) return null
    const room = this.certainRoom(ctx, id)
    if (!room) return null
    const extras = this.extraCandidates(ctx, id, clue)
    const subjectCells = ctx.cellsOf(id).filter((c) => ctx.roomOf(c) === room)

    // (a) an eligible extra's in-room cell must be `dir` of SOME subject cell.
    for (const p of extras) {
      if (ctx.state.placed.has(p)) continue
      const removed = ctx.removeWhere(p, (c) => {
        if (ctx.roomOf(c) !== room) return false
        return !subjectCells.some(
          (b) => !this.clashes(ctx, b, c) && this.dirSatisfied(ctx, c, b, clue.dir),
        )
      })
      if (removed.length > 0) {
        return {
          technique: 'groupRoom',
          personId: id,
          eliminated: [{ personId: p, cells: removed }],
          explanation: {
            key: 'step.groupRoomDirExtra',
            params: { name: id, target: p, room, direction: clue.dir as string },
          },
        }
      }
    }

    // (b) a subject cell must have SOME eligible extra cell `dir` of it.
    if (!ctx.state.placed.has(id)) {
      const removed = ctx.removeWhere(id, (b) =>
        !extras.some((p) =>
          ctx.cellsOf(p).some(
            (c) =>
              ctx.roomOf(c) === room && !this.clashes(ctx, b, c) && this.dirSatisfied(ctx, c, b, clue.dir),
          ),
        ),
      )
      if (removed.length > 0) {
        return {
          technique: 'groupRoom',
          personId: id,
          eliminated: [{ personId: id, cells: removed }],
          explanation: {
            key: 'step.groupRoomDirSubject',
            params: { name: id, room, direction: clue.dir as string },
          },
        }
      }
    }
    return null
  }

  /** Prune `movable` against the placed `anchor` so the extra ends up `dir` of the
   *  subject. `anchorIsExtra` flips the comparison (subject relative to extra). */
  private applyDirection(
    ctx: SolveContext,
    anchor: PersonId,
    movable: PersonId,
    clue: AloneWithClue,
    anchorIsExtra: boolean,
  ): DeductionStep | null {
    const anchorCell = ctx.state.placed.get(anchor)
    if (anchorCell === undefined || ctx.state.placed.has(movable)) return null
    const subjectId = anchorIsExtra ? movable : anchor
    const a = ctx.board.rc(anchorCell)
    const extraSatisfies = (subject: { row: number; col: number }, extra: { row: number; col: number }): boolean => {
      if (clue.dir === 'north') return extra.row < subject.row
      if (clue.dir === 'south') return extra.row > subject.row
      if (clue.dir === 'east') return extra.col > subject.col
      return extra.col < subject.col
    }
    const removed = ctx.removeWhere(movable, (c) => {
      const m = ctx.board.rc(c)
      return anchorIsExtra ? !extraSatisfies(m, a) : !extraSatisfies(a, m)
    })
    if (removed.length === 0) return null
    return {
      technique: 'groupRoom',
      personId: subjectId,
      eliminated: [{ personId: movable, cells: removed }],
      explanation: {
        key: 'step.groupRoomDir',
        params: {
          name: subjectId,
          target: anchorIsExtra ? anchor : movable,
          direction: clue.dir as string,
        },
      },
    }
  }
}
