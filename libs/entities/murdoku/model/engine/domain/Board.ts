import { MULTI_CELL_TYPES, VOID_ROOM, type Cell, type Side } from './types.ts'
import type { Tile } from './Tile.ts'
import type { Room } from './Room.ts'

/** Canonical key for the edge on a given side of tile (row,col). */
export function edgeKey(row: number, col: number, side: Side): string {
  switch (side) {
    case 'N':
      return `h:${row}:${col}`
    case 'S':
      return `h:${row + 1}:${col}`
    case 'W':
      return `v:${row}:${col}`
    case 'E':
      return `v:${row}:${col + 1}`
  }
}

/**
 * The static layout of a level: the grid of tiles, its rooms, and window edges.
 * Walls and corners are derived from room membership — they are not stored.
 */
export class Board {
  private readonly occupiable: Cell[] = []
  /** Lazily-built footprint pairing for two-tile objects (see bigObjectPartners). */
  private bigPartners?: ReadonlyMap<Cell, Cell | null>

  constructor(
    readonly width: number,
    readonly height: number,
    readonly tiles: readonly Tile[],
    readonly rooms: ReadonlyMap<string, Room>,
    /**
     * Windows by owning cell → the sides they sit on. A window belongs to the
     * cell that declares it (so only THAT cell is "beside" it — a window on a
     * shared edge is not automatically beside the neighbour across the wall).
     */
    private readonly windows: ReadonlyMap<Cell, ReadonlySet<Side>>,
    /**
     * Doors by cell → the sides they sit on. Unlike windows a door is TWO-sided:
     * the loader registers it on both cells of the shared edge, so both count as
     * "beside a door".
     */
    private readonly doors: ReadonlyMap<Cell, ReadonlySet<Side>> = new Map(),
  ) {
    for (let c = 0; c < tiles.length; c++) {
      // Void (no-room) cells are exterior — never occupiable, whatever sits on them.
      if (tiles[c].occupiable && tiles[c].roomId !== VOID_ROOM) this.occupiable.push(c)
    }
  }

  /** Whether a cell belongs to no room (empty exterior / void). */
  isVoid(cell: Cell): boolean {
    return this.tiles[cell].roomId === VOID_ROOM
  }

  idx(row: number, col: number): Cell {
    return row * this.width + col
  }

  rc(cell: Cell): { row: number; col: number } {
    return { row: Math.floor(cell / this.width), col: cell % this.width }
  }

  inBounds(row: number, col: number): boolean {
    return row >= 0 && row < this.height && col >= 0 && col < this.width
  }

  tileAt(cell: Cell): Tile {
    return this.tiles[cell]
  }

  roomIdOf(cell: Cell): string {
    return this.tiles[cell].roomId
  }

  isOccupiable(cell: Cell): boolean {
    return this.tiles[cell].occupiable && this.tiles[cell].roomId !== VOID_ROOM
  }

  /** All occupiable cells, in ascending index order. */
  occupiableCells(): readonly Cell[] {
    return this.occupiable
  }

  /** Orthogonal (N/E/S/W) in-bounds neighbours of a cell. */
  neighbors4(cell: Cell): Cell[] {
    const { row, col } = this.rc(cell)
    const out: Cell[] = []
    if (this.inBounds(row - 1, col)) out.push(this.idx(row - 1, col))
    if (this.inBounds(row + 1, col)) out.push(this.idx(row + 1, col))
    if (this.inBounds(row, col - 1)) out.push(this.idx(row, col - 1))
    if (this.inBounds(row, col + 1)) out.push(this.idx(row, col + 1))
    return out
  }

  /** Whether this cell owns a window (i.e. is "beside a window"). */
  hasWindow(cell: Cell): boolean {
    return this.windows.has(cell)
  }

  /** The sides of this cell that carry a window (for rendering). */
  windowSides(cell: Cell): Side[] {
    const sides = this.windows.get(cell)
    return sides ? [...sides] : []
  }

  /** Whether this cell is beside a door (doors are two-sided). */
  hasDoor(cell: Cell): boolean {
    return this.doors.has(cell)
  }

  /** The sides of this cell that carry a door (for rendering). */
  doorSides(cell: Cell): Side[] {
    const sides = this.doors.get(cell)
    return sides ? [...sides] : []
  }

  /** Occupiable cells beside a door. */
  cellsNearDoor(): Set<Cell> {
    const out = new Set<Cell>()
    for (const cell of this.occupiable) {
      if (this.hasDoor(cell)) out.add(cell)
    }
    return out
  }

  /** Whether a cell's room is an outdoor area (pasture/yard/garden). */
  isOutside(cell: Cell): boolean {
    return this.rooms.get(this.roomIdOf(cell))?.outside ?? false
  }

  /** Occupiable cells in an outdoor (true) or indoor (false) room. */
  cellsOutside(outside: boolean): Set<Cell> {
    const out = new Set<Cell>()
    for (const cell of this.occupiable) {
      if (this.isOutside(cell) === outside) out.add(cell)
    }
    return out
  }

  /** A side is a wall when it leaves the board or crosses into another room. */
  private isWall(row: number, col: number, room: string): boolean {
    return !this.inBounds(row, col) || this.tiles[this.idx(row, col)].roomId !== room
  }

