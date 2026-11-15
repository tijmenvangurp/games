import { CandidateState } from './CandidateState.ts'
import type { Board } from '../domain/Board.ts'
import type { Cell, Explanation, PersonId } from '../domain/types.ts'
import type { Person, Puzzle } from '../domain/Puzzle.ts'
import type { Elimination } from './DeductionStep.ts'

/** Rows or columns — techniques work on either via this axis. */
export type Axis = 'row' | 'col'

/** Shared, mutable solving state plus board helpers used by all techniques. */
export class SolveContext {
  private constructor(
    readonly puzzle: Puzzle,
    readonly board: Board,
    readonly state: CandidateState,
    readonly people: Person[],
    /** True when #people === width === height (every row & column is used). */
    readonly fullPermutation: boolean,
  ) {}

  static create(puzzle: Puzzle): SolveContext {
    const board = puzzle.board
    const people = puzzle.people()
    const full = people.length === board.width && board.width === board.height
    return new SolveContext(puzzle, board, new CandidateState(), people, full)
  }

  isVictim(id: PersonId): boolean {
    return id === this.puzzle.victim.id
  }

  /** Row or column index of a cell, per the given axis. */
  axisOf(cell: Cell, axis: Axis): number {
    const { row, col } = this.board.rc(cell)
    return axis === 'row' ? row : col
  }

  /** Cells a person can still occupy (their placed cell, or their domain). */
  cellsOf(id: PersonId): Cell[] {
    const placed = this.state.placed.get(id)
    return placed !== undefined ? [placed] : [...this.state.domain(id)]
  }

  /** Lines (rows or columns) a person can still occupy. */
  linesOf(id: PersonId, axis: Axis): Set<number> {
    const lines = new Set<number>()
    for (const cell of this.cellsOf(id)) lines.add(this.axisOf(cell, axis))
    return lines
  }

  /** Rooms a person can still occupy. */
  roomsOf(id: PersonId): Set<string> {
    const rooms = new Set<string>()
    for (const cell of this.cellsOf(id)) rooms.add(this.board.roomIdOf(cell))
    return rooms
  }

  /** Lines already occupied by a placed person. */
  usedLines(axis: Axis): Set<number> {
    const used = new Set<number>()
    for (const cell of this.state.placed.values()) used.add(this.axisOf(cell, axis))
    return used
  }

  /**
   * Rows (or columns) that lie ENTIRELY within `roomId` — every occupiable cell of
   * the line belongs to the room. In a full permutation each line has exactly one
   * occupant, so that occupant is guaranteed to be inside the room. Used to prove a
   * room is non-empty without pinning a specific person to it.
   */
  fullLinesIn(roomId: string, axis: Axis): number[] {
    const span = axis === 'row' ? this.board.height : this.board.width
    const out: number[] = []
    for (let line = 0; line < span; line++) {
      const cells = axis === 'row' ? this.board.cellsInRow(line) : this.board.cellsInCol(line)
      if (cells.size === 0) continue
      let all = true
      for (const cell of cells) {
        if (this.board.roomIdOf(cell) !== roomId) {
          all = false
          break
        }
      }
      if (all) out.push(line)
    }
    return out
  }

  /**
   * Upper bound on how many people the given rooms can hold together: in a full
   * permutation everyone sits in a distinct row AND column, so the count can't
   * exceed the distinct rows (or columns) the rooms' occupiable cells span.
   */
  roomsCapacity(rooms: Iterable<string>): number {
    const rows = new Set<number>()
    const cols = new Set<number>()
    for (const room of rooms) {
      for (const cell of this.board.cellsInRoom(room)) {
        const { row, col } = this.board.rc(cell)
        rows.add(row)
        cols.add(col)
      }
    }
    return Math.min(rows.size, cols.size)
  }

  /** Remove all candidates of a person matching the predicate; return them. */
  removeWhere(id: PersonId, predicate: (cell: Cell) => boolean): Cell[] {
    const domain = this.state.domain(id)
    const removed: Cell[] = []
    for (const cell of [...domain]) {
      if (predicate(cell)) {
        domain.delete(cell)
        removed.push(cell)
      }
    }
    return removed
  }

  /** A hypothetical copy of this context (independent solving state). */
  clone(): SolveContext {
    return new SolveContext(
      this.puzzle,
      this.board,
      this.state.clone(),
      this.people,
      this.fullPermutation,
    )
  }

  roomOf(cell: Cell): string {
    return this.board.roomIdOf(cell)
  }

  /**
   * Could the victim still end up ALONE with exactly one suspect? Necessary
   * condition (never a false contradiction): at least one room can still hold the
   * victim plus exactly one suspect — i.e. ≤1 suspect is locked into it and ≥1
   * suspect can be in it.
   */
  murderPossible(): boolean {
    for (const room of this.roomsOf(this.puzzle.victim.id)) {
      let locked = 0
      let possible = 0
      for (const person of this.people) {
        if (this.isVictim(person.id)) continue
        const rooms = this.roomsOf(person.id)
        if (!rooms.has(room)) continue
        possible++
        if (rooms.size === 1) locked++
      }
      if (locked <= 1 && possible >= 1) return true
    }
    return false
  }

  /** The single room all of a person's candidates lie in, or null. */
  guaranteedRoomOf(id: PersonId): string | null {
    let room: string | null = null
    for (const cell of this.state.domain(id)) {
      const r = this.board.roomIdOf(cell)
      if (room === null) room = r
      else if (room !== r) return null
    }
    return room
  }

  /** A readable contradiction in the current state, or null if none is visible.
   *  Shared by the hypothetical techniques (case split, forcing). */
  deadReason(): Explanation | null {
    for (const id of this.state.unplaced()) {
      if (this.state.domain(id).size === 0) return { key: 'contra.empty', params: { name: id } }
    }
    if (!this.murderPossible()) return { key: 'contra.murder' }
    if (this.hasContradiction()) return { key: 'contra.general' }
    return null
  }

  /** True if the state can no longer be completed (empty domain, or — in a
   *  full permutation — a row/column no one can cover). */
  hasContradiction(): boolean {
    for (const id of this.state.unplaced()) {
      if (this.state.domain(id).size === 0) return true
    }
    if (!this.fullPermutation) return false
    const rows = new Set<number>()
    const cols = new Set<number>()
    for (const cell of this.state.placed.values()) {
      const { row, col } = this.board.rc(cell)
      rows.add(row)
      cols.add(col)
    }
    for (const id of this.state.unplaced()) {
      for (const cell of this.state.domain(id)) {
        const { row, col } = this.board.rc(cell)
        rows.add(row)
        cols.add(col)
      }
    }
    for (let r = 0; r < this.board.height; r++) if (!rows.has(r)) return true
    for (let c = 0; c < this.board.width; c++) if (!cols.has(c)) return true
    return false
  }

  /** Place a person, then remove their row, column and cell from all others. */
  place(id: PersonId, cell: Cell): Elimination[] {
    this.state.place(id, cell)
    const { row, col } = this.board.rc(cell)
    const eliminated: Elimination[] = []
    for (const other of this.state.unplaced()) {
      const removed = this.removeWhere(other, (c) => {
        const rc = this.board.rc(c)
        return c === cell || rc.row === row || rc.col === col
      })
      if (removed.length > 0) eliminated.push({ personId: other, cells: removed })
    }
    return eliminated
  }
}
