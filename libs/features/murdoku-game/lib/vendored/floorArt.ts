/**
 * Subtle floor patterns for room tiles — "ink on a floor plan": each room type
 * (i18n nameKey) gets a quiet texture drawn over its pastel colour, so a kitchen
 * reads checkered, a living room shows floorboards, a garden grows grass. The
 * patterns NEVER compete with the game: almost everything is drawn in low-alpha
 * ink/white derived from the room colour itself; only outdoor organics (grass,
 * leaves, soil, straw) use muted natural tints.
 *
 * Rules:
 * - One global mapping nameKey → pattern, so a "Küche" looks the same in every
 *   theme — and within any single theme all 15 rooms stay visually distinct
 *   (guaranteed by floorArt.test.ts).
 * - Motifs are structural — filled shapes, lattices, weaves — never sprays of
 *   tiny dots/specks/triangles (those read as rendering noise at board scale).
 * - Water rooms (lake/jetty/…) keep their dedicated water art — no pattern.
 * - Unknown room names simply get no pattern (plain colour, old levels safe).
 * - Editor placeholder rooms (room.editor1..F) rotate through a default set.
 *
 * Everything is deterministic: per-cell jitter comes from a (row,col) hash, so
 * the board looks identical on every repaint.
 */

type Ctx = CanvasRenderingContext2D

export type FloorPattern =
  | 'checker'
  | 'checkerDiag'
  | 'tileGrid'
  | 'tileSmall'
  | 'hexTile'
  | 'diamond'
  | 'planksH'
  | 'planksV'
  | 'planksOld'
  | 'herringbone'
  | 'parquet'
  | 'deck'
  | 'marble'
  | 'flagstone'
  | 'cobble'
  | 'concrete'
  | 'asphalt'
  | 'gravel'
  | 'grass'
  | 'meadow'
  | 'furrows'
  | 'dirt'
  | 'straw'
  | 'leaves'
  | 'sand'
  | 'carpet'
  | 'carpetDiag'
  | 'rubber'
  | 'lino'
  | 'terrazzo'
  | 'splatter'

// ─── Room type → pattern (global; per-theme uniqueness is tested) ────────────

