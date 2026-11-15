/** A cell is a flat index into the grid: `row * width + col`. */
export type Cell = number

/** Stable identifier of a person on the board (suspect id like "A", or the victim). */
export type PersonId = string

/** Internal id used for the victim person. */
export const VICTIM_ID: PersonId = 'victim'

/**
 * Reserved roomMap char for a cell that belongs to NO room: empty exterior /
 * void. Such cells are never occupiable, count as no room for clues, and render
 * as bare board background (no fill, no grid, no enclosing outer wall).
 */
export const VOID_ROOM = '.'

/** Cardinal directions for relational clues ("south of X"). */
export type Direction = 'north' | 'south' | 'east' | 'west'

/** The four diagonals — each means BOTH cardinals (e.g. southwest = south AND west). */
export type Diagonal = 'northeast' | 'northwest' | 'southeast' | 'southwest'

/** Eight compass directions: cardinals are half-planes, diagonals are quadrants. */
export type Direction8 = Direction | Diagonal

/**
 * Whether cell {row,col} `s` lies in `direction` relative to anchor `t`.
 * Cardinals are half-planes (south = any cell strictly below); diagonals are the
 * intersection of two half-planes (southwest = strictly below AND strictly left),
 * NOT only the diagonal line.
 */
export function inDirection8(
  direction: Direction8,
  s: { row: number; col: number },
  t: { row: number; col: number },
): boolean {
  const n = s.row < t.row
  const so = s.row > t.row
  const e = s.col > t.col
  const w = s.col < t.col
  switch (direction) {
    case 'north':
      return n
    case 'south':
      return so
    case 'east':
      return e
    case 'west':
      return w
    case 'northeast':
      return n && e
    case 'northwest':
      return n && w
    case 'southeast':
      return so && e
    case 'southwest':
      return so && w
  }
}

/** Which side of a tile an edge (e.g. a window) sits on. */
export type Side = 'N' | 'E' | 'S' | 'W'

/**
 * Object types that occupy TWO adjacent tiles as ONE physical object (a bed, a
 * car, a rowing boat): drawn as a single image, and "beside one" means beside the
 * whole pair — never beside its own other half. Every other object is its own
 * one-tile footprint. Single source of truth for both the renderer and the clue logic.
 */
export const MULTI_CELL_TYPES: ReadonlySet<string> = new Set(['bed', 'car', 'boat', 'carriage'])

/** Attribute values a suspect can carry (gender, beard, …). */
export type AttributeValue = string | number | boolean

/**
 * Hair colours a suspect can have. Single source of truth for BOTH the editor
 * dropdowns AND the generator's random assignment — they must agree, otherwise an
 * editor clue can demand a colour the generator never produces (→ no solution).
 */
export const HAIR_COLORS: readonly string[] = ['blond', 'brown', 'black', 'red', 'grey', 'white']

/**
 * A renderable, language-independent description.
 * `key` is an i18n key; `params` are interpolated into the template.
 * Never contains hard-coded display text — the UI/runner resolves it.
 */
export interface Explanation {
  key: string
  params?: Record<string, string | number>
  /** Nested explanations for composite clues (and / or / not). */
  children?: Explanation[]
}
