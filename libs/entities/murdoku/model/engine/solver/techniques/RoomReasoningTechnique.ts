import { Technique } from './Technique.ts'
import {
  AloneClue,
  AloneWithClue,
  NotAloneClue,
  RoomAttributeClue,
  RoomCompanionClue,
  RoomExistsClue,
} from '../../clues/socialClues.ts'
import { SameRoomClue } from '../../clues/relationalClues.ts'
import { SameRoomAsObjectClue } from '../../clues/objectClues.ts'
import { InRoomClue } from '../../clues/unaryClues.ts'
import { AndClue, NotClue } from '../../clues/compositeClues.ts'
import type { Clue } from '../../clues/Clue.ts'
import type { Axis, SolveContext } from '../SolveContext.ts'
import type { DeductionStep, Elimination } from '../DeductionStep.ts'
import type { Cell, Explanation, PersonId } from '../../domain/types.ts'
import type { Puzzle } from '../../domain/Puzzle.ts'

/**
 * "Alone in their room" clues that are CERTAIN (top-level or inside an AND — an OR
 * branch isn't). Each yields the one person allowed to share the room (`companion`,
 * for "alone with X"), or null when the subject must be the room's sole occupant
 * ("alone", or "alone in a room with an OBJECT" — an object is no roommate).
 */
function aloneClues(clue: Clue): { companion: PersonId | null }[] {
  if (clue instanceof AloneClue) return [{ companion: null }]
  // "In room R, alone" (inRoom + occupancy 'alone') — the subject is that room's SOLE
  // occupant, so nobody else (not even the victim) may be there. Same force as AloneClue.
  if (clue instanceof InRoomClue && clue.occupancy === 'alone') return [{ companion: null }]
  if (clue instanceof SameRoomClue && clue.alone) return [{ companion: clue.target }]
  if (clue instanceof SameRoomAsObjectClue && clue.alone) return [{ companion: null }]
  if (clue instanceof AndClue) return clue.clues.flatMap(aloneClues)
  return []
}

/** "not(some X)" is exactly "none X" and "not(none X)" is "some X", so a negated
 *  room-attribute clue reduces to the opposite quantifier. ("not all" has no single
 *  quantifier — it just means ≥1 non-matching other — so it yields nothing here.) */
function negateRoomAttribute(inner: Clue): RoomAttributeClue | null {
  if (!(inner instanceof RoomAttributeClue)) return null
  // Only the plain "≥1" some folds cleanly to none. not(≥N) is "≤N−1" and not(exactly N)
  // is "≠N" — neither is a single quantifier, so a counted/exact clue yields no forward
  // rule here (it still evaluates correctly via the generic NotClue's test()).
  if (inner.quantifier === 'some' && inner.count === 1 && !inner.exact)
    return new RoomAttributeClue('none', inner.attribute, inner.value, inner.excludeSelf)
  if (inner.quantifier === 'none')
    return new RoomAttributeClue('some', inner.attribute, inner.value, inner.excludeSelf)
  return null
}

function roomAttributes(clue: Clue): RoomAttributeClue[] {
  if (clue instanceof RoomAttributeClue) return [clue]
  // "Niemand mit X in seinem Raum" is authored as not(some X); fold the negation
  // into the equivalent quantifier so the room reasoning below sees the constraint.
  if (clue instanceof NotClue) {
    const flipped = negateRoomAttribute(clue.inner)
    return flipped ? [flipped] : []
  }
  if (clue instanceof AndClue) return clue.clues.flatMap(roomAttributes)
  return []
}

function roomCompanions(clue: Clue): RoomCompanionClue[] {
  if (clue instanceof RoomCompanionClue) return [clue]
  if (clue instanceof AndClue) return clue.clues.flatMap(roomCompanions)
  return []
}

function roomExistsList(clue: Clue): RoomExistsClue[] {
  if (clue instanceof RoomExistsClue) return [clue]
  if (clue instanceof AndClue) return clue.clues.flatMap(roomExistsList)
  return []
}

/** Certain "alone with [people] and N matching extras" clues (top-level or in an
 *  AND — an OR branch isn't certain). Shared with the group-room technique. */
export function aloneWithList(clue: Clue): AloneWithClue[] {
  if (clue instanceof AloneWithClue) return [clue]
  if (clue instanceof AndClue) return clue.clues.flatMap(aloneWithList)
  return []
}

function notAloneList(clue: Clue): NotAloneClue[] {
  if (clue instanceof NotAloneClue) return [clue]
  if (clue instanceof AndClue) return clue.clues.flatMap(notAloneList)
  return []
}

/**
 * Room-level deductions (rulebook Tip 2) for the social clues:
 * - a suspect whose every candidate lies in one room is *guaranteed* there;
 * - an "alone" suspect can't enter a room already guaranteed to someone else,
 *   and once they're guaranteed a room, everyone else leaves it;
 * - a "no one with X in my room" suspect can't enter a room guaranteed to an
 *   X-person, and once guaranteed a room, every X-person leaves it.
 */
export class RoomReasoningTechnique extends Technique {
  readonly name = 'roomReasoning'
  readonly difficulty = 4

