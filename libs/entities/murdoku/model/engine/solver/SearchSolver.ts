import { Solution } from '../domain/Solution.ts'
import { DirectionClue, OffsetClue, SameRoomClue } from '../clues/relationalClues.ts'
import {
  AloneClue,
  RoomAttributeClue,
  RoomCompanionClue,
  RoomExistsClue,
} from '../clues/socialClues.ts'
import { AndClue } from '../clues/compositeClues.ts'
import type { Clue } from '../clues/Clue.ts'
import { VICTIM_ID } from '../domain/types.ts'
import type { AttributeValue, Cell, PersonId } from '../domain/types.ts'
import type { Person, Puzzle } from '../domain/Puzzle.ts'

function popcount(n: number): number {
  n = n - ((n >>> 1) & 0x55555555)
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333)
  return (((n + (n >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24
}

/** A fixed-size bitset over cell indices — the fast candidate representation. */
class BitSet {
  readonly words: Uint32Array

  constructor(words: Uint32Array) {
    this.words = words
  }

  static empty(size: number): BitSet {
    return new BitSet(new Uint32Array((size + 31) >>> 5))
  }

  clone(): BitSet {
    return new BitSet(this.words.slice())
  }

  add(i: number): void {
    this.words[i >>> 5] |= 1 << (i & 31)
  }

  remove(i: number): void {
    this.words[i >>> 5] &= ~(1 << (i & 31))
  }

  and(other: BitSet): void {
    const a = this.words
    const b = other.words
    for (let k = 0; k < a.length; k++) a[k] &= b[k]
  }

  andNot(other: BitSet): void {
    const a = this.words
    const b = other.words
    for (let k = 0; k < a.length; k++) a[k] &= ~b[k]
  }

  isEmpty(): boolean {
    for (const w of this.words) if (w !== 0) return false
    return true
  }

  count(): number {
    let c = 0
    for (const w of this.words) c += popcount(w)
    return c
  }

  forEach(fn: (cell: number) => void): void {
    const words = this.words
    for (let k = 0; k < words.length; k++) {
      let bits = words[k] | 0
      while (bits !== 0) {
        const lowest = bits & -bits
        fn((k << 5) + (31 - Math.clz32(lowest)))
        bits ^= lowest
      }
    }
  }
}

interface RelationalLink {
  clue: Clue
  target: PersonId
}

function relationalLinks(clue: Clue): RelationalLink[] {
  if (clue instanceof DirectionClue || clue instanceof OffsetClue) {
    return [{ clue, target: clue.target }]
  }
  if (clue instanceof SameRoomClue) return [{ clue, target: clue.target }]
  if (clue instanceof AndClue) return clue.clues.flatMap(relationalLinks)
  return []
}

function roomExistsClues(clue: Clue): RoomExistsClue[] {
  if (clue instanceof RoomExistsClue) return [clue]
  if (clue instanceof AndClue) return clue.clues.flatMap(roomExistsClues)
  return []
}

/** A clue that restricts who else may be in the subject's room. */
type Restrictor =
  | { kind: 'alone' }
  | { kind: 'attrNone'; attribute: string; value: AttributeValue }
  | { kind: 'companion'; count: number; attribute: string; value: AttributeValue }

function restrictors(clue: Clue): Restrictor[] {
  if (clue instanceof AloneClue) return [{ kind: 'alone' }]
  if (clue instanceof RoomAttributeClue && clue.quantifier === 'none') {
    return [{ kind: 'attrNone', attribute: clue.attribute, value: clue.value }]
  }
  if (clue instanceof RoomCompanionClue) {
    return [{ kind: 'companion', count: clue.count, attribute: clue.attribute, value: clue.value }]
  }
  if (clue instanceof AndClue) return clue.clues.flatMap(restrictors)
  return []
}

/**
 * Uniqueness oracle + answer key — a lean bitset backtracker. Branches on the
 * most-constrained person first; placing someone clears their row/column/cell
 * from everyone else with one bitwise AND of a precomputed mask (forward
 * checking), narrows relational clues whose target was just placed, prunes
 * dead "man on a chair in my room" rooms, and asks every clue whether it is
 * already broken. A full clue check at each leaf guarantees correctness.
 */
export class SearchSolver {
  /** forbid[cell] = every cell in the same row or column (incl. itself). */
  private readonly forbid: BitSet[]
  private readonly initialDomains = new Map<PersonId, BitSet>()
  private readonly links = new Map<PersonId, RelationalLink[]>()
  private readonly roomExists: { subjectId: PersonId; clue: RoomExistsClue }[] = []
  private readonly roomMask = new Map<string, BitSet>()
  private readonly roomRestrictors = new Map<PersonId, Restrictor[]>()
  private readonly n: number
  /** Number of search nodes visited by the last search (diagnostics). */
  nodes = 0
  /** True when the last search stopped on its node budget — the result is then a
   *  lower bound ("found so far"), NOT a verdict. Degenerate boards (e.g. a single
   *  room, where the murder rule can never hold) would otherwise search forever
   *  proving 0 solutions. */
  aborted = false

  constructor(private readonly puzzle: Puzzle) {
    const board = puzzle.board
    const n = board.width * board.height
    this.n = n

    this.forbid = new Array<BitSet>(n)
    for (let cell = 0; cell < n; cell++) {
      const mask = BitSet.empty(n)
      const { row, col } = board.rc(cell)
      for (let c = 0; c < board.width; c++) mask.add(board.idx(row, c))
      for (let r = 0; r < board.height; r++) mask.add(board.idx(r, col))
      this.forbid[cell] = mask
    }

    for (let cell = 0; cell < n; cell++) {
      const room = board.roomIdOf(cell)
      let mask = this.roomMask.get(room)
      if (!mask) {
        mask = BitSet.empty(n)
        this.roomMask.set(room, mask)
      }
      mask.add(cell)
    }

    const occupiable = BitSet.empty(n)
    for (const cell of board.occupiableCells()) occupiable.add(cell)

    for (const person of puzzle.people()) {
      const domain = occupiable.clone()
      for (const clue of person.clues) {
        const candidates = clue.candidateCells(board)
        if (candidates) {
          const mask = BitSet.empty(n)
          for (const cell of candidates) mask.add(cell)
          domain.and(mask)
        }
      }
      this.initialDomains.set(person.id, domain)
    }

    for (const suspect of puzzle.suspects) {
      const links = suspect.clues.flatMap(relationalLinks)
      if (links.length > 0) this.links.set(suspect.id, links)
      for (const clue of suspect.clues.flatMap(roomExistsClues)) {
        this.roomExists.push({ subjectId: suspect.id, clue })
      }
      const rs = suspect.clues.flatMap(restrictors)
      if (rs.length > 0) this.roomRestrictors.set(suspect.id, rs)
    }
  }

  isUnique(): boolean {
    return this.countSolutions(2) === 1
  }

  /** True if at least one full solution exists with the given people fixed to cells. */
  hasSolutionWith(forced: ReadonlyMap<PersonId, Cell>): boolean {
    let found = false
    this.search(() => {
      found = true
      return true
    }, forced)
    return found
  }

  countSolutions(limit = 2, budget = Infinity): number {
    let count = 0
    this.search(() => {
      count++
      return count >= limit
    }, undefined, budget)
    return count
  }

  firstSolution(budget = Infinity): Solution | null {
    let found: Solution | null = null
    this.search((solution) => {
      found = solution
      return true
    }, undefined, budget)
    return found
  }

  /** All solutions (up to `limit`) — for inspecting whether a level is truly unique. */
  allSolutions(limit = 100): Solution[] {
    const out: Solution[] = []
    this.search((solution) => {
      out.push(solution)
      return out.length >= limit
    })
    return out
  }

  private search(
    onSolution: (solution: Solution) => boolean,
    forced?: ReadonlyMap<PersonId, Cell>,
    budget = Infinity,
  ): void {
    const people = this.puzzle.people()
    const domains = new Map<PersonId, BitSet>()
    for (const person of people) {
      const dom = this.initialDomains.get(person.id)!.clone()
      const cell = forced?.get(person.id)
      if (cell !== undefined) {
        // Pin this person to the single cell; the recursion places them first and
        // forward-checks the rest. An out-of-domain cell empties it → no solution.
        const only = BitSet.empty(this.n)
        only.add(cell)
        dom.and(only)
      }
      domains.set(person.id, dom)
    }
    const placement = new Map<PersonId, Cell>()
    this.nodes = 0
    this.aborted = false

    const anyViolated = (): boolean => {
      for (const suspect of this.puzzle.suspects) {
        for (const clue of suspect.clues) {
          if (clue.violatedBy(suspect.id, placement, this.puzzle)) return true
        }
      }
      return false
    }

    const allCluesHold = (solution: Solution): boolean => {
      for (const person of people) {
        for (const clue of person.clues) {
          if (!clue.test(person.id, solution, this.puzzle)) return false
        }
      }
      return true
    }

    const boardCluesHold = (solution: Solution): boolean => {
      for (const clue of this.puzzle.boardClues) {
        if (!clue.test(solution, this.puzzle)) return false
      }
      return true
    }

    // The core rule of every case: the victim was ALONE with the murderer, so the
    // victim's room must hold exactly one suspect. Solutions that put 0 or ≥2
    // suspects with the victim are not valid scenarios.
    const board = this.puzzle.board
    const murderAlone = (): boolean => {
      const victimRoom = board.roomIdOf(placement.get(VICTIM_ID)!)
      let withVictim = 0
      for (const suspect of this.puzzle.suspects) {
        if (board.roomIdOf(placement.get(suspect.id)!) === victimRoom && ++withVictim > 1) {
          return false
        }
      }
      return withVictim === 1
    }

    const recurse = (): boolean => {
      // Out of budget → unwind the whole search ("stop") without reporting a solution.
      if (this.nodes >= budget) {
        this.aborted = true
        return true
      }
      this.nodes++
      let pick: PersonId | null = null
      let best = Infinity
      for (const person of people) {
        if (placement.has(person.id)) continue
        const size = domains.get(person.id)!.count()
        if (size < best) {
          best = size
          pick = person.id
        }
      }

      if (pick === null) {
        const solution = new Solution(new Map(placement))
        return allCluesHold(solution) && murderAlone() && boardCluesHold(solution) && onSolution(solution)
      }
      if (best === 0) return false

      const cells: number[] = []
      domains.get(pick)!.forEach((c) => cells.push(c))

      for (const cell of cells) {
        placement.set(pick, cell)

        // Clone-on-write every unplaced domain, then forward-check by masking.
        const saved: Array<[PersonId, BitSet]> = []
        for (const person of people) {
          if (person.id === pick || placement.has(person.id)) continue
          const original = domains.get(person.id)!
          saved.push([person.id, original])
          domains.set(person.id, original.clone())
        }

        let dead = false
        const forbidMask = this.forbid[cell]
        for (const [id] of saved) {
          const domain = domains.get(id)!
          domain.andNot(forbidMask)
          if (domain.isEmpty()) dead = true
        }
        if (!dead) dead = this.propagateRelational(pick, domains, placement)
        if (!dead) dead = this.propagateRoomConstraints(pick, people, domains, placement)
        if (!dead && !this.roomExistsFeasible(placement, domains)) dead = true

        const stop = !dead && !anyViolated() && recurse()

        for (const [id, original] of saved) domains.set(id, original)
        placement.delete(pick)
        if (stop) return true
      }
      return false
    }

    recurse()
  }

  /**
   * Both directions of every relational clue touching the just-placed person:
   * narrow each subject whose target is now placed, AND narrow the targets of
   * the just-placed person's own clues. Returns true if any domain emptied.
   */
  private propagateRelational(
    placedId: PersonId,
    domains: Map<PersonId, BitSet>,
    placement: Map<PersonId, Cell>,
  ): boolean {
    let dead = false
    // Subjects whose target was just placed → narrow the subject.
    for (const [subjectId, links] of this.links) {
      if (placement.has(subjectId)) continue
      const clues = links.filter((link) => link.target === placedId).map((link) => link.clue)
      if (clues.length > 0 && this.narrow(subjectId, subjectId, clues, domains, placement)) {
        dead = true
      }
    }
    // The just-placed person is a subject → narrow its still-open targets.
    for (const link of this.links.get(placedId) ?? []) {
      if (placement.has(link.target)) continue
      if (this.narrow(link.target, placedId, [link.clue], domains, placement)) dead = true
    }
    return dead
  }

  /** Remove from `personId`'s domain every cell that breaks `clues` (whose
   *  subject is `subjectId`, with everyone else already placed). Returns empty. */
  private narrow(
    personId: PersonId,
    subjectId: PersonId,
    clues: Clue[],
    domains: Map<PersonId, BitSet>,
    placement: Map<PersonId, Cell>,
  ): boolean {
    const domain = domains.get(personId)!
    const toRemove: number[] = []
    domain.forEach((candidate) => {
      placement.set(personId, candidate)
      const broken = clues.some((clue) => clue.violatedBy(subjectId, placement, this.puzzle))
      placement.delete(personId)
      if (broken) toRemove.push(candidate)
    })
    for (const candidate of toRemove) domain.remove(candidate)
    return domain.isEmpty()
  }

  /**
   * Strike rooms for "alone" / "no X in my room" / "alone with N matching".
   * Re-runs for the just-placed person AND any restricting subject already in
   * the room the placement just touched (so the Nth match closes the room).
   */
  private propagateRoomConstraints(
    pick: PersonId,
    people: Person[],
    domains: Map<PersonId, BitSet>,
    placement: Map<PersonId, Cell>,
  ): boolean {
    if (this.roomRestrictors.size === 0) return false
    const board = this.puzzle.board
    const pickRoom = board.roomIdOf(placement.get(pick)!)

    const subjects = new Set<PersonId>()
    if (this.roomRestrictors.has(pick)) subjects.add(pick)
    for (const subjectId of this.roomRestrictors.keys()) {
      const c = placement.get(subjectId)
      if (c !== undefined && board.roomIdOf(c) === pickRoom) subjects.add(subjectId)
    }

    let dead = false
    for (const subjectId of subjects) {
      const room = board.roomIdOf(placement.get(subjectId)!)
      const mask = this.roomMask.get(room)!
      for (const restrictor of this.roomRestrictors.get(subjectId)!) {
        let matchingFull = false
        if (restrictor.kind === 'companion') {
          let matching = 0
          for (const [id, c] of placement) {
            if (
              id !== subjectId &&
              id !== VICTIM_ID &&
              board.roomIdOf(c) === room &&
              this.puzzle.attributesOf(id)[restrictor.attribute] === restrictor.value
            ) {
              matching++
            }
          }
          matchingFull = matching >= restrictor.count
        }
        for (const person of people) {
          if (person.id === subjectId || placement.has(person.id)) continue
          let strike: boolean
          if (restrictor.kind === 'alone') {
            strike = true
          } else if (restrictor.kind === 'attrNone') {
            strike = this.puzzle.attributesOf(person.id)[restrictor.attribute] === restrictor.value
          } else {
            // companion ("alone with N matching") counts SUSPECTS only — the victim is
            // never a companion, so it is never struck from a companion room.
            if (person.id === VICTIM_ID) continue
            const isMatch =
              this.puzzle.attributesOf(person.id)[restrictor.attribute] === restrictor.value
            strike = !isMatch || matchingFull
          }
          if (strike) {
            const domain = domains.get(person.id)!
            domain.andNot(mask)
            if (domain.isEmpty()) dead = true
          }
        }
      }
    }
    return dead
  }

  private roomExistsFeasible(
    placement: Map<PersonId, Cell>,
    domains: Map<PersonId, BitSet>,
  ): boolean {
    const board = this.puzzle.board
    for (const { subjectId, clue } of this.roomExists) {
      const cell = placement.get(subjectId)
      if (cell === undefined) continue
      const room = board.roomIdOf(cell)
      let possible = false
      for (const id of this.puzzle.allIds()) {
        if (id === VICTIM_ID || id === subjectId) continue
        if (!clue.matchesPerson(this.puzzle, id)) continue
        const placed = placement.get(id)
        if (placed !== undefined) {
          if (clue.qualifies(board, placed, room)) {
            possible = true
            break
          }
        } else {
          domains.get(id)!.forEach((candidate) => {
            if (!possible && clue.qualifies(board, candidate, room)) possible = true
          })
          if (possible) break
        }
      }
      if (!possible) return false
    }
    return true
  }
}