  /** A cell is a corner of its room when two perpendicular sides are walls. */
  isCorner(cell: Cell): boolean {
    const { row, col } = this.rc(cell)
    const room = this.tiles[cell].roomId
    const n = this.isWall(row - 1, col, room)
    const s = this.isWall(row + 1, col, room)
    const w = this.isWall(row, col - 1, room)
    const e = this.isWall(row, col + 1, room)
    return (n && e) || (e && s) || (s && w) || (w && n)
  }

  /** A cell is beside a wall when at least one of its sides is a wall. */
  isAtWall(cell: Cell): boolean {
    const { row, col } = this.rc(cell)
    const room = this.tiles[cell].roomId
    return (
      this.isWall(row - 1, col, room) ||
      this.isWall(row + 1, col, room) ||
      this.isWall(row, col - 1, room) ||
      this.isWall(row, col + 1, room)
    )
  }

  // --- candidate-set helpers used by clues -------------------------------

  /** Occupiable cells whose tile carries the given object type. */
  cellsWithObject(type: string): Set<Cell> {
    const out = new Set<Cell>()
    for (const cell of this.occupiable) {
      if (this.tiles[cell].hasObjectType(type)) out.add(cell)
    }
    return out
  }

  /** ALL cells (occupiable or not) carrying the object type — for relating a
   *  person's row/column/direction to where a (possibly blocking) object sits. */
  objectCells(type: string): Cell[] {
    const out: Cell[] = []
    for (let cell = 0; cell < this.tiles.length; cell++) {
      if (this.tiles[cell].hasObjectType(type)) out.push(cell)
    }
    return out
  }

  /**
   * Footprint pairing for two-tile objects (bed/car): each such cell mapped to its
   * partner cell, or null when it stands alone. Cells are paired greedily in
   * row-major order — RIGHT first, else BELOW — IDENTICAL to how the board is
   * drawn, so the picture and "beside an object" never disagree. Built once.
   */
  bigObjectPartners(): ReadonlyMap<Cell, Cell | null> {
    if (this.bigPartners) return this.bigPartners
    const partner = new Map<Cell, Cell | null>()
    const consumed = new Set<Cell>()
    for (let cell = 0; cell < this.tiles.length; cell++) {
      const type = this.tiles[cell].top?.type
      if (!type || !MULTI_CELL_TYPES.has(type) || consumed.has(cell)) continue
      const { row, col } = this.rc(cell)
      const room = this.tiles[cell].roomId
      const free = (r: number, c: number): boolean => {
        if (!this.inBounds(r, c)) return false
        const i = this.idx(r, c)
        return !consumed.has(i) && this.tiles[i].top?.type === type && this.tiles[i].roomId === room
      }
      let mate: Cell | null = null
      if (free(row, col + 1)) mate = this.idx(row, col + 1)
      else if (free(row + 1, col)) mate = this.idx(row + 1, col)
      partner.set(cell, mate)
      consumed.add(cell)
      if (mate !== null) {
        partner.set(mate, cell)
        consumed.add(mate)
      }
    }
    this.bigPartners = partner
    return partner
  }

  /**
   * Occupiable cells with a same-room orthogonal neighbour carrying `type`, where the
   * person is NOT standing on a `type` object themselves. Standing on the object (a
   * chair, a bed, a rug, …) is being "on" it, never "beside" it — even when another
   * same-type object sits right next door. (For blocking objects this on-object skip
   * never fires, since their tiles are not occupiable to begin with.)
   */
  cellsNearObject(type: string): Set<Cell> {
    const out = new Set<Cell>()
    for (const cell of this.occupiable) {
      if (this.tiles[cell].hasObjectType(type)) continue // on the object ⇒ not beside it
      const room = this.tiles[cell].roomId
      for (const nb of this.neighbors4(cell)) {
        if (this.tiles[nb].roomId === room && this.tiles[nb].hasObjectType(type)) {
          out.add(cell)
          break
        }
      }
    }
    return out
  }

  /** Occupiable cells adjacent to a window. */
  cellsNearWindow(): Set<Cell> {
    const out = new Set<Cell>()
    for (const cell of this.occupiable) {
      if (this.hasWindow(cell)) out.add(cell)
    }
    return out
  }

  cellsInRoom(roomId: string): Set<Cell> {
    const out = new Set<Cell>()
    for (const cell of this.occupiable) {
      if (this.tiles[cell].roomId === roomId) out.add(cell)
    }
    return out
  }

  cellsInRow(row: number): Set<Cell> {
    const out = new Set<Cell>()
    for (const cell of this.occupiable) {
      if (this.rc(cell).row === row) out.add(cell)
    }
    return out
  }

  cellsInCol(col: number): Set<Cell> {
    const out = new Set<Cell>()
    for (const cell of this.occupiable) {
      if (this.rc(cell).col === col) out.add(cell)
    }
    return out
  }

  cornerCells(): Set<Cell> {
    const out = new Set<Cell>()
    for (const cell of this.occupiable) {
      if (this.isCorner(cell)) out.add(cell)
    }
    return out
  }

  /** Occupiable cells that sit beside at least one wall. */
  cellsAtWall(): Set<Cell> {
    const out = new Set<Cell>()
    for (const cell of this.occupiable) {
      if (this.isAtWall(cell)) out.add(cell)
    }
    return out
  }
}