  apply(ctx: SolveContext): DeductionStep | null {
    const guaranteed = this.guaranteedRooms(ctx)

    for (const suspect of ctx.puzzle.suspects) {
      // Room exclusivity of an "alone" suspect holds even after they're PLACED — their
      // room admits no one else — so this runs regardless of placement. The same goes
      // for the roomExists occupied-spot rule (the companion's spot stays reserved).
      for (const { companion } of suspect.clues.flatMap(aloneClues)) {
        const step = this.applyAlone(ctx, suspect.id, guaranteed, companion)
        if (step) return step
      }
      for (const re of suspect.clues.flatMap(roomExistsList)) {
        const step = this.applyRoomExists(ctx, suspect.id, re)
        if (step) return step
        const only = this.applyRoomExistsMatcher(ctx, suspect.id, re)
        if (only) return only
      }
      // The positive "not alone" rules hold even once the subject is PLACED (their room
      // is then certain), so run them before the placed-skip. Occupancy first (it can
      // pin the companion CELLS in a full permutation), then the single-companion force.
      if (suspect.clues.flatMap(notAloneList).length > 0) {
        const occ = this.applyNotAloneOccupancy(ctx, suspect.id)
        if (occ) return occ
        const force = this.applyNotAloneForce(ctx, suspect.id)
        if (force) return force
      }
      // Companion rules ("alone with N matching X") hold once the subject's room is FIXED —
      // including when they're PLACED: the unique matching companion is forced into the room,
      // and every non-matching person must leave it. (Brenda placed in the Lobby, alone with
      // one man; only George can be that man ⇒ George is in the Lobby.)
      for (const rcomp of suspect.clues.flatMap(roomCompanions)) {
        const cforce = this.applyCompanionForce(ctx, suspect.id, rcomp)
        if (cforce) return cforce
        const creserve = this.applyCompanionReserve(ctx, suspect.id, rcomp)
        if (creserve) return creserve
      }
      if (ctx.state.placed.has(suspect.id)) continue
      for (const rc of suspect.clues.flatMap(roomAttributes)) {
        if (rc.quantifier === 'none') {
          const step = this.applyRoomAttribute(ctx, suspect.id, rc, guaranteed)
          if (step) return step
          const pigeon = this.applyAttrPigeonhole(ctx, suspect.id, rc)
          if (pigeon) return pigeon
        } else if (rc.excludeSelf) {
          // 'some' → the room must hold ≥ count matching others (= count when `exact`);
          // 'all' → no non-matching other. (Only when excludeSelf, so the subject never
          // counts — otherwise a matching subject could satisfy it trivially.)
          const match = (other: PersonId) => ctx.puzzle.attributesOf(other)[rc.attribute] === rc.value
          const some = rc.quantifier === 'some'
          const step = this.applyComposition(ctx, suspect.id, {
            match,
            includeVictim: true,
            min: some ? rc.count : null,
            max: some && rc.exact ? rc.count : null,
            forbidNonMatching: rc.quantifier === 'all',
            key: some ? (rc.exact ? 'step.attrExactRoom' : 'step.attrSomeRoom') : 'step.attrAllRoom',
            attribute: rc.attribute,
            count: rc.count,
          })
          if (step) return step
          // Mirror of the companion-force rule for "≥/= N matching others": once the
          // subject's room is certain and exactly N matching SUSPECTS can fill it, every
          // free one is forced in. (G needs 2 men in room 4; only A and B can be — A is
          // certain, so B must join.) Count ≥ 2 only, so the victim never counts (it
          // shares its room with one suspect, so it can't be a second matching person).
          if (some && rc.count >= 2) {
            const force = this.applyAttrForce(ctx, suspect.id, rc)
            if (force) return force
          }
        }
      }
      for (const rcomp of suspect.clues.flatMap(roomCompanions)) {
        // "alone with `count` people matching X" — the room must hold exactly that
        // many matching others and no one else (victim excluded, like the clue).
        const match = (other: PersonId) => ctx.puzzle.attributesOf(other)[rcomp.attribute] === rcomp.value
        const step = this.applyComposition(ctx, suspect.id, {
          match,
          includeVictim: false,
          min: rcomp.count,
          max: rcomp.count,
          forbidNonMatching: true,
          key: 'step.companionRoom',
          attribute: rcomp.attribute,
          count: rcomp.count,
        })
        if (step) return step
        // force + reserve already ran above (they hold for placed subjects too).
      }
      for (const aw of suspect.clues.flatMap(aloneWithList)) {
        const step = this.applyAloneWith(ctx, suspect.id, aw)
        if (step) return step
      }
      if (suspect.clues.flatMap(notAloneList).length > 0) {
        const step = this.applyNotAlone(ctx, suspect.id)
        if (step) return step
      }
    }
    return null
  }

  /** "{subject} was NOT alone": a cell is impossible when no one else could share
   *  its room — every other person's cells there are gone or clash (same row or
   *  column as the subject's cell). E.g. Eli can't take the cowshed cell whose
   *  only possible roommate sits in the same row. */
  private applyNotAlone(ctx: SolveContext, id: PersonId): DeductionStep | null {
    const removed = ctx.removeWhere(id, (cell) => {
      const room = ctx.roomOf(cell)
      const me = ctx.board.rc(cell)
      for (const person of ctx.puzzle.people()) {
        if (person.id === id) continue
        for (const d of ctx.cellsOf(person.id)) {
          if (ctx.roomOf(d) !== room || d === cell) continue
          const p = ctx.board.rc(d)
          if (p.row !== me.row && p.col !== me.col) return false
        }
      }
      return true
    })
    if (removed.length === 0) return null
    return {
      technique: 'roomReasoning',
      personId: id,
      eliminated: [{ personId: id, cells: removed }],
      explanation: { key: 'step.notAloneRoom', params: { name: id } },
    }
  }