const PATTERN_OF: Record<string, FloorPattern> = {
  // kitchens & food
  kitchen: 'checker',
  kitchenette: 'hexTile',
  scullery: 'checkerDiag',
  preproom: 'lino',
  coldroom: 'diamond',
  bakery: 'checker',
  canteen: 'checker',
  cafeteria: 'checker',
  breakfastroom: 'tileGrid',
  breakroom: 'checker',
  picnicarea: 'flagstone', // paved slabs under the picnic tables (it's outdoors)
  cafe: 'checker',
  // baths & wet rooms
  bathroom: 'tileSmall',
  bath: 'tileSmall',
  guestbath: 'tileSmall',
  restroom: 'tileSmall',
  showers: 'checkerDiag',
  laundry: 'checkerDiag',
  laundrette: 'checkerDiag',
  utilityroom: 'tileGrid',
  washbay: 'checkerDiag',
  spa: 'sand',
  // living & wood
  living: 'planksH',
  gallery: 'planksH',
  maingallery: 'planksH',
  commonroom: 'planksH',
  gymnasium: 'planksH',
  farmhouse: 'planksH',
  produce: 'planksH', // supermarket aisle: market-stall wood, not grass (indoors)
  fruit: 'planksOld', // supermarket aisle: rustic crate wood, not meadow (indoors)
  hallway: 'planksV',
  cloakroom: 'planksV',
  vestibule: 'marble',
  smokingroom: 'planksV',
  barn: 'planksV',
  attic: 'planksOld',
  library: 'planksOld',
  shed: 'planksOld',
  cabin: 'planksOld',
  interrogation: 'planksOld',
  study: 'herringbone',
  office: 'herringbone',
  bossoffice: 'herringbone',
  chiefoffice: 'herringbone',
  salon: 'herringbone',
  restaurant: 'herringbone',
  musichall: 'herringbone',
  dining: 'parquet',
  dininghall: 'parquet',
  conference: 'parquet',
  briefing: 'parquet',
  assemblyhall: 'parquet',
  exposition: 'parquet',
  ballroom: 'checkerDiag',
  balcony: 'deck',
  terrace: 'cobble',
  porch: 'deck',
  rooftop: 'deck',
  // grand stone
  entrancehall: 'marble',
  lobby: 'marble',
  entrance: 'marble',
  drugstore: 'marble',
  foyer: 'terrazzo',
  reception: 'terrazzo',
  receptionarea: 'terrazzo',
  frontdesk: 'terrazzo',
  snacks: 'terrazzo',
  basement: 'flagstone',
  winecellar: 'flagstone',
  pantry: 'flagstone',
  cell1: 'flagstone',
  cell2: 'cobble',
  yard: 'cobble',
  firesideroom: 'cobble',
  // work & industry
  garage: 'concrete',
  workshop: 'concrete',
  craftroom: 'concrete',
  stockroom: 'concrete',
  mailroom: 'concrete',
  luggageroom: 'concrete',
  emergency: 'concrete',
  parking: 'asphalt',
  testbay: 'asphalt',
  schoolyard: 'asphalt',
  gasstation: 'gravel',
  campfire: 'gravel',
  stable: 'gravel',
  greenhouse: 'tileGrid',
  assembly: 'diamond',
  elevator: 'diamond',
  vault: 'diamond',
  armory: 'diamond',
  frozen: 'diamond',
  sterilization: 'diamond',
  xray: 'rubber',
  paintshop: 'splatter',
  artroom: 'splatter',
  // storage & plain
  storage: 'tileGrid',
  storeroom: 'tileGrid',
  evidenceroom: 'tileGrid',
  partsstore: 'tileSmall',
  tirestore: 'rubber',
  copyroom: 'checkerDiag',
  printroom: 'tileSmall',
  serverroom: 'rubber',
  computerroom: 'tileGrid',
  drinks: 'tileGrid',
  lab: 'tileGrid',
  chemlab: 'tileSmall',
  forensics: 'tileSmall',
  operating: 'tileSmall',
  dairy: 'tileSmall',
  chilled: 'tileSmall',
  deli: 'checkerDiag',
  cheese: 'hexTile',
  pharmacy: 'hexTile',
  bar: 'hexTile',
  dressingroom: 'hexTile',
  icu: 'checkerDiag',
  ward: 'lino',
  classroom: 'lino',
  archive: 'lino',
  checkout: 'lino',
  kiosk: 'lino',
  main: 'tileGrid',
  // soft rooms
  guestroom: 'carpet',
  suite: 'carpet',
  boudoir: 'carpet',
  waiting: 'carpet',
  waitingroom: 'carpet',
  openoffice: 'carpet',
  teachersroom: 'carpet',
  staffroom: 'carpet',
  auditorium: 'carpet',
  bedroom: 'carpetDiag',
  lounge: 'carpetDiag',
  meeting: 'carpetDiag',
  musicroom: 'carpetDiag',
  secretariat: 'carpetDiag',
  specialexhibit: 'carpetDiag',
  deliveryroom: 'carpetDiag',
  dispatch: 'carpetDiag',
  kids1: 'rubber',
  kids2: 'terrazzo',
  kidsroom: 'rubber',
  gameroom: 'rubber',
  gym: 'rubber',
  lockerroom: 'rubber',
  security: 'rubber',
  toys: 'rubber',
  servantsroom: 'tileSmall',
  conservatory: 'diamond',
  // castle (moat is a water room — no pattern)
  throneroom: 'marble',
  knightshall: 'planksH',
  chapel: 'checkerDiag',
  dungeon: 'concrete', // rough cracked slab reads as hewn dungeon stone
  towerroom: 'planksV',
  battlements: 'tileGrid', // large walkway slabs
  courtyard: 'cobble',
  chamber: 'carpet',
  gatehouse: 'tileSmall',
  castlekitchen: 'checker',
  // pool & spa (mainpool/kidspool are water rooms — no pattern)
  lawn: 'meadow',
  sauna: 'planksH',
  steamroom: 'tileGrid',
  slidetower: 'diamond', // riffled wet-deck plates
  massage: 'planksV',
  relaxroom: 'carpetDiag',
  // outdoors
  garden: 'grass',
  frontyard: 'grass',
  campsite1: 'grass',
  pasture: 'meadow',
  clearing: 'meadow',
  field: 'furrows',
  pigsty: 'dirt',
  campsite2: 'dirt',
  cowshed: 'straw',
  henhouse: 'sand',
  playground: 'sand',
  forest: 'leaves',
  pond: 'leaves',
}

/** Default rotation for the editor's unnamed placeholder rooms (Raum 1–15). */
export const EDITOR_FLOOR_PATTERNS: readonly FloorPattern[] = [
  'planksH',
  'tileGrid',
  'carpet',
  'checker',
  'planksV',
  'flagstone',
  'herringbone',
  'tileSmall',
  'carpetDiag',
  'parquet',
  'concrete',
  'hexTile',
  'diamond',
  'lino',
  'marble',
]