  /** "Not alone" needs ≥2 people in the subject's room, and in a full permutation each
   *  sits in a distinct row AND column. A still-occupiable cell of that room is therefore
   *  FORCED occupied when, without it, no two of the room's live cells have a distinct
   *  row and column — then its whole row and column are taken (cross dead for everyone).
   *  (Study cells after row 5 is reserved: {(3,4),(5,3),(5,4)}; two distinct-row/col seats
   *  only fit on {(3,4),(5,3)} ⇒ both occupied ⇒ Dennis and G fall out directly.) Sound:
   *  the real solution seats ≥2 distinct-row/col people there, all among the live cells. */
  private applyNotAloneOccupancy(ctx: SolveContext, id: PersonId): DeductionStep | null {
    if (!ctx.fullPermutation) return null
    const placed = ctx.state.placed.get(id)
    const room = placed !== undefined ? ctx.roomOf(placed) : ctx.guaranteedRoomOf(id)
    if (!room) return null
    // Cells of R someone (any suspect or the victim) can still occupy.
    const live: Cell[] = []
    for (const cell of ctx.board.cellsInRoom(room)) {
      if (ctx.puzzle.people().some((p) => ctx.cellsOf(p.id).includes(cell))) live.push(cell)
    }
    const hasDistinctPair = (cells: Cell[]): boolean => {
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const a = ctx.board.rc(cells[i])
          const b = ctx.board.rc(cells[j])
          if (a.row !== b.row && a.col !== b.col) return true
        }
      }
      return false
    }
    if (!hasDistinctPair(live)) return null
    for (const c of live) {
      if (hasDistinctPair(live.filter((x) => x !== c))) continue
      const { row, col } = ctx.board.rc(c)
      const eliminated: Elimination[] = []
      for (const p of ctx.state.unplaced()) {
        const removed = ctx.removeWhere(p, (x) => {
          if (x === c) return false
          const rc = ctx.board.rc(x)
          return rc.row === row || rc.col === col
        })
        if (removed.length > 0) eliminated.push({ personId: p, cells: removed })
      }
      if (eliminated.length > 0) {
        return {
          technique: 'roomReasoning',
          eliminated,
          explanation: { key: 'step.notAloneOccupied', params: { name: id, room, cell: c } },
        }
      }
    }
    return null
  }

  /** Positive side of "not alone": when the subject is confined to one room R and
   *  exactly ONE other person (suspect OR victim) could still be in R — nobody else
   *  is there yet — that person MUST be the companion, so drop their cells outside R.
   *  (G is not alone in the study and only Dennis can still join him ⇒ Dennis is in
   *  the study.) Sound: the only person able to satisfy "not alone" has to be there. */
  private applyNotAloneForce(ctx: SolveContext, id: PersonId): DeductionStep | null {
    const placed = ctx.state.placed.get(id)
    const room = placed !== undefined ? ctx.roomOf(placed) : ctx.guaranteedRoomOf(id)
    if (!room) return null
    const possible: PersonId[] = []
    for (const person of ctx.puzzle.people()) {
      if (person.id === id) continue
      const pc = ctx.state.placed.get(person.id)
      if (pc !== undefined) {
        if (ctx.roomOf(pc) === room) return null // a companion is already present
        continue
      }
      if (ctx.cellsOf(person.id).some((c) => ctx.roomOf(c) === room)) possible.push(person.id)
    }
    if (possible.length !== 1) return null
    const companion = possible[0]
    const removed = ctx.removeWhere(companion, (c) => ctx.roomOf(c) !== room)
    if (removed.length === 0) return null
    return {
      technique: 'roomReasoning',
      personId: companion,
      eliminated: [{ personId: companion, cells: removed }],
      explanation: { key: 'step.notAloneForce', params: { name: id, target: companion, room } },
    }
  }

  /**
   * "In {subject}'s room someone (matching X) was on/beside {object}":
   *  - the subject can't be in a room where no fitting OTHER suspect (never the
   *    victim) could take such a spot;
   *  - once the subject's room is certain and only ONE spot remains for the
   *    companion, that cell is provably OCCUPIED: the rest of its row and column
   *    is dead for everyone, only fitting companions may take the cell itself,
   *    and a sole remaining candidate is pinned onto it.
   */
  private applyRoomExists(ctx: SolveContext, id: PersonId, clue: RoomExistsClue): DeductionStep | null {
    const victim = ctx.puzzle.victim.id
    const matchers = ctx.puzzle.suspects
      .map((s) => s.id)
      .filter((p) => p !== id && p !== victim && clue.matchesPerson(ctx.puzzle, p))
    for (const room of [...ctx.roomsOf(id)]) {
      if (ctx.state.placed.has(id)) break // placed: only the spot rule below applies
      const canHold = matchers.some((m) =>
        ctx.cellsOf(m).some((c) => clue.qualifies(ctx.board, c, room)),
      )
      if (canHold) continue
      const removed = ctx.removeWhere(id, (c) => ctx.roomOf(c) === room)
      if (removed.length > 0) {
        return {
          technique: 'roomReasoning',
          personId: id,
          eliminated: [{ personId: id, cells: removed }],
          explanation: {
            key: 'step.roomExistsRoom',
            params: { name: id, room, pos: clue.posToken() },
          },
        }
      }
    }
    return this.applyRoomExistsSpot(ctx, id, clue, matchers)
  }

  /** The occupied-spot rule: subject's room certain + a single possible companion
   *  spot ⇒ the spot IS taken (e.g. the room's only chair must hold someone). */
  private applyRoomExistsSpot(
    ctx: SolveContext,
    id: PersonId,
    clue: RoomExistsClue,
    matchers: PersonId[],
  ): DeductionStep | null {
    const placed = ctx.state.placed.get(id)
    const room = placed !== undefined ? ctx.roomOf(placed) : ctx.guaranteedRoomOf(id)
    if (!room) return null

    // All cells a fitting companion could still satisfy the clue on.
    const spots = new Set<Cell>()
    const takers = new Set<PersonId>()
    for (const m of matchers) {
      for (const c of ctx.cellsOf(m)) {
        if (clue.qualifies(ctx.board, c, room)) {
          spots.add(c)
          takers.add(m)
        }
      }
    }
    if (spots.size !== 1) return null
    const spot = [...spots][0]
    const { row, col } = ctx.board.rc(spot)

    // (a) the spot is occupied → the rest of its row/column is dead for everyone,
    //     and the cell itself only fits the possible companions.
    const eliminated: Elimination[] = []
    for (const p of ctx.state.unplaced()) {
      const removed = ctx.removeWhere(p, (d) => {
        if (d === spot) return p === id || !takers.has(p)
        const rc = ctx.board.rc(d)
        return rc.row === row || rc.col === col
      })
      if (removed.length > 0) eliminated.push({ personId: p, cells: removed })
    }
    if (eliminated.length > 0) {
      return {
        technique: 'roomReasoning',
        personId: id,
        eliminated,
        explanation: {
          key: 'step.roomExistsSpot',
          params: { name: id, room, pos: clue.posToken(), cell: spot },
        },
      }
    }

    // (b) only one candidate left for the occupied spot → they sit there.
    const candidates = [...takers].filter(
      (m) => !ctx.state.placed.has(m) && ctx.state.domain(m).has(spot),
    )
    if (candidates.length === 1) {
      const m = candidates[0]
      const removed = ctx.removeWhere(m, (d) => d !== spot)
      if (removed.length > 0) {
        return {
          technique: 'roomReasoning',
          personId: id,
          eliminated: [{ personId: m, cells: removed }],
          explanation: {
            key: 'step.roomExistsOccupant',
            params: { name: id, target: m, room, pos: clue.posToken(), cell: spot },
          },
        }
      }
    }
    return null
  }

  /**
   * roomExists with a UNIQUE possible matcher (subject's room still open): if exactly
   * ONE other person can play the "someone (with X) at <spot>" role — everyone else is
   * ruled out by their own clue (an "alone (with someone else)" person can't share the
   * subject's room) or can't reach a qualifying cell in a room the subject can be in —
   * then that matcher must stand with the subject. Confines the subject to the rooms
   * where the matcher qualifies, and the matcher to its qualifying cells there. Pure
   * forward logic (no trial): the clue NEEDS a matcher, and only this one can be it.
   */
  private applyRoomExistsMatcher(
    ctx: SolveContext,
    id: PersonId,
    clue: RoomExistsClue,
  ): DeductionStep | null {
    if (ctx.state.placed.has(id)) return null // room known → the spot rules handle it
    const victim = ctx.puzzle.victim.id
    const subjectRooms = ctx.roomsOf(id)
    // Rooms (within the subject's still-possible rooms) where `m` could stand on a
    // qualifying cell — the rooms in which m could play the matcher beside the subject.
    const qualRooms = (m: PersonId): Set<string> => {
      const rooms = new Set<string>()
      for (const cell of ctx.cellsOf(m)) {
        const room = ctx.roomOf(cell)
        if (subjectRooms.has(room) && clue.qualifies(ctx.board, cell, room)) rooms.add(room)
      }
      return rooms
    }
    let only: { m: PersonId; rooms: Set<string> } | null = null
    for (const suspect of ctx.puzzle.suspects) {
      const m = suspect.id
      if (m === id || m === victim || !clue.matchesPerson(ctx.puzzle, m)) continue
      // An "alone" / "alone with someone other than the subject" matcher can't share
      // the subject's room, so it can never be the someone there.
      if (suspect.clues.flatMap(aloneClues).some((a) => a.companion !== id)) continue
      // A PLACED matcher has no domain to confine. If it already qualifies in a room the
      // subject could share, the clue may be met by it, so the "unique matcher" inference
      // is unsafe → bail; otherwise it's irrelevant here → skip it.
      const placedCell = ctx.state.placed.get(m)
      if (placedCell !== undefined) {
        const room = ctx.roomOf(placedCell)
        if (subjectRooms.has(room) && clue.qualifies(ctx.board, placedCell, room)) return null
        continue
      }
      const rooms = qualRooms(m)
      if (rooms.size === 0) continue
      if (only) return null // ≥2 possible matchers → can't pin
      only = { m, rooms }
    }
    if (!only) return null

    const eliminated: Elimination[] = []
    const removedSubj = ctx.removeWhere(id, (c) => !only!.rooms.has(ctx.roomOf(c)))
    if (removedSubj.length > 0) eliminated.push({ personId: id, cells: removedSubj })
    const removedMate = ctx.removeWhere(only.m, (c) => {
      const room = ctx.roomOf(c)
      return !(only!.rooms.has(room) && clue.qualifies(ctx.board, c, room))
    })
    if (removedMate.length > 0) eliminated.push({ personId: only.m, cells: removedMate })
    if (eliminated.length === 0) return null
    return {
      technique: 'roomReasoning',
      personId: id,
      eliminated,
      explanation: {
        key: 'step.roomExistsOnlyMatcher',
        params: { name: id, target: only.m, pos: clue.posToken() },
      },
    }
  }

  /**
   * "{subject} was alone with [people] and N matching others": the named people share
   * the subject's room, and once that room is fixed no one else may be there except the
   * named people and (matching) extras — so the victim and any non-matching, non-named
   * suspect leave it.
   */
  private applyAloneWith(ctx: SolveContext, id: PersonId, clue: AloneWithClue): DeductionStep | null {
    const victim = ctx.puzzle.victim.id
    const matches = (p: PersonId) => ctx.puzzle.attributesOf(p)[clue.attribute] === clue.value

    // (1) Each named person shares the subject's room (mutual room confinement).
    const subjRooms = ctx.roomsOf(id)
    for (const p of clue.people) {
      if (ctx.state.placed.has(p)) continue
      const pRooms = ctx.roomsOf(p)
      const removedS = ctx.removeWhere(id, (c) => !pRooms.has(ctx.roomOf(c)))
      if (removedS.length > 0) {
        return this.step(id, id, removedS, 'step.aloneWithRoom', { name: id })
      }
      const removedP = ctx.removeWhere(p, (c) => !subjRooms.has(ctx.roomOf(c)))
      if (removedP.length > 0) {
        return this.step(id, p, removedP, 'step.aloneWithRoom', { name: p })
      }
    }

    // (2) Once the subject's room is known, only the named people and matching extras
    // may share it — the victim and any non-matching non-named suspect are out.
    const room = ctx.guaranteedRoomOf(id)
    if (room) {
      const allowed = new Set<PersonId>([id, ...clue.people])
      const eliminated: Elimination[] = []
      for (const other of ctx.state.unplaced()) {
        if (allowed.has(other)) continue
        if (other === victim || !matches(other)) {
          const removed = ctx.removeWhere(other, (c) => ctx.roomOf(c) === room)
          if (removed.length > 0) eliminated.push({ personId: other, cells: removed })
        }
      }
      if (eliminated.length > 0) {
        return {
          technique: 'roomReasoning',
          personId: id,
          eliminated,
          explanation: { key: 'step.aloneWithReserve', params: { name: id, room } },
        }
      }
    }
    return null
  }

  /**
   * Positive companion rule: the subject is confined to room R and was alone with EXACTLY
   * `count` others matching X. If exactly that many matching suspects can still be in R,
   * every one of them MUST be there — the unique possible companion is forced into the room.
   * ("Elsa ist in der Lobby, allein mit genau einer Frau; nur Dalia kann auch dorthin →
   * Dalia muss in die Lobby.") The mirror of applyComposition's negative elimination.
   */
  private applyCompanionForce(
    ctx: SolveContext,
    id: PersonId,
    rcomp: RoomCompanionClue,
  ): DeductionStep | null {
    // Their room is fixed whether they're PLACED or their whole domain lies in one room.
    const placedCell = ctx.state.placed.get(id)
    const room = placedCell !== undefined ? ctx.roomOf(placedCell) : ctx.guaranteedRoomOf(id)
    if (!room) return null
    const victim = ctx.puzzle.victim.id
    const matches = (o: PersonId): boolean =>
      o !== id && o !== victim && ctx.puzzle.attributesOf(o)[rcomp.attribute] === rcomp.value

    // Count matching suspects already certain in R, and those that could still be there.
    let already = 0
    const free: PersonId[] = []
    for (const s of ctx.puzzle.suspects) {
      const o = s.id
      if (!matches(o)) continue
      const placed = ctx.state.placed.get(o)
      if (placed !== undefined) {
        if (ctx.roomOf(placed) === room) already++
        continue
      }
      if (![...ctx.state.domain(o)].some((c) => ctx.roomOf(c) === room)) continue
      if (ctx.guaranteedRoomOf(o) === room) already++
      else free.push(o)
    }
    // Exactly `count` matching suspects can fill the slots → every free one must take it.
    if (already + free.length !== rcomp.count || free.length === 0) return null
    for (const o of free) {
      const removed = ctx.removeWhere(o, (c) => ctx.roomOf(c) !== room)
      if (removed.length > 0) {
        return {
          technique: 'roomReasoning',
          personId: o,
          eliminated: [{ personId: o, cells: removed }],
          explanation: { key: 'step.companionForce', params: { name: id, target: o, room, count: rcomp.count } },
        }
      }
    }
    return null
  }

  /**
   * Force rule for "≥/= `count` matching others in my room" (count ≥ 2): once the subject
   * is confined to room R, count the matching SUSPECTS already certain in R and those that
   * could still be there. If together they exactly meet `count`, every still-free one MUST
   * be in R (losing any would drop below the required count) — so confine them to R. The
   * victim is never counted (it shares its room with exactly one suspect).
   */
  private applyAttrForce(
    ctx: SolveContext,
    id: PersonId,
    rc: RoomAttributeClue,
  ): DeductionStep | null {
    const room = ctx.guaranteedRoomOf(id)
    if (!room) return null
    const victim = ctx.puzzle.victim.id
    const matches = (o: PersonId): boolean =>
      o !== id && o !== victim && ctx.puzzle.attributesOf(o)[rc.attribute] === rc.value

    let already = 0
    const free: PersonId[] = []
    for (const s of ctx.puzzle.suspects) {
      const o = s.id
      if (!matches(o)) continue
      const placed = ctx.state.placed.get(o)
      if (placed !== undefined) {
        if (ctx.roomOf(placed) === room) already++
        continue
      }
      if (![...ctx.state.domain(o)].some((c) => ctx.roomOf(c) === room)) continue
      if (ctx.guaranteedRoomOf(o) === room) already++
      else free.push(o)
    }
    if (already + free.length !== rc.count || free.length === 0) return null
    for (const o of free) {
      const removed = ctx.removeWhere(o, (c) => ctx.roomOf(c) !== room)
      if (removed.length > 0) {
        return {
          technique: 'roomReasoning',
          personId: o,
          eliminated: [{ personId: o, cells: removed }],
          explanation: {
            key: 'step.attrForce',
            params: { name: id, target: o, room, count: rc.count },
          },
        }
      }
    }
    return null
  }

  /**
   * Reserve an "alone with `count` matching" subject's room: once the subject is confined
   * to room R, R holds ONLY the subject and (matching) companions — so the victim and every
   * NON-matching suspect must leave R. (Mirror of the "alone" reserve, for "alone with X".)
   */
  private applyCompanionReserve(
    ctx: SolveContext,
    id: PersonId,
    rcomp: RoomCompanionClue,
  ): DeductionStep | null {
    const placedCell = ctx.state.placed.get(id)
    const room = placedCell !== undefined ? ctx.roomOf(placedCell) : ctx.guaranteedRoomOf(id)
    if (!room) return null
    const victim = ctx.puzzle.victim.id
    const eliminated: Elimination[] = []
    for (const other of ctx.state.unplaced()) {
      if (other === id) continue
      const isMatch =
        other !== victim && ctx.puzzle.attributesOf(other)[rcomp.attribute] === rcomp.value
      if (isMatch) continue // a matching companion may legitimately share the room
      const removed = ctx.removeWhere(other, (c) => ctx.roomOf(c) === room)
      if (removed.length > 0) eliminated.push({ personId: other, cells: removed })
    }
    if (eliminated.length === 0) return null
    return {
      technique: 'roomReasoning',
      personId: id,
      eliminated,
      explanation: { key: 'step.companionReserve', params: { name: id, room } },
    }
  }

  /** Small helper to build a single-person elimination step. */
  private step(
    subject: PersonId,
    person: PersonId,
    cells: Cell[],
    key: string,
    params: Record<string, string | number>,
  ): DeductionStep {
    return {
      technique: 'roomReasoning',
      personId: subject,
      eliminated: [{ personId: person, cells }],
      explanation: { key, params },
    }
  }

  override relevant(puzzle: Puzzle): boolean {
    for (const suspect of puzzle.suspects) {
      for (const clue of suspect.clues) {
        if (
          aloneClues(clue).length > 0 ||
          roomAttributes(clue).length > 0 ||
          roomCompanions(clue).length > 0 ||
          roomExistsList(clue).length > 0 ||
          aloneWithList(clue).length > 0 ||
          notAloneList(clue).length > 0
        ) {
          return true
        }
      }
    }
    return false
  }

  /**
   * Eliminate rooms whose occupancy can't satisfy a "companions in my room" rule:
   *  - `forbidNonMatching` & a non-matching other is SURELY there → out;
   *  - more than `max` matching others SURELY there → out;
   *  - even with every still-possible matching other, fewer than `min` → out.
   * "Surely there" = placed in the room OR unplaced with every candidate cell in it —
   * both are in the room in every solution (e.g. Greta placed in the Restaurant plus
   * Bella confined to it already make "alone with exactly one man" impossible there).
   * Victim handling matches the clue (`includeVictim`). Sound: only eliminates a room
   * that is ALREADY impossible, never one that merely might fail.
   */
  private applyComposition(
    ctx: SolveContext,
    id: PersonId,
    opts: {
      match: (other: PersonId) => boolean
      includeVictim: boolean
      min: number | null
      max: number | null
      forbidNonMatching: boolean
      key: string
      attribute: string
      count?: number
    },
  ): DeductionStep | null {
    const victim = ctx.puzzle.victim.id
    const counts = (pid: PersonId): boolean =>
      pid !== id && (opts.includeVictim || pid !== victim)
    for (const room of [...ctx.roomsOf(id)]) {
      let placedMatch = 0
      let placedBad = 0
      for (const [pid, pc] of ctx.state.placed) {
        if (!counts(pid) || ctx.roomOf(pc) !== room) continue
        if (opts.match(pid)) placedMatch++
        else placedBad++
      }
      let sureMatch = 0
      let sureBad = 0
      let couldMatch = 0
      for (const o of ctx.state.unplaced()) {
        if (!counts(o)) continue
        if (opts.match(o) && [...ctx.state.domain(o)].some((c) => ctx.roomOf(c) === room)) {
          couldMatch++
        }
        if (ctx.guaranteedRoomOf(o) !== room) continue
        if (opts.match(o)) sureMatch++
        else sureBad++
      }
      // Placed-only violations keep their established wording; violations that need the
      // CONFINED (guaranteed) occupants get the "surely already N others" wording.
      const placedInvalid =
        (opts.forbidNonMatching && placedBad > 0) ||
        (opts.max !== null && placedMatch > opts.max) ||
        (opts.min !== null && placedMatch + couldMatch < opts.min)
      const sureInvalid =
        !placedInvalid &&
        ((opts.forbidNonMatching && sureBad > 0) ||
          (opts.max !== null && placedMatch + sureMatch > opts.max))
      if (!placedInvalid && !sureInvalid) continue
      const removed = ctx.removeWhere(id, (c) => ctx.roomOf(c) === room)
      if (removed.length > 0) {
        const busy = sureInvalid && opts.key === 'step.companionRoom'
        return {
          technique: 'roomReasoning',
          personId: id,
          eliminated: [{ personId: id, cells: removed }],
          explanation: {
            key: busy ? 'step.companionRoomBusy' : opts.key,
            params: {
              name: id,
              room,
              attribute: opts.attribute,
              count: opts.count ?? 1,
              sure: placedMatch + placedBad + sureMatch + sureBad,
            },
          },
        }
      }
    }
    return null
  }

  /** Room each person is guaranteed to be in (placed cell, or confined domain). */
  private guaranteedRooms(ctx: SolveContext): Map<PersonId, string> {
    const guaranteed = new Map<PersonId, string>()
    for (const [id, cell] of ctx.state.placed) guaranteed.set(id, ctx.roomOf(cell))
    for (const id of ctx.state.unplaced()) {
      const room = ctx.guaranteedRoomOf(id)
      if (room) guaranteed.set(id, room)
    }
    return guaranteed
  }

  private applyAlone(
    ctx: SolveContext,
    id: PersonId,
    guaranteed: Map<PersonId, string>,
    companion: PersonId | null,
  ): DeductionStep | null {
    // Already placed: the only thing left to enforce is that their room admits no one
    // else (the companion excepted). `place()` clears just the row/column/cell, so the
    // rest of the room must still be vacated here.
    const placedCell = ctx.state.placed.get(id)
    if (placedCell !== undefined) {
      const room = ctx.roomOf(placedCell)
      const eliminated = this.removeRoomFromOthers(ctx, id, room, (other) => other !== companion)
      return eliminated.length > 0
        ? {
            technique: 'roomReasoning',
            personId: id,
            eliminated,
            explanation: { key: 'step.aloneReserve', params: { name: id, room } },
          }
        : null
    }

    // The subject can't sit in a room already guaranteed to someone else — except
    // the companion they're explicitly alone WITH (that shared room is the point).
    for (const [otherId, room] of guaranteed) {
      if (otherId === id || otherId === companion) continue
      const removed = ctx.removeWhere(id, (c) => ctx.roomOf(c) === room)
      if (removed.length > 0) {
        return {
          technique: 'roomReasoning',
          personId: id,
          eliminated: [{ personId: id, cells: removed }],
          explanation: { key: 'step.aloneExcludeRoom', params: { name: id, room } },
        }
      }
    }

    // (I) Capacity: in a full permutation each row/column has exactly one occupant, so
    // a row/column lying ENTIRELY within a room guarantees an occupant there. A
    // SOLE-occupant "alone" suspect can't share, so they're excluded from a room that
    // is forced to hold someone else:
    //   - a covered line they have NO candidate in (its occupant is someone else), OR
    //   - two or more covered lines of one axis (≥2 distinct occupants — e.g. the Suite
    //     spans whole columns 3 and 4, so it always holds two people; Bernd can't be
    //     alone there). (Skipped with a companion: the room may legitimately hold both.)
    if (companion === null && ctx.fullPermutation) {
      for (const room of ctx.roomsOf(id)) {
        const occupies = (axis: Axis, line: number) =>
          [...ctx.state.domain(id)].some((c) => ctx.axisOf(c, axis) === line)
        for (const axis of ['row', 'col'] as Axis[]) {
          const full = ctx.fullLinesIn(room, axis)
          const forcedOther = full.some((line) => !occupies(axis, line))
          if (full.length < 2 && !forcedOther) continue
          const removed = ctx.removeWhere(id, (c) => ctx.roomOf(c) === room)
          if (removed.length > 0) {
            return {
              technique: 'roomReasoning',
              personId: id,
              eliminated: [{ personId: id, cells: removed }],
              explanation: {
                key: 'step.aloneExcludeLine',
                params: { name: id, room, line: axis, num: (full[0] ?? 0) + 1 },
              },
            }
          }
        }
      }
    }

    const myRoom = ctx.guaranteedRoomOf(id)
    if (myRoom) {
      // Once the subject is pinned to a room, everyone else leaves it — except the
      // companion they're alone with (who belongs there too).
      const eliminated = this.removeRoomFromOthers(ctx, id, myRoom, (other) => other !== companion)
      if (eliminated.length > 0) {
        return {
          technique: 'roomReasoning',
          personId: id,
          eliminated,
          explanation: { key: 'step.aloneReserve', params: { name: id, room: myRoom } },
        }
      }
    }
    return null
  }

  /** Explanation for a "no one with X in my room" elimination. Gender reads as
   *  "darf keine Frau sein" (own `*Gender` wording via `who`/`whoNeg`); other traits
   *  reuse the "{{attribute}} haben" wording with the value-encoded trait token. */
  private attrStep(baseKey: string, id: PersonId, room: string, rc: RoomAttributeClue): Explanation {
    if (rc.attribute === 'gender') {
      return {
        key: `${baseKey}Gender`,
        params: { name: id, room, who: `${rc.value}_nom`, whoNeg: `${rc.value}_nom_neg` },
      }
    }
    const token = rc.value === true ? rc.attribute : `${rc.attribute}_${rc.value}`
    return { key: baseKey, params: { name: id, room, attribute: token } }
  }

  private applyRoomAttribute(
    ctx: SolveContext,
    id: PersonId,
    rc: RoomAttributeClue,
    guaranteed: Map<PersonId, string>,
  ): DeductionStep | null {
    const matches = (other: PersonId): boolean =>
      ctx.puzzle.attributesOf(other)[rc.attribute] === rc.value

    for (const [otherId, room] of guaranteed) {
      if (otherId === id || !matches(otherId)) continue
      const removed = ctx.removeWhere(id, (c) => ctx.roomOf(c) === room)
      if (removed.length > 0) {
        return {
          technique: 'roomReasoning',
          personId: id,
          eliminated: [{ personId: id, cells: removed }],
          explanation: this.attrStep('step.attrExcludeRoom', id, room, rc),
        }
      }
    }
    const myRoom = ctx.guaranteedRoomOf(id)
    if (myRoom) {
      const eliminated = this.removeRoomFromOthers(ctx, id, myRoom, matches)
      if (eliminated.length > 0) {
        return {
          technique: 'roomReasoning',
          personId: id,
          eliminated,
          explanation: this.attrStep('step.attrReserve', id, myRoom, rc),
        }
      }
    }
    return null
  }

  /**
   * (II) Capacity pigeonhole for a "no one with X in my room" suspect: if the people
   * who HAVE X are collectively confined to a set of rooms whose members other than R
   * can't hold them all, then R is forced to contain an X-person — so the subject
   * can't enter R. Generalises the single-person guaranteed-room exclusion to the
   * case where no individual is pinned but the group as a whole overflows.
   */
  private applyAttrPigeonhole(
    ctx: SolveContext,
    id: PersonId,
    rc: RoomAttributeClue,
  ): DeductionStep | null {
    if (!ctx.fullPermutation) return null
    const matchers = ctx.state
      .unplaced()
      .filter((p) => p !== id && ctx.puzzle.attributesOf(p)[rc.attribute] === rc.value)
      .map((p) => ({ rooms: ctx.roomsOf(p) }))
    if (matchers.length === 0) return null

    // The room universe to combine — every room any matcher can still be in. Room
    // counts are tiny; guard the 2^n subset scan anyway for unusually large maps.
    const universe = new Set<string>()
    for (const m of matchers) for (const r of m.rooms) universe.add(r)
    if (universe.size > 12) return null
    const roomList = [...universe]

    for (const target of ctx.roomsOf(id)) {
      if (!universe.has(target)) continue
      for (let mask = 0; mask < 1 << roomList.length; mask++) {
        const set = new Set<string>()
        for (let i = 0; i < roomList.length; i++) if (mask & (1 << i)) set.add(roomList[i])
        if (!set.has(target)) continue
        const group = matchers.filter((m) => [...m.rooms].every((r) => set.has(r)))
        if (group.length === 0) continue
        const others = [...set].filter((r) => r !== target)
        if (group.length <= ctx.roomsCapacity(others)) continue
        const removed = ctx.removeWhere(id, (c) => ctx.roomOf(c) === target)
        if (removed.length > 0) {
          return {
            technique: 'roomReasoning',
            personId: id,
            eliminated: [{ personId: id, cells: removed }],
            explanation: this.attrStep('step.attrPigeonhole', id, target, rc),
          }
        }
      }
    }
    return null
  }

  private removeRoomFromOthers(
    ctx: SolveContext,
    id: PersonId,
    room: string,
    predicate: (other: PersonId) => boolean,
  ): Elimination[] {
    const eliminated: Elimination[] = []
    for (const other of ctx.state.unplaced()) {
      if (other === id || !predicate(other)) continue
      const removed = ctx.removeWhere(other, (c) => ctx.roomOf(c) === room)
      if (removed.length > 0) eliminated.push({ personId: other, cells: removed })
    }
    return eliminated
  }
}