/** The floor pattern for a room nameKey (with or without the `room.` prefix);
 *  null = plain colour (unknown names, and water rooms have their own art). */
export function floorPatternOf(nameKey: string): FloorPattern | null {
  const key = nameKey.replace(/^room\./, '')
  const editor = /^editor([1-9A-F])$/.exec(key)
  if (editor) return EDITOR_FLOOR_PATTERNS[parseInt(editor[1], 16) - 1]
  return PATTERN_OF[key] ?? null
}

// ─── Palette (alpha-only inks so the room colour always wins) ────────────────

const INK = (a: number) => `rgba(24, 20, 30, ${a})`
const LITE = (a: number) => `rgba(255, 255, 255, ${a})`
const GREEN = (a: number) => `rgba(58, 96, 44, ${a})`
const EARTH = (a: number) => `rgba(96, 70, 42, ${a})`
const STRAW = (a: number) => `rgba(176, 138, 52, ${a})`

// ─── Deterministic per-cell jitter ───────────────────────────────────────────

function cellHash(row: number, col: number, salt: number): number {
  let h = (row * 374761393 + col * 668265263 + salt * 69069 + 0x9e3779b9) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

/** Stable pseudo-random 0..1 for a cell (varies with `salt`). */
function rnd(row: number, col: number, salt: number): number {
  return cellHash(row, col, salt) / 4294967296
}

// ─── Drawing ─────────────────────────────────────────────────────────────────

/**
 * Draw one tile's floor pattern into (x, y, S). Called right after the room
 * colour fill and before any highlight/object layers; clipped to the tile so
 * motifs may safely overshoot their edges (herringbone, hex, diagonals).
 */
export function drawFloorTile(
  ctx: Ctx,
  x: number,
  y: number,
  S: number,
  row: number,
  col: number,
  p: FloorPattern,
): void {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, S, S)
  ctx.clip()
  const thin = Math.max(0.75, S * 0.018)
  const mid = Math.max(1, S * 0.028)

  switch (p) {
    case 'checker': {
      // 2×2 alternating shading, phase-continuous across tiles.
      ctx.fillStyle = INK(0.075)
      const h = S / 2
      for (let j = 0; j < 2; j++)
        for (let i = 0; i < 2; i++)
          if ((row * 2 + j + col * 2 + i) % 2 === 0) ctx.fillRect(x + i * h, y + j * h, h, h)
      break
    }
    case 'checkerDiag': {
      // Diamond checker: every tile carries a shaded rhombus; the corners of four
      // neighbours form the complementary diamond.
      ctx.fillStyle = INK(0.07)
      ctx.beginPath()
      ctx.moveTo(x + S / 2, y)
      ctx.lineTo(x + S, y + S / 2)
      ctx.lineTo(x + S / 2, y + S)
      ctx.lineTo(x, y + S / 2)
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'tileGrid': {
      // Ceramic 2×2: a grout cross through the middle of the cell.
      ctx.strokeStyle = INK(0.09)
      ctx.lineWidth = thin
      ctx.beginPath()
      ctx.moveTo(x + S / 2, y)
      ctx.lineTo(x + S / 2, y + S)
      ctx.moveTo(x, y + S / 2)
      ctx.lineTo(x + S, y + S / 2)
      ctx.stroke()
      break
    }
    case 'tileSmall': {
      // Fine 3×3 tiling.
      ctx.strokeStyle = INK(0.075)
      ctx.lineWidth = thin
      ctx.beginPath()
      for (let k = 1; k < 3; k++) {
        ctx.moveTo(x + (k * S) / 3, y)
        ctx.lineTo(x + (k * S) / 3, y + S)
        ctx.moveTo(x, y + (k * S) / 3)
        ctx.lineTo(x + S, y + (k * S) / 3)
      }
      ctx.stroke()
      break
    }
    case 'hexTile': {
      // Honeycomb mosaic, per-tile periodic (two offset rows).
      ctx.strokeStyle = INK(0.085)
      ctx.lineWidth = thin
      const r = S * 0.21
      const hex = (cx: number, cy: number): void => {
        ctx.moveTo(cx, cy - r)
        for (let k = 1; k <= 6; k++) {
          const a = -Math.PI / 2 + (k * Math.PI) / 3
          ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
        }
      }
      ctx.beginPath()
      hex(x + S * 0.25, y + S * 0.25)
      hex(x + S * 0.75, y + S * 0.25)
      hex(x, y + S * 0.75)
      hex(x + S * 0.5, y + S * 0.75)
      hex(x + S, y + S * 0.75)
      ctx.stroke()
      break
    }
    case 'diamond': {
      // Glazing-bar lattice with softly shaded corner panes, so the centre
      // rhombus stands proud (conservatory glass / riffled steel).
      ctx.fillStyle = INK(0.05)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + S / 2, y)
      ctx.lineTo(x, y + S / 2)
      ctx.moveTo(x + S, y)
      ctx.lineTo(x + S, y + S / 2)
      ctx.lineTo(x + S / 2, y)
      ctx.moveTo(x + S, y + S)
      ctx.lineTo(x + S / 2, y + S)
      ctx.lineTo(x + S, y + S / 2)
      ctx.moveTo(x, y + S)
      ctx.lineTo(x, y + S / 2)
      ctx.lineTo(x + S / 2, y + S)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = INK(0.09)
      ctx.lineWidth = thin
      ctx.beginPath()
      ctx.moveTo(x + S / 2, y)
      ctx.lineTo(x + S, y + S / 2)
      ctx.lineTo(x + S / 2, y + S)
      ctx.lineTo(x, y + S / 2)
      ctx.closePath()
      ctx.stroke()
      break
    }
    case 'planksH':
    case 'planksV': {
      // Three boards per tile with staggered end joints and a grain stroke.
      const horiz = p === 'planksH'
      ctx.strokeStyle = INK(0.085)
      ctx.lineWidth = thin
      ctx.beginPath()
      for (let k = 1; k < 3; k++) {
        if (horiz) {
          ctx.moveTo(x, y + (k * S) / 3)
          ctx.lineTo(x + S, y + (k * S) / 3)
        } else {
          ctx.moveTo(x + (k * S) / 3, y)
          ctx.lineTo(x + (k * S) / 3, y + S)
        }
      }
      for (let b = 0; b < 3; b++) {
        const t = 0.15 + 0.7 * rnd(row, col, p === 'planksH' ? b : b + 7)
        if (horiz) {
          ctx.moveTo(x + t * S, y + (b * S) / 3)
          ctx.lineTo(x + t * S, y + ((b + 1) * S) / 3)
        } else {
          ctx.moveTo(x + (b * S) / 3, y + t * S)
          ctx.lineTo(x + ((b + 1) * S) / 3, y + t * S)
        }
      }
      ctx.stroke()
      break
    }
    case 'planksOld': {
      // Two wide rustic boards with the occasional knothole.
      ctx.strokeStyle = INK(0.09)
      ctx.lineWidth = mid
      ctx.beginPath()
      ctx.moveTo(x + S / 2, y)
      ctx.lineTo(x + S / 2, y + S)
      ctx.stroke()
      ctx.lineWidth = thin
      if (rnd(row, col, 3) < 0.6) {
        const kx = x + S * (0.15 + 0.2 * rnd(row, col, 4)) + (rnd(row, col, 5) < 0.5 ? S / 2 : 0)
        const ky = y + S * (0.2 + 0.6 * rnd(row, col, 6))
        ctx.beginPath()
        ctx.arc(kx, ky, S * 0.055, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.moveTo(x + S * 0.22, y + S * 0.1)
      ctx.quadraticCurveTo(x + S * 0.3, y + S * 0.5, x + S * 0.24, y + S * 0.9)
      ctx.stroke()
      break
    }
    case 'herringbone': {
      // Repeated zigzag rows — the classic parquet weave.
      ctx.strokeStyle = INK(0.075)
      ctx.lineWidth = thin
      ctx.beginPath()
      for (let k = 0; k <= 4; k++) {
        const yy = y + (k * S) / 4
        ctx.moveTo(x, yy)
        ctx.lineTo(x + S / 4, yy - S / 4)
        ctx.lineTo(x + S / 2, yy)
        ctx.lineTo(x + (3 * S) / 4, yy - S / 4)
        ctx.lineTo(x + S, yy)
      }
      ctx.stroke()
      break
    }
    case 'parquet': {
      // Basket weave: 2×2 blocks of alternating board direction.
      ctx.strokeStyle = INK(0.075)
      ctx.lineWidth = thin
      const h = S / 2
      ctx.beginPath()
      for (let j = 0; j < 2; j++)
        for (let i = 0; i < 2; i++) {
          const bx = x + i * h
          const by = y + j * h
          const acrossRow = (row * 2 + j + col * 2 + i) % 2 === 0
          for (let k = 1; k < 3; k++) {
            if (acrossRow) {
              ctx.moveTo(bx, by + (k * h) / 3)
              ctx.lineTo(bx + h, by + (k * h) / 3)
            } else {
              ctx.moveTo(bx + (k * h) / 3, by)
              ctx.lineTo(bx + (k * h) / 3, by + h)
            }
          }
        }
      ctx.stroke()
      break
    }
    case 'deck': {
      // Two wide outdoor boards: bold gap, staggered butt joints, a grain streak.
      ctx.strokeStyle = INK(0.12)
      ctx.lineWidth = mid
      ctx.beginPath()
      ctx.moveTo(x, y + S / 2)
      ctx.lineTo(x + S, y + S / 2)
      for (let b = 0; b < 2; b++) {
        const t = 0.2 + 0.6 * rnd(row, col, b + 11)
        ctx.moveTo(x + t * S, y + (b * S) / 2)
        ctx.lineTo(x + t * S, y + ((b + 1) * S) / 2)
      }
      ctx.stroke()
      ctx.strokeStyle = INK(0.07)
      ctx.lineWidth = thin
      ctx.beginPath()
      const gy = y + S * (0.18 + 0.14 * rnd(row, col, 13))
      ctx.moveTo(x + S * 0.08, gy)
      ctx.quadraticCurveTo(x + S * 0.5, gy + S * 0.05, x + S * 0.92, gy)
      ctx.stroke()
      break
    }
    case 'marble': {
      // Veined slabs: a main vein with a light echo, plus a short branch.
      const y1 = y + S * (0.15 + 0.5 * rnd(row, col, 1))
      const y2 = y + S * (0.25 + 0.55 * rnd(row, col, 2))
      const cy = y + S * (0.1 + 0.7 * rnd(row, col, 3))
      ctx.strokeStyle = INK(0.12)
      ctx.lineWidth = thin
      ctx.beginPath()
      ctx.moveTo(x, y1)
      ctx.quadraticCurveTo(x + S * 0.5, cy, x + S, y2)
      ctx.stroke()
      ctx.strokeStyle = LITE(0.34)
      ctx.beginPath()
      ctx.moveTo(x, y1 + thin * 1.8)
      ctx.quadraticCurveTo(x + S * 0.5, cy + thin * 1.8, x + S, y2 + thin * 1.8)
      ctx.stroke()
      ctx.strokeStyle = INK(0.1)
      ctx.beginPath()
      const bx = x + S * (0.25 + 0.4 * rnd(row, col, 4))
      const by = (y1 + cy) / 2
      ctx.moveTo(bx, by)
      ctx.quadraticCurveTo(bx + S * 0.15, by + S * 0.2, bx + S * 0.1, by + S * 0.42)
      ctx.stroke()
      break
    }
    case 'flagstone': {
      // One big slab per cell, rounded, slightly irregular inset.
      const pad = S * (0.05 + 0.02 * rnd(row, col, 1))
      ctx.strokeStyle = INK(0.09)
      ctx.lineWidth = thin
      ctx.beginPath()
      ctx.roundRect(x + pad, y + pad, S - 2 * pad, S - 2 * pad, S * (0.1 + 0.08 * rnd(row, col, 2)))
      ctx.stroke()
      break
    }
    case 'cobble': {
      // Four rounded setts per cell.
      const h = S / 2
      ctx.strokeStyle = INK(0.08)
      ctx.lineWidth = thin
      for (let j = 0; j < 2; j++)
        for (let i = 0; i < 2; i++) {
          const pad = h * 0.09
          ctx.beginPath()
          ctx.roundRect(x + i * h + pad, y + j * h + pad, h - 2 * pad, h - 2 * pad, h * 0.3)
          ctx.stroke()
          if ((row * 2 + j + col * 2 + i) % 2 === 0) {
            ctx.fillStyle = LITE(0.09)
            ctx.fill()
          }
        }
      break
    }
    case 'concrete': {
      // Burnished slab: a broad filled trowel sweep and the odd hairline crack.
      ctx.strokeStyle = INK(0.045)
      ctx.lineWidth = S * 0.15
      const cx = x + S * (0.25 + 0.5 * rnd(row, col, 1))
      const cy = y + S * (0.25 + 0.5 * rnd(row, col, 2))
      const a0 = Math.PI * 2 * rnd(row, col, 3)
      ctx.beginPath()
      ctx.arc(cx, cy, S * 0.38, a0, a0 + Math.PI * (0.5 + 0.5 * rnd(row, col, 4)))
      ctx.stroke()
      if (rnd(row, col, 20) < 0.35) {
        ctx.strokeStyle = INK(0.09)
        ctx.lineWidth = thin * 0.8
        ctx.beginPath()
        ctx.moveTo(x + S * rnd(row, col, 21), y)
        ctx.lineTo(x + S * rnd(row, col, 22), y + S * 0.5)
        ctx.lineTo(x + S * rnd(row, col, 23), y + S)
        ctx.stroke()
      }
      break
    }
    case 'asphalt': {
      // Worn blacktop: filled repair patches and meandering tar seams.
      if (rnd(row, col, 1) < 0.5) {
        ctx.fillStyle = INK(0.06)
        const pw = S * (0.3 + 0.25 * rnd(row, col, 2))
        const ph = S * (0.18 + 0.16 * rnd(row, col, 3))
        ctx.beginPath()
        ctx.roundRect(
          x + S * (0.08 + 0.5 * rnd(row, col, 4)),
          y + S * (0.1 + 0.55 * rnd(row, col, 5)),
          pw,
          ph,
          ph * 0.4,
        )
        ctx.fill()
      }
      if (rnd(row, col, 6) < 0.7) {
        ctx.strokeStyle = INK(0.11)
        ctx.lineWidth = thin
        ctx.beginPath()
        const x0 = x + S * (0.15 + 0.7 * rnd(row, col, 7))
        const x1 = x + S * (0.15 + 0.7 * rnd(row, col, 8))
        ctx.moveTo(x0, y)
        ctx.bezierCurveTo(
          x0 + S * (rnd(row, col, 9) - 0.5) * 0.5,
          y + S * 0.33,
          x1 + S * (rnd(row, col, 10) - 0.5) * 0.5,
          y + S * 0.66,
          x1,
          y + S,
        )
        ctx.stroke()
      }
      break
    }
    case 'gravel': {
      // Coarse gravel: fat filled pebbles, light against dark.
      for (let k = 0; k < 5; k++) {
        const gx = x + S * ((k % 3) / 3 + 0.17 + 0.14 * (rnd(row, col, k) - 0.5))
        const gy = y + S * (Math.floor(k / 3) / 2 + 0.26 + 0.16 * (rnd(row, col, k + 9) - 0.5))
        ctx.fillStyle = k % 2 === 0 ? INK(0.07) : LITE(0.16)
        ctx.beginPath()
        ctx.ellipse(
          gx,
          gy,
          S * (0.07 + 0.04 * rnd(row, col, k + 17)),
          S * (0.05 + 0.03 * rnd(row, col, k + 29)),
          Math.PI * rnd(row, col, k + 23),
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }
      break
    }
    case 'grass':
    case 'meadow': {
      // Little tufts (2 blades each); the meadow adds tiny pale blossoms.
      ctx.strokeStyle = GREEN(0.26)
      ctx.lineWidth = Math.max(1, S * 0.02)
      ctx.lineCap = 'round'
      const tufts = p === 'grass' ? 6 : 4
      for (let k = 0; k < tufts; k++) {
        const gx = x + S * ((k % 3) / 3 + 0.17 + 0.12 * (rnd(row, col, k) - 0.5))
        const gy = y + S * (Math.floor(k / 3) / 2 + 0.38 + 0.1 * (rnd(row, col, k + 31) - 0.5))
        const L = S * 0.11
        ctx.beginPath()
        ctx.moveTo(gx, gy)
        ctx.quadraticCurveTo(gx - L * 0.5, gy - L * 0.6, gx - L * 0.55, gy - L)
        ctx.moveTo(gx, gy)
        ctx.quadraticCurveTo(gx + L * 0.4, gy - L * 0.7, gx + L * 0.5, gy - L)
        ctx.stroke()
      }
      if (p === 'meadow') {
        // Little daisies: five petals around a golden heart (no lone dots).
        for (let k = 0; k < 2; k++) {
          const fx = x + S * (0.2 + 0.6 * rnd(row, col, k + 41))
          const fy = y + S * (0.2 + 0.6 * rnd(row, col, k + 47))
          const pr = Math.max(1.2, S * 0.05)
          ctx.fillStyle = LITE(0.5)
          for (let pk = 0; pk < 5; pk++) {
            const pa = (pk * Math.PI * 2) / 5 + Math.PI * rnd(row, col, k + 53)
            ctx.beginPath()
            ctx.ellipse(fx + Math.cos(pa) * pr, fy + Math.sin(pa) * pr, pr * 0.75, pr * 0.45, pa, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.fillStyle = 'rgba(214, 172, 60, 0.6)'
          ctx.beginPath()
          ctx.arc(fx, fy, pr * 0.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      break
    }
    case 'furrows': {
      // Ploughed rows: gently waving earth lines.
      ctx.strokeStyle = EARTH(0.22)
      ctx.lineWidth = Math.max(1, S * 0.03)
      ctx.lineCap = 'round'
      ctx.beginPath()
      for (let k = 0; k < 3; k++) {
        const yy = y + S * (0.2 + 0.3 * k)
        ctx.moveTo(x + S * 0.06, yy)
        ctx.quadraticCurveTo(x + S * 0.5, yy + S * 0.05 * (k % 2 === 0 ? 1 : -1), x + S * 0.94, yy)
      }
      ctx.stroke()
      break
    }
    case 'dirt': {
      // Mottled trampled ground: broad earth patches only.
      ctx.fillStyle = EARTH(0.12)
      for (let k = 0; k < 4; k++) {
        const px = x + S * (0.18 + 0.64 * rnd(row, col, k * 3 + 1))
        const py = y + S * (0.18 + 0.64 * rnd(row, col, k * 3 + 2))
        ctx.beginPath()
        ctx.ellipse(px, py, S * 0.15, S * 0.09, Math.PI * rnd(row, col, k * 3 + 3), 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'straw': {
      // Scattered short stalks.
      ctx.strokeStyle = STRAW(0.38)
      ctx.lineWidth = Math.max(1, S * 0.02)
      ctx.lineCap = 'round'
      ctx.beginPath()
      for (let k = 0; k < 7; k++) {
        const px = x + S * (0.12 + 0.76 * rnd(row, col, k * 2 + 1))
        const py = y + S * (0.12 + 0.76 * rnd(row, col, k * 2 + 2))
        const a = Math.PI * rnd(row, col, k + 71)
        const L = S * 0.12
        ctx.moveTo(px - Math.cos(a) * L, py - Math.sin(a) * L)
        ctx.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L)
      }
      ctx.stroke()
      break
    }
    case 'leaves': {
      // Forest floor: proper fallen leaves, each with a midrib.
      for (let k = 0; k < 4; k++) {
        const px = x + S * (0.16 + 0.68 * rnd(row, col, k * 3 + 1))
        const py = y + S * (0.16 + 0.68 * rnd(row, col, k * 3 + 2))
        const a = Math.PI * rnd(row, col, k * 3 + 3)
        const rx = S * 0.085
        ctx.fillStyle = k === 3 ? EARTH(0.16) : GREEN(0.2)
        ctx.beginPath()
        ctx.ellipse(px, py, rx, rx * 0.45, a, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = k === 3 ? EARTH(0.24) : GREEN(0.3)
        ctx.lineWidth = Math.max(0.7, S * 0.012)
        ctx.beginPath()
        ctx.moveTo(px - Math.cos(a) * rx, py - Math.sin(a) * rx)
        ctx.lineTo(px + Math.cos(a) * rx, py + Math.sin(a) * rx)
        ctx.stroke()
      }
      break
    }
    case 'sand': {
      // Raked sand: alternating light and shaded ripple lines.
      ctx.lineWidth = Math.max(1, S * 0.028)
      ctx.lineCap = 'round'
      for (let k = 0; k < 3; k++) {
        const yy = y + S * (0.2 + 0.3 * k + 0.06 * (rnd(row, col, k + 91) - 0.5))
        ctx.strokeStyle = k === 1 ? INK(0.06) : LITE(0.3)
        ctx.beginPath()
        ctx.moveTo(x, yy)
        ctx.quadraticCurveTo(x + S * 0.5, yy + S * 0.09 * (k % 2 === 0 ? 1 : -1), x + S, yy)
        ctx.stroke()
      }
      break
    }
    case 'carpet': {
      // Carpet tiles: 2×2 quarters of fine diagonal pile, direction alternating
      // per quarter — the classic office chessboard weave.
      ctx.strokeStyle = INK(0.07)
      ctx.lineWidth = thin
      const h = S / 2
      ctx.beginPath()
      for (let j = 0; j < 2; j++)
        for (let i = 0; i < 2; i++) {
          const bx = x + i * h
          const by = y + j * h
          const flip = (row * 2 + j + col * 2 + i) % 2 === 0
          for (let k = 1; k < 4; k++) {
            const t = (k * h) / 2
            const ax = Math.max(0, t - h)
            const ay = Math.min(t, h)
            const ex = Math.min(t, h)
            const ey = Math.max(0, t - h)
            if (flip) {
              ctx.moveTo(bx + ax, by + ay)
              ctx.lineTo(bx + ex, by + ey)
            } else {
              ctx.moveTo(bx + h - ax, by + ay)
              ctx.lineTo(bx + h - ex, by + ey)
            }
          }
        }
      ctx.stroke()
      break
    }
    case 'carpetDiag': {
      // Soft velvet: one family of diagonal strokes.
      ctx.strokeStyle = INK(0.06)
      ctx.lineWidth = mid
      ctx.beginPath()
      for (let k = -1; k <= 2; k++) {
        ctx.moveTo(x + (k * S) / 2, y + S)
        ctx.lineTo(x + (k * S) / 2 + S, y)
      }
      ctx.stroke()
      break
    }
    case 'rubber': {
      // Stud mat: four fat raised studs — big enough to read as structure.
      ctx.fillStyle = INK(0.07)
      const h = S / 4
      for (let j = 0; j < 2; j++)
        for (let i = 0; i < 2; i++) {
          ctx.beginPath()
          ctx.arc(x + h + i * 2 * h, y + h + j * 2 * h, Math.max(2, S * 0.09), 0, Math.PI * 2)
          ctx.fill()
        }
      break
    }
    case 'lino': {
      // Classic lino: four filled diamonds, one per quadrant — the fine argyle
      // counterpart to checkerDiag's single big rhombus.
      ctx.fillStyle = INK(0.06)
      const h = S / 2
      for (let j = 0; j < 2; j++)
        for (let i = 0; i < 2; i++) {
          const bx = x + i * h
          const by = y + j * h
          ctx.beginPath()
          ctx.moveTo(bx + h / 2, by)
          ctx.lineTo(bx + h, by + h / 2)
          ctx.lineTo(bx + h / 2, by + h)
          ctx.lineTo(bx, by + h / 2)
          ctx.closePath()
          ctx.fill()
        }
      break
    }
    case 'terrazzo': {
      // Polished chip floor: a few LARGE angular flakes (filled quads, light
      // over dark) instead of specks.
      for (let k = 0; k < 3; k++) {
        const px = x + S * (0.18 + 0.64 * rnd(row, col, k * 6 + 1))
        const py = y + S * (0.18 + 0.64 * rnd(row, col, k * 6 + 2))
        const r = S * (0.1 + 0.06 * rnd(row, col, k * 6 + 3))
        const a = Math.PI * 2 * rnd(row, col, k * 6 + 4)
        const sq = 0.55 + 0.35 * rnd(row, col, k * 6 + 5)
        ctx.fillStyle = k === 2 ? INK(0.07) : LITE(0.32)
        ctx.beginPath()
        ctx.moveTo(px + r * Math.cos(a), py + r * Math.sin(a))
        ctx.lineTo(px + r * sq * Math.cos(a + 1.7), py + r * sq * Math.sin(a + 1.7))
        ctx.lineTo(px + r * Math.cos(a + 3.1), py + r * Math.sin(a + 3.1))
        ctx.lineTo(px + r * sq * Math.cos(a + 4.8), py + r * sq * Math.sin(a + 4.8))
        ctx.closePath()
        ctx.fill()
      }
      break
    }
    case 'splatter': {
      // Paint spills in three muted studio colours: big blobs with a drip tail
      // (no satellite dots).
      const paints = ['rgba(178, 72, 60, 0.2)', 'rgba(64, 98, 160, 0.2)', 'rgba(196, 158, 64, 0.22)']
      for (let k = 0; k < 3; k++) {
        const px = x + S * (0.15 + 0.7 * rnd(row, col, k * 4 + 1))
        const py = y + S * (0.15 + 0.7 * rnd(row, col, k * 4 + 2))
        const r = S * (0.055 + 0.045 * rnd(row, col, k * 4 + 3))
        const a = Math.PI * 2 * rnd(row, col, k * 4 + 4)
        ctx.fillStyle = paints[k]
        ctx.beginPath()
        ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(px + Math.cos(a) * r * 1.4, py + Math.sin(a) * r * 1.4, r * 0.8, r * 0.35, a, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
  }
  ctx.restore()
}
