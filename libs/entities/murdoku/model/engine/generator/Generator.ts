import { Rng } from './random.ts'
import { suspectPerson, victimPerson } from './names.ts'
import { loadLevel } from '../io/LevelLoader.ts'
import { Solution } from '../domain/Solution.ts'
import { SearchSolver } from '../solver/SearchSolver.ts'
import { findMurderer } from '../solver/murderer.ts'
import { DeductionEngine } from '../solver/DeductionEngine.ts'
import { checkLevel } from '../solver/validate.ts'
import { startCoverage } from '../solver/coverage.ts'
import { createClue } from '../clues/ClueFactory.ts'
import { createBoardClue } from '../clues/boardClues.ts'
import { VICTIM_ID, inDirection8, HAIR_COLORS } from '../domain/types.ts'
import type { AttributeValue, Cell, PersonId, Side } from '../domain/types.ts'
import { OBJECT_CATALOG, EDITOR_ONLY_TYPES, type ObjectDef } from '../domain/objects.ts'
import { furnishRooms, kitFor } from './furnishing.ts'
import type { Board } from '../domain/Board.ts'
import type { Puzzle } from '../domain/Puzzle.ts'
import type { BoardClueJson, LevelJson, SuspectJson } from '../io/LevelSchema.ts'
import type { ClueJson } from '../clues/ClueFactory.ts'
import type { ObjectMate } from '../clues/objectClues.ts'

interface Theme {
  id: string
  rooms: string[]
  /** Outdoor rooms: where a car may stand AND what counts as "outside" for inside/outside clues. */
  outdoor: string[]
}

// The generator places from the shared object catalog (same one the editor paints).
const ALL_OBJECTS: readonly ObjectDef[] = OBJECT_CATALOG
const OCCUPIABLE: ObjectDef[] = ALL_OBJECTS.filter((o) => o.occupiable)

/** Every placeable object type (for the UI's per-object toggles). Editor-only types
 *  (e.g. street, which must be laid as a continuous run) are excluded. */
export const GENERATOR_OBJECT_TYPES: string[] = ALL_OBJECTS.filter(
  (o) => !EDITOR_ONLY_TYPES.has(o.type),
).map((o) => o.type)

/** Object types that may occur by default; the rest are opt-in via `options.objects`. */
export const DEFAULT_OBJECT_TYPES: string[] = [
  'carpet',
  'chair',
  'bed',
  'table',
  'tv',
  'plant',
  'shelf',
  'box',
]

// Room names are i18n keys (room.*) so they translate in-game (de/en). Each theme
// lists 15 rooms; the generator picks a random subset per level.
const THEMES: Theme[] = [
  {
    id: 'apartment',
    rooms: ['room.bathroom', 'room.kitchen', 'room.living', 'room.guestroom', 'room.hallway', 'room.kids1', 'room.kids2', 'room.study', 'room.garage', 'room.bedroom', 'room.dining', 'room.balcony', 'room.storeroom', 'room.laundry', 'room.pantry'],
    outdoor: ['room.garage', 'room.balcony'],
  },
  {
    id: 'crime-scene',
    rooms: ['room.hallway', 'room.living', 'room.kitchen', 'room.bath', 'room.bedroom', 'room.office', 'room.basement', 'room.garage', 'room.dining', 'room.attic', 'room.guestroom', 'room.utilityroom', 'room.laundry', 'room.porch', 'room.kidsroom'],
    outdoor: ['room.garage', 'room.porch'],
  },
  {
    id: 'auto-shop',
    rooms: ['room.workshop', 'room.storage', 'room.office', 'room.waiting', 'room.yard', 'room.washbay', 'room.partsstore', 'room.tirestore', 'room.reception', 'room.paintshop', 'room.assembly', 'room.testbay', 'room.breakroom', 'room.checkout', 'room.gasstation'],
    outdoor: ['room.workshop', 'room.yard', 'room.washbay', 'room.assembly', 'room.paintshop', 'room.testbay', 'room.gasstation'],
  },
  {
    id: 'game-night',
    rooms: ['room.living', 'room.dining', 'room.kitchen', 'room.hallway', 'room.balcony', 'room.gameroom', 'room.bar', 'room.lounge', 'room.terrace', 'room.library', 'room.conservatory', 'room.vestibule', 'room.pantry', 'room.guestbath', 'room.study'],
    outdoor: ['room.balcony', 'room.terrace'],
  },
  {
    id: 'office',
    rooms: ['room.openoffice', 'room.meeting', 'room.kitchen', 'room.reception', 'room.serverroom', 'room.archive', 'room.bossoffice', 'room.copyroom', 'room.kitchenette', 'room.storage', 'room.conference', 'room.lobby', 'room.commonroom', 'room.mailroom', 'room.printroom'],
    outdoor: [],
  },
  {
    id: 'mansion',
    rooms: ['room.entrancehall', 'room.salon', 'room.dininghall', 'room.library', 'room.musicroom', 'room.conservatory', 'room.gallery', 'room.boudoir', 'room.smokingroom', 'room.ballroom', 'room.greenhouse', 'room.winecellar', 'room.servantsroom', 'room.dressingroom', 'room.firesideroom'],
    outdoor: [],
  },
  {
    id: 'hotel',
    rooms: ['room.lobby', 'room.frontdesk', 'room.restaurant', 'room.bar', 'room.suite', 'room.conference', 'room.spa', 'room.gym', 'room.kitchen', 'room.luggageroom', 'room.breakfastroom', 'room.rooftop', 'room.elevator', 'room.hallway', 'room.laundrette'],
    outdoor: ['room.rooftop'],
  },
  {
    id: 'school',
    rooms: ['room.classroom', 'room.assemblyhall', 'room.gymnasium', 'room.library', 'room.teachersroom', 'room.secretariat', 'room.schoolyard', 'room.chemlab', 'room.musichall', 'room.canteen', 'room.craftroom', 'room.computerroom', 'room.lockerroom', 'room.artroom', 'room.hallway'],
    outdoor: ['room.schoolyard'],
  },
  {
    id: 'hospital',
    rooms: ['room.reception', 'room.waitingroom', 'room.operating', 'room.ward', 'room.lab', 'room.pharmacy', 'room.xray', 'room.icu', 'room.commonroom', 'room.emergency', 'room.deliveryroom', 'room.sterilization', 'room.office', 'room.cafeteria', 'room.hallway'],
    outdoor: [],
  },
  {
    id: 'museum',
    rooms: ['room.entrancehall', 'room.maingallery', 'room.exposition', 'room.vault', 'room.cafe', 'room.security', 'room.workshop', 'room.archive', 'room.cloakroom', 'room.specialexhibit', 'room.foyer', 'room.library', 'room.storage', 'room.auditorium', 'room.restroom'],
    outdoor: [],
  },
  {
    id: 'restaurant',
    rooms: ['room.dininghall', 'room.kitchen', 'room.bar', 'room.winecellar', 'room.terrace', 'room.storage', 'room.office', 'room.reception', 'room.scullery', 'room.preproom', 'room.coldroom', 'room.staffroom', 'room.lounge', 'room.restroom', 'room.cloakroom'],
    outdoor: ['room.terrace'],
  },
  {
    id: 'farm',
    rooms: ['room.pasture', 'room.yard', 'room.garden', 'room.shed', 'room.farmhouse', 'room.cowshed', 'room.pigsty', 'room.barn', 'room.henhouse', 'room.stable', 'room.greenhouse', 'room.pantry', 'room.dairy', 'room.field', 'room.pond'],
    outdoor: ['room.pasture', 'room.yard', 'room.garden', 'room.field', 'room.pond'],
  },
  {
    id: 'supermarkt',
    rooms: ['room.checkout', 'room.snacks', 'room.drinks', 'room.deli', 'room.fruit', 'room.chilled', 'room.toys', 'room.stockroom', 'room.bakery', 'room.produce', 'room.cheese', 'room.frozen', 'room.drugstore', 'room.staffroom', 'room.parking'],
    outdoor: ['room.parking'],
  },
  {
    id: 'police-station',
    rooms: ['room.evidenceroom', 'room.openoffice', 'room.receptionarea', 'room.chiefoffice', 'room.interrogation', 'room.cell1', 'room.cell2', 'room.armory', 'room.forensics', 'room.dispatch', 'room.lockerroom', 'room.breakroom', 'room.archive', 'room.briefing', 'room.garage'],
    outdoor: ['room.garage'],
  },
  {
    id: 'camping',
    rooms: ['room.forest', 'room.clearing', 'room.lake', 'room.campsite1', 'room.campsite2', 'room.campfire', 'room.picnicarea', 'room.jetty', 'room.playground', 'room.parking', 'room.restroom', 'room.showers', 'room.kiosk', 'room.reception', 'room.cabin'],
    outdoor: ['room.forest', 'room.clearing', 'room.lake', 'room.campsite1', 'room.campsite2', 'room.campfire', 'room.picnicarea', 'room.jetty', 'room.playground', 'room.parking'],
  },
  {
    id: 'castle',
    rooms: ['room.throneroom', 'room.knightshall', 'room.armory', 'room.chapel', 'room.dungeon', 'room.towerroom', 'room.battlements', 'room.courtyard', 'room.stable', 'room.winecellar', 'room.castlekitchen', 'room.library', 'room.chamber', 'room.gatehouse', 'room.moat'],
    outdoor: ['room.battlements', 'room.courtyard', 'room.moat'],
  },
  {
    id: 'pool',
    rooms: ['room.mainpool', 'room.kidspool', 'room.lawn', 'room.sauna', 'room.steamroom', 'room.slidetower', 'room.massage', 'room.relaxroom', 'room.lockerroom', 'room.showers', 'room.restroom', 'room.kiosk', 'room.bar', 'room.reception', 'room.terrace'],
    outdoor: ['room.mainpool', 'room.kidspool', 'room.lawn', 'room.slidetower', 'room.terrace'],
  },
]
const ROOM_COLORS = ['#e8d8b0', '#b9d0e6', '#cfe0cf', '#d8c0c0', '#e6cda0', '#e6c0d2', '#c6c0e0', '#c0e0c8']

/** Theme ids the generator knows (for the UI's theme picker). */
export const THEME_IDS: string[] = THEMES.map((t) => t.id)

/** A theme's room names (used as nameKeys, same as generated levels). */
export function themeRooms(id: string): string[] {
  return (THEMES.find((t) => t.id === id) ?? THEMES[0]).rooms
}

/** A theme's outdoor room names (→ rooms[].outside for inside/outside clues). */
export function themeOutdoor(id: string): string[] {
  return (THEMES.find((t) => t.id === id) ?? THEMES[0]).outdoor
}

/**
 * The object types that naturally belong to a theme — every object any of its rooms'
 * archetypes would place (a farm offers animals, a supermarket fridges, a garage cars).
 * The generator UI uses this to PRE-SELECT sensible objects when a theme is picked; the
 * user can still toggle. For "random" (no theme) it returns the plain defaults.
 */
export function themeDefaultObjects(themeId?: string): string[] {
  const theme = THEMES.find((t) => t.id === themeId)
  if (!theme) return [...DEFAULT_OBJECT_TYPES]
  return kitFor(theme.rooms, theme.outdoor)
}

/**
 * Guess which theme a level belongs to from its room nameKeys — the theme whose
 * room set shares the most keys with the level. Used by the editor to preselect
 * the theme when opening an existing level. Returns null if nothing overlaps
 * (e.g. a level using only generic room.editor* slots), so callers can keep a default.
 */
export function themeFromRoomKeys(keys: readonly string[]): string | null {
  const wanted = new Set(keys)
  let best: { id: string; score: number } | null = null
  for (const theme of THEMES) {
    const score = theme.rooms.reduce((n, key) => n + (wanted.has(key) ? 1 : 0), 0)
    if (score > 0 && (!best || score > best.score)) best = { id: theme.id, score }
  }
  return best?.id ?? null
}

export type GenDifficulty = 'easy' | 'medium' | 'hard'

/**
 * How long the generator may search. The CALLER sets this: the Web Worker passes a
 * generous budget (it can run long because Cancel = worker.terminate() kills it
 * instantly), while the main-thread fallback passes a tight one (there a synchronous
 * run blocks the UI and Cancel can't interrupt). Omitted → each entry point's own
 * historical default (so dev tools / tests are unaffected).
 */
export interface GenBudget {
  /** Max generation attempts before giving up. */
  maxAttempts: number
  /** Soft budget (ms): once a candidate exists, stop hunting for a better one. */
  softMs: number
  /** Hard wall-clock cap (ms): give up (and report failure) even with nothing found. */
  hardMs: number
}

export interface GenerateOptions {
  width: number
  height: number
  suspects: number
  seed?: number
  themeId?: string
  difficulty?: GenDifficulty
  /** Object types allowed on the board (default: DEFAULT_OBJECT_TYPES). */
  objects?: string[]
  /** Allow windows (on by default); some levels then get 2–6 of them. */
  windows?: boolean
  /** Place a few doors between rooms (enables "beside a door" clues). */
  doors?: boolean
  /** Search budget (see GenBudget). Omitted → historical defaults. */
  budget?: GenBudget
}

/** Random traits: gender; men beard/bald; everyone glasses + hair colour. */
function makeAttributes(gender: 'm' | 'f', rng: Rng): Record<string, AttributeValue> {
  const attrs: Record<string, AttributeValue> = { gender }
  attrs.glasses = rng.chance(0.4)
  attrs.beard = gender === 'm' && rng.chance(0.5)
  attrs.bald = gender === 'm' && rng.chance(0.3)
  // A bald person has no hair → no hair colour (the avatar draws none), so hair clues
  // never hinge on them. They can still be asked about via the `bald` trait.
  if (attrs.bald !== true) attrs.hair = rng.pick(HAIR_COLORS)
  return attrs
}

/** Bias the random traits so each pinned "Vorgabe" value has ≥ count+1 carriers among
 *  the suspects: an existence clue ("≥count others with hair=white in the room") can only
 *  be generated if enough suspects actually wear it. Respects gender for beard/bald (men
 *  only). The +1 buffer gives the placement room to put `count` of them with a host.
 *  Raises the odds only — placement still has to co-locate them (the retry loop handles
 *  the rest). */
function seedRequiredAttributes(
  suspects: SuspectJson[],
  reqs: { attribute: string; value: AttributeValue; count: number }[],
  rng: Rng,
): void {
  for (const { attribute, value, count } of reqs) {
    const need = count + 1
    const has = (s: SuspectJson): boolean => s.attributes?.[attribute] === value
    const eligible = (s: SuspectJson): boolean =>
      attribute === 'beard' || attribute === 'bald' ? s.attributes?.gender === 'm' : true
    let carriers = suspects.filter(has).length
    if (carriers >= need) continue
    for (const s of rng.shuffle(suspects.filter((s) => !has(s) && eligible(s)))) {
      if (carriers >= need) break
      const attrs = { ...(s.attributes ?? {}), [attribute]: value }
      // Changing someone to female drops the men-only traits so the suspect stays consistent.
      if (attribute === 'gender' && value === 'f') {
        attrs.beard = false
        attrs.bald = false
      }
      // A hair colour means visible hair → the carrier can't be bald.
      if (attribute === 'hair') attrs.bald = false
      s.attributes = attrs
      carriers++
    }
  }
}

/** Human-logic rating — the construction oracle. The DEFAULT engine is PURE forward +
 *  convergent deduction (no "assume X → contradiction"), so a level it fully solves is
 *  BOTH human-solvable AND unique (the engine never guesses). `maxRank` is the hardest
 *  technique the solution needs. One cheap call gives uniqueness + difficulty AND the
 *  guarantee that the hint chain a player follows is free of trial-and-error. A level
 *  that needs a contradiction simply comes back `solved: false` and is rejected. */
/** Combinatorial "chain" techniques — the cross-referencing reasoning the user enjoys
 *  at hard ("E & F take columns 2+3 ⇒ nobody else there ⇒ B is column 1 ⇒ D column 8"):
 *  naked groups / rectangle (set reservation), forced cells ("doppelter Ausschluss"),
 *  and the counting/capacity rules. NOT the trivial naked-single domino. */
const CHAIN_TECHNIQUES = [
  'nakedGroupRows', 'nakedGroupCols', 'rectangle',
  'forcedCell',
  'boardCount', 'emptyRooms', 'emptyRoomForcing', 'roomAssignment',
  'roomCapacity', 'roomCoverage', 'companionPairing', 'companionFit',
] as const

function logicRating(level: LevelJson): { solved: boolean; unique: boolean; maxRank: number; chainSteps: number } {
  // Accept ONLY levels solvable by straight forward deduction — NO case split. The user
  // found auto-generated case-splits ("Fallunterscheidung") too frequent and too deep to
  // solve by hand. Players/hints still get the full pipeline for hand-made levels.
  const puzzle = loadLevel(level)
  const result = new DeductionEngine(puzzle, { noCaseSplit: true }).solve()
  const chainSteps = CHAIN_TECHNIQUES.reduce((n, t) => n + (result.techniqueCounts[t] ?? 0), 0)
  // Same uniqueness primitive `checkLevel` uses — but only when the level is forward-solvable
  // (counting solutions on a dead candidate would needlessly exhaust the board, and the
  // search tries hundreds of candidates under a <1-min budget). This folds the scattered
  // inline `countSolutions(2) === 1` checks into ONE place the whole generator search reuses.
  const unique = result.solved && new SearchSolver(puzzle).isUnique()
  return { solved: result.solved, unique, maxRank: result.maxRank, chainSteps }
}

/** The hardest forward-deduction rank that DEFINES each tier (see TECHNIQUE_RANK):
 *  medium MUST need a rank-4 room/count deduction, hard a rank-5 one (murder rule,
 *  group-room reasoning, or the CONVERGENT "egal wo X → raus" case split) — all pure
 *  human logic; contradiction case splits and forcing/SAT are never used. */
const TARGET_RANK: Record<GenDifficulty, number> = { easy: 1, medium: 4, hard: 5 }
const targetRankOf = (d?: GenDifficulty): number => (d ? TARGET_RANK[d] : TARGET_RANK.hard)

/** Honest tier from the rank a level actually needs: rank ≥5 ⇒ hard (murder rule),
 *  rank 4 ⇒ medium (room counting), below ⇒ easy. Lets a level that falls short of its
 *  requested tier be labelled by what it truly is. */
function rankToTier(maxRank: number): GenDifficulty {
  if (maxRank >= TARGET_RANK.hard) return 'hard'
  if (maxRank >= TARGET_RANK.medium) return 'medium'
  return 'easy'
}

/**
 * Start-coverage bar per tier (easy is exempt). Two complementary checks so the
 * board feels FULL without demanding that every clue is broad:
 *  - `constrainedRatio`: union over suspects whose clue actually pins cells —
 *    "allein"/"im selben Raum wie X" can't game the union (hard ≥85%, medium ≥75%);
 *  - `avgBreadth`: a few broad clues ("nicht neben einer Pflanze", "nicht in einer
 *    Ecke") must lift the mean domain size (hard ≥25%, medium ≥18%) — tight 2-cell
 *    anchors stay legitimate, reference levels sit at 27–39%.
 */
/** Gentle breadth preference (NO fixed bars, per the user): among comparable
 *  candidates, the level whose clues keep more of the board open wins — measured as
 *  the union over restricted suspects ("allein" etc. can't game it). */
function breadthPenalty(level: LevelJson): number {
  return Math.round((1 - startCoverage(loadLevel(level)).constrainedRatio) * 60)
}

/**
 * The "hard" clue families — relational/social clues a player can only use by
 * cross-referencing OTHER people: "one direction from <person>", "beside the same
 * <object> as <person / someone with a trait>", and the whole "in a room WITH
 * someone (with a trait)" group. They are inherently BROAD (many candidate cells),
 * so piling many of them onto a level makes it both harder and more open — the
 * user's definition of a hard level (à la Museum / Der Bauernhof), as opposed to
 * the old "needs a rank-5 technique" definition. Scales with the board on its own:
 * more suspects ⇒ room for more such clues.
 */
const HARD_CLUE_TYPES = new Set<string>([
  'direction', // one direction from a person
  'directionFromAttr', // one direction from someone with a trait
  'besideSameObject', // same object instance as a person / someone with a trait
  'roomExists', // in a room where someone (with a trait) was on/beside an object
  'roomCompanion', // alone with someone who has a trait
  'roomAttribute', // none / someone / everyone else in the room had a trait
  'sameRoom', // same room as a person
  'insideXor', // exactly one of the two was outside
])

/** Leaf clue types, flattening `and` and unwrapping `not`. */
function leafTypes(clue: ClueJson): string[] {
  if (clue.type === 'and') return clue.clues.flatMap(leafTypes)
  if (clue.type === 'not') return leafTypes(clue.clue)
  return [clue.type]
}

/** Families EXEMPT from the "max 2 per family" variety cap: each instance reads as a
 *  DIFFERENT clue (a different object / room / window-vs-door), so repeating them isn't
 *  monotonous — unlike a chain of "north of …". Row/column clues are NOT exempt: they're
 *  capped AND actively avoided (especially at easy). */
const UNCAPPED_TYPES = new Set<string>([
  'onObject', 'uniqueOnObject',
  'nearObject', 'uniqueNearObject', 'nearObjectAny',
  'inRoom',
  'nearWindow', 'uniqueNearWindow',
  'nearDoor', 'uniqueNearDoor',
])
/** The capped families of a clue (the ones the variety limit counts). Row and column
 *  clues collapse to one "line" family; the two person/attribute direction clues collapse
 *  to one "direction" family (so "west of Alex" and "south-west of Alex" — or two
 *  directions off ANY anchor — count together and can't both appear). */
const cappedFamilies = (clue: ClueJson): string[] =>
  leafTypes(clue)
    .filter((t) => !UNCAPPED_TYPES.has(t))
    .map((t) => {
      if (t === 'inRow' || t === 'inCol') return 'line'
      if (t === 'direction' || t === 'directionFromAttr') return 'direction'
      return t
    })

/** Per-family variety limit: at most ONE "line" (row/column) clue per level — the user
 *  finds two "in row/column X" clues poor puzzling — at most ONE person/attribute
 *  "direction" clue (two directions, e.g. off the same person, read repetitive and pile up
 *  at hard), and at most two of every other capped family. */
const familyCap = (family: string): number =>
  family === 'line' || family === 'direction' ? 1 : 2

/** Does a suspect's clue use a HARD (relational/social) family? */
const isHardClue = (clue: ClueJson): boolean => leafTypes(clue).some((t) => HARD_CLUE_TYPES.has(t))

/** Canonical signature of a clue, independent of `and`-part order and key order. Two
 *  suspects whose clue has the same signature show the IDENTICAL hint — which the user
 *  rejects: never the exact same clue twice in one level. The subject ("he/she") is NOT
 *  part of the clue, so "he was not beside a locker" and "she was not beside a locker"
 *  count as the same. */
function clueSig(clue: ClueJson): string {
  if (clue.type === 'and') return `and(${clue.clues.map(clueSig).sort().join('|')})`
  if (clue.type === 'not') return `not(${clueSig(clue.clue)})`
  const params = Object.keys(clue)
    .filter((k) => k !== 'type')
    .sort()
    .map((k) => `${k}=${JSON.stringify((clue as Record<string, unknown>)[k])}`)
  return `${clue.type}(${params.join(',')})`
}

/** How many of these clues are an exact repeat of an earlier one (0 ⇒ all distinct). */
function duplicateClueCount(clues: ClueJson[]): number {
  const seen = new Set<string>()
  let dup = 0
  for (const c of clues) {
    const sig = clueSig(c)
    if (seen.has(sig)) dup++
    else seen.add(sig)
  }
  return dup
}

/** An EXACT-coordinate clue: it pins ONE axis precisely — a fixed row/column, or an exact
 *  cell-distance offset from someone. TWO of them together reveal the exact cell, which the
 *  user forbids ("one offset is great, but never two that give away the direct spot"). */
function isExactAxisClue(clue: ClueJson): boolean {
  const t = clue.type === 'not' ? clue.clue.type : clue.type
  return t === 'offset' || t === 'inRow' || t === 'inCol'
}

/** How many suspects carry a hard relational/social clue. */
function hardClueCount(level: LevelJson): number {
  let n = 0
  for (const s of level.suspects) if ((s.clues ?? []).some(isHardClue)) n++
  return n
}

/** Size-scaled goal for hard: a majority of suspects should carry a hard clue
 *  (4×4 ≈ 2, 6×6 ≈ 3, 9×9 ≈ 5) — "many hard clues, scaled to the board" per the user. */
function wantHardClues(level: LevelJson): number {
  return Math.max(1, Math.round(level.suspects.length * 0.6))
}

/** Honest tier for a solvable candidate. HARD is COMPOSITION-driven: hard once it
 *  carries enough hard relational clues OR still needs the rank-5 murder rule;
 *  otherwise rated by the rank it truly needs. Medium/easy stay purely rank-based. */
function tierFor(level: LevelJson, target: GenDifficulty | undefined, maxRank: number): GenDifficulty {
  if (target === 'hard' && (hardClueCount(level) >= wantHardClues(level) || maxRank >= TARGET_RANK.hard)) {
    return 'hard'
  }
  return rankToTier(maxRank)
}

/** Score a solvable candidate (lower = better). HARD is driven by COMPOSITION — many
 *  broad relational/social clues, with the technique rank demoted to a soft floor (must
 *  stay at least medium-hard) — so the generator stops returning the same few rank-5
 *  levels and instead piles on hard, board-opening clues. Easy/medium keep the
 *  rank-nearness score (then few pins, breadth, few line clues). */
function scoreLevel(
  level: LevelJson,
  target: GenDifficulty | undefined,
  maxRank: number,
  pins: number,
  chainSteps = 0,
): number {
  const lines = countLineClues(level)
  if (target === 'hard') {
    const breadth = Math.round(startCoverage(loadLevel(level)).avgBreadth * 100)
    const floorMiss = Math.max(0, TARGET_RANK.medium - maxRank) // below medium ⇒ heavy penalty
    // Breadth stays; chains are a BONUS on top — prefer levels whose solution needs
    // combinatorial cross-referencing over a flat clue→place→place cascade.
    return (
      floorMiss * 2000 -
      hardClueCount(level) * 200 -
      breadth -
      chainSteps * 150 +
      pins * 100 +
      lines * 50
    )
  }
  const rankMiss = Math.abs(maxRank - targetRankOf(target))
  // Row/column clues read as dull coordinates — prefer the attempt with fewer (the user
  // wants them rare at easy). The per-attempt line reduction is the main lever; this only
  // breaks ties when several candidates exist.
  return rankMiss * 1000 + pins * 100 + lines * 20 + breadthPenalty(level)
}

/** A candidate good enough to stop the search early. For hard that means it already
 *  reaches the size-scaled hard-clue goal (and stays ≥ medium-hard); otherwise it is
 *  the exact target rank. Pins / line clues must be absent either way. */
function isIdeal(level: LevelJson, target: GenDifficulty | undefined, maxRank: number, pins: number): boolean {
  if (pins !== 0 || countLineClues(level) !== 0) return false
  if (target === 'hard') return maxRank >= TARGET_RANK.medium && hardClueCount(level) >= wantHardClues(level)
  return maxRank === targetRankOf(target)
}

/** Cap on "was in row X / column Y" clues per level (rows + columns combined) — they are
 *  coordinate-y and dull, so keep them scarce. */
const MAX_LINE_CLUES = 1

/** One generation attempt → a candidate level (with its pin count), or null. */
type Attempt = (rng: Rng, seedIndex: number) => { level: LevelJson; pins: number } | null

interface PickOptions {
  /** Cap on attempts (default 80). */
  maxAttempts?: number
  /** Soft budget: once a candidate exists, stop hunting for a better one (default 2800ms). */
  timeBudgetMs?: number
  /** Hard cap: give up even with nothing found yet (default: none — keep trying to the
   *  attempt cap). The fixed-board fill sets this so a stubborn board can't hang. */
  hardTimeBudgetMs?: number
}

/**
 * Run many attempts and keep the best PURE-LOGIC candidate for the target tier. Every
 * eligible level is solvable by forward + convergent deduction (⇒ unique) with NO
 * proof-by-contradiction; among those the score prefers the exact target rank, then
 * pin-free, then line-free. A board that can't reach the target rank still yields its
 * loosest human-solvable level (rated honestly by `rankToTier`), so we always return a
 * logical level — never a trial-and-error one. Returns null only if nothing solves.
 */
function pickBestLevel(
  attempt: Attempt,
  baseSeed: number,
  target: GenDifficulty | undefined,
  opts: PickOptions = {},
): LevelJson | null {
  const maxAttempts = opts.maxAttempts ?? 120
  const softDeadline = performance.now() + (opts.timeBudgetMs ?? 3000)
  // Generation must ALWAYS finish well under a minute (user requirement).
  const hardDeadline = performance.now() + (opts.hardTimeBudgetMs ?? 45000)
  let best: LevelJson | null = null
  let bestScore = Infinity
  for (let a = 0; a < maxAttempts; a++) {
    const result = attempt(new Rng(baseSeed + a * 7919), baseSeed + a)
    if (result) {
      const rating = logicRating(result.level)
      // Only human-solvable levels are eligible — the player must be able to solve by a
      // clean forward/convergent chain, never "assume X → contradiction". For hard the
      // score then maximises hard relational clues + breadth (rank only a floor); for
      // easy/medium it prefers the exact target rank. `rating.unique` is the SearchSolver
      // uniqueness check (guarantees uniqueness independent of engine soundness — a dense
      // object layout can shift the solution space, and a non-unique level must never slip).
      if (rating.solved && rating.unique) {
        result.level.difficulty = tierFor(result.level, target, rating.maxRank)
        const score = scoreLevel(result.level, target, rating.maxRank, result.pins, rating.chainSteps)
        if (score < bestScore) {
          best = result.level
          bestScore = score
        }
        if (isIdeal(result.level, target, rating.maxRank, result.pins)) break
      }
    }
    // Once we hold a candidate, stop at the soft deadline; with nothing yet keep hunting
    // to the attempt cap / hard deadline (the worker passes a long budget, the
    // main-thread fallback a short one).
    if (best && performance.now() > softDeadline) break
    if (performance.now() > hardDeadline) break
  }
  return best
}

/**
 * Final tidy-up before a generated level ships: drop every clue the puzzle does NOT
 * actually need — ESPECIALLY the bonus board (global) clues, which are pure flavour and
 * are usually pointless in a generated level. A clue is removed only while the level stays
 * uniquely & human-solvably (forward deduction ⇒ unique, double-checked with countSolutions)
 * AND keeps its difficulty tier. Each suspect always keeps at least one clue; compound
 * (AND) suspect clues may shed redundant parts. Returns the pruned level.
 */
function pruneClues(level: LevelJson, target: GenDifficulty | undefined): LevelJson {
  const tier = level.difficulty as GenDifficulty
  // A candidate is acceptable iff still unique, human-solvable, and the SAME tier (and for
  // easy: still solvable by the simple rank-≤2 steps that define easy).
  const accepts = (lv: LevelJson): boolean => {
    const r = logicRating(lv)
    if (!r.solved || !r.unique) return false
    if (tierFor(lv, target, r.maxRank) !== tier) return false
    // Shedding an ANDed part must not collapse a clue onto another suspect's clue — the
    // user forbids two identical hints (the dedup is enforced in construction; keep it here).
    if (duplicateClueCount(lv.suspects.flatMap((s) => s.clues ?? [])) > 0) return false
    return tier !== 'easy' || r.maxRank <= 2
  }

  let work = level

  // 1) Board (global) clues — drop any that aren't needed. These are bonus flavour, so
  //    they almost always go (exactly what the user wants).
  if (work.boardClues && work.boardClues.length > 0) {
    const kept: BoardClueJson[] = []
    const all = work.boardClues
    for (let i = 0; i < all.length; i++) {
      const trial: LevelJson = { ...work, boardClues: [...kept, ...all.slice(i + 1)] }
      if (!accepts(trial)) kept.push(all[i]) // needed → keep it
    }
    work = { ...work, boardClues: kept }
  }

  // 2) Suspect clues — shed redundant ANDed parts (never below one clue per suspect).
  //    Committed incrementally so each test sees the already-pruned earlier suspects.
  for (const id of work.suspects.map((s) => s.id)) {
    const clue = work.suspects.find((s) => s.id === id)!.clues?.[0]
    if (!clue || clue.type !== 'and') continue
    let parts = clue.clues
    let changed = false
    for (let i = parts.length - 1; i >= 0 && parts.length > 1; i--) {
      const trial = parts.filter((_, j) => j !== i)
      const trialClue: ClueJson = trial.length === 1 ? trial[0] : { type: 'and', clues: trial }
      const lv: LevelJson = {
        ...work,
        suspects: work.suspects.map((s) => (s.id === id ? { ...s, clues: [trialClue] } : s)),
      }
      if (accepts(lv)) { parts = trial; changed = true }
    }
    if (changed) {
      const newClue: ClueJson = parts.length === 1 ? parts[0] : { type: 'and', clues: parts }
      work = { ...work, suspects: work.suspects.map((s) => (s.id === id ? { ...s, clues: [newClue] } : s)) }
    }
  }

  return work
}

/** Is this the EXACT level safe to hand to a player: uniquely solvable AND crackable by
 *  straight forward deduction (no case split — the generator's fairness bar)? Uses the SAME
 *  `checkLevel` the editor's Check/Save use (DRY) — only `forwardOnly` tightens the bar. */
function isShippable(level: LevelJson): boolean {
  const c = checkLevel(loadLevel(level), { forwardOnly: true })
  return c.unique && c.solvable
}

/** Final gate before a generated level is returned: re-verify the EXACT level being shipped
 *  is unique AND forward-solvable, and REFUSE (throw) otherwise — a generation failure is
 *  always better than handing a player an ambiguous or unsolvable case. Should never fire
 *  (earlier stages guarantee it); it exists so a future regression can't ship a broken level. */
function assertShippable(level: LevelJson): LevelJson {
  const c = checkLevel(loadLevel(level), { forwardOnly: true })
  if (!c.unique || !c.solvable) {
    throw new Error(`Generated level failed final validation (forwardSolvable=${c.solvable}, unique=${c.unique})`)
  }
  return level
}

/** Generate a uniquely-solvable level. Throws if no seed yields one. */
export function generateLevel(options: GenerateOptions): LevelJson {
  const { width, height, suspects } = options
  const baseSeed = options.seed ?? Math.floor(Math.random() * 1e9)
  const pick = options.budget ? pickOptsFrom(options.budget) : {}

  // EASY is forward-constructed (cleaner, more easy-typical puzzles), but the
  // construction lands far less often on a random, sparsely-furnished board than on
  // a hand-drawn editor board — on some sizes effectively never. So: try the
  // construction up to the budget (fast-failing attempts), and if nothing lands,
  // fall back to generic selection rated nearest to easy so we ALWAYS return a level.
  if (options.difficulty === 'easy') {
    const deadline = performance.now() + (options.budget?.hardMs ?? 20000)
    for (let a = 0; a < 200000 && performance.now() < deadline; a++) {
      const result = tryGenerate(options, new Rng(baseSeed + a * 7919), baseSeed + a)
      if (result) {
        // The construction already guarantees an easy-typical puzzle (rank ≤ 2,
        // hidden singles at most) — so it IS easy. Label it directly instead of
        // re-rating: difficultyOf treats a hidden single (rank 2) as "medium",
        // which would mislabel almost every constructed easy level.
        result.level.difficulty = 'easy'
        return assertShippable(pruneClues(result.level, 'easy'))
      }
    }
    const fallback = pickBestLevel(
      (rng, seedIndex) => tryGenerate(options, rng, seedIndex, false),
      baseSeed + 104729,
      'easy',
      pick,
    )
    if (fallback) return assertShippable(pruneClues(fallback, 'easy'))
    throw new Error(`Could not generate an easy ${width}x${height} level for ${suspects} suspects`)
  }

  const level = pickBestLevel(
    (rng, seedIndex) => tryGenerate(options, rng, seedIndex),
    baseSeed,
    options.difficulty,
    pick,
  )
  if (!level) throw new Error(`Could not generate a ${width}x${height} level for ${suspects} suspects`)
  return assertShippable(pruneClues(level, options.difficulty))
}

export interface FillBoardOptions {
  difficulty?: GenDifficulty
  seed?: number
  /** Search budget (see GenBudget). Omitted → historical defaults. */
  budget?: GenBudget
  /** "Zufällig setzen mit Vorgaben": one predicate PER required clue type. Each must be
   *  satisfied by at least one suspect — that suspect is restricted to the matching shape,
   *  everyone else keeps the full vocabulary (the generator fills the rest). Built in the
   *  game layer from the editor's constraint palette. */
  requiredClues?: ((json: ClueJson) => boolean)[]
  /** "Vorgaben" pinned trait values (built in the game layer). The generator seeds the
   *  random trait assignment so ≥ count+1 suspects carry each value — an existence clue
   *  like "≥count others with hair=white in the room" can only hold if enough suspects
   *  actually wear it; pure random assignment over many colours rarely produces enough. */
  requiredAttributes?: { attribute: string; value: AttributeValue; count: number }[]
}

/** Translate a caller budget into pickBestLevel's knobs. */
function pickOptsFrom(budget: GenBudget): PickOptions {
  return { maxAttempts: budget.maxAttempts, timeBudgetMs: budget.softMs, hardTimeBudgetMs: budget.hardMs }
}

/**
 * Keep a finished board (rooms / objects / windows / doors / global clues) EXACTLY
 * as given, but (re)generate the people: fresh names + traits and a clue per suspect
 * so the murder puzzle is uniquely solvable at the requested difficulty. Suspect ids
 * and count come from `board.suspects`. Clues are restricted to the editor's flat
 * vocabulary so the result round-trips into the editor. Returns the filled level, or
 * null if no unique arrangement exists on this board.
 */
export function fillBoardClues(board: LevelJson, options: FillBoardOptions = {}): LevelJson | null {
  const suspectIds = board.suspects.map((s) => s.id)
  if (suspectIds.length === 0) return null
  const baseSeed = options.seed ?? Math.floor(Math.random() * 1e9)

  // EASY: every successful attempt is ALREADY a valid easy puzzle (≤2 simple clues, no
  // contradiction). On a hard/uniform board such layouts are rare, so we just keep trying
  // fresh placements until one lands or a generous time budget runs out — taking the first
  // that works (the user chose "search longer" over a guaranteed result).
  if (options.difficulty === 'easy') {
    const deadline = performance.now() + (options.budget?.hardMs ?? 20000)
    for (let a = 0; a < 200000 && performance.now() < deadline; a++) {
      const result = fillAttempt(board, suspectIds, new Rng(baseSeed + a * 7919), 'easy', options.requiredClues, options.requiredAttributes)
      if (result && isShippable(result.level)) {
        // Constructed easy fill (rank ≤ 2, verified in fillAttempt) — label it easy
        // directly; difficultyOf would mislabel a hidden-single level as "medium".
        result.level.difficulty = 'easy'
        return result.level
      }
    }
    return null
  }

  // The board is fixed, so a fill is harder to land than free generation — give it
  // more attempts but a firm time bound (it runs in a worker with a cancel button).
  const pick = options.budget
    ? pickOptsFrom(options.budget)
    : { maxAttempts: 400, timeBudgetMs: 5000, hardTimeBudgetMs: 20000 }
  const filled = pickBestLevel(
    (rng) => fillAttempt(board, suspectIds, rng, options.difficulty, options.requiredClues, options.requiredAttributes),
    baseSeed,
    options.difficulty,
    pick,
  )
  // Final gate: only return a fill that is genuinely unique & forward-solvable.
  return filled && isShippable(filled) ? filled : null
}

/** One people-fill attempt on the fixed board: fresh identities, a valid hidden
 *  placement consistent with the board's global clues, and editor-safe clues. */
function fillAttempt(
  board: LevelJson,
  suspectIds: PersonId[],
  rng: Rng,
  difficulty?: GenDifficulty,
  requiredClues?: ((json: ClueJson) => boolean)[],
  requiredAttributes?: { attribute: string; value: AttributeValue; count: number }[],
): { level: LevelJson; pins: number } | null {
  const usedName = new Set<string>()
  const suspectMeta: SuspectJson[] = suspectIds.map((id, i) => {
    const gender: 'm' | 'f' = rng.chance(0.5) ? 'm' : 'f'
    const person = suspectPerson(i, gender, usedName)
    return { id, name: person.name, attributes: makeAttributes(gender, rng), clues: [] }
  })
  if (requiredAttributes && requiredAttributes.length > 0) {
    seedRequiredAttributes(suspectMeta, requiredAttributes, rng)
  }
  const victim = victimPerson(rng)
  const victimMeta = { name: victim.name, attributes: makeAttributes(victim.gender, rng) }
  const base: LevelJson = { ...board, suspects: suspectMeta, victim: victimMeta }
  const basePuzzle = loadLevel(base)

  const placement = placeOnBoard(basePuzzle, suspectIds, rng)
  if (!placement) return null
  const solution = new Solution(placement)

  const candidates = new Map<PersonId, ClueJson[]>()
  for (const id of suspectIds) {
    const others = suspectIds.filter((o) => o !== id)
    candidates.set(id, candidatesFor(id, solution, basePuzzle, others, true))
  }

  // "Vorgaben": every required clue type must be USED by at least one suspect. Assign each
  // required type to a DISTINCT suspect whose placement supports it (restricting that
  // suspect to the matching shape); all other suspects keep the full vocabulary, so the
  // generator fills the rest and a unique solution stays reachable. If a type fits nobody
  // in this layout, abandon the attempt — a fresh placement may work.
  if (requiredClues && requiredClues.length > 0) {
    if (requiredClues.length > suspectIds.length) return null
    const taken = new Set<PersonId>()
    // Most-constrained type first (fewest possible hosts) → better greedy matching.
    const byScarcity = requiredClues
      .map((pred) => ({ pred, hosts: suspectIds.filter((id) => candidates.get(id)!.some(pred)) }))
      .sort((a, b) => a.hosts.length - b.hosts.length)
    for (const { pred, hosts } of byScarcity) {
      // Pick a RANDOM qualifying suspect (not always the first), so the constraint isn't
      // always pinned to suspect A — any eligible suspect may carry it.
      const host = rng.shuffle(hosts.filter((id) => !taken.has(id)))[0]
      if (host === undefined) return null
      taken.add(host)
      candidates.set(host, candidates.get(host)!.filter(pred))
    }
  }

  // EASY is built by forward construction (place + pin each suspect in the shrinking board).
  // MEDIUM / HARD use natural clue selection, but the "was in row X / column Y" clue type
  // stays rare: at most TWO such clues across the whole level (rows and columns combined).
  const chosen =
    difficulty === 'easy'
      ? constructEasyClues(base, suspectIds, solution, candidates, rng)
      : constructLogicClues(base, suspectIds, candidates, rng, targetRankOf(difficulty), MAX_LINE_CLUES, difficulty === 'hard')
  if (!chosen) return null

  // Limit how many suspects are obvious from the START (their own clue pins one cell):
  // at most ONE for easy, and NONE from medium up — there you must cross something out
  // before anyone can be placed.
  const maxAnchors = difficulty === 'easy' ? 1 : 0
  if (countAnchors(chosen, suspectIds, basePuzzle.board) > maxAnchors) return null

  const level: LevelJson = {
    ...base,
    suspects: base.suspects.map((s) => ({ ...s, clues: [chosen.get(s.id)!] })),
  }
  const finalPuzzle = loadLevel(level)
  const finalSolution = new SearchSolver(finalPuzzle).firstSolution()
  if (!finalSolution || findMurderer(finalPuzzle, finalSolution).suspectId === null) return null
  if (difficulty === 'easy') {
    // Confirm the construction is genuinely unique and solvable by SHORT, simple steps —
    // hidden singles / "only one on X" / row-column cross-out (rank ≤ 2), no harder
    // technique and never a contradiction. Same `checkLevel` the editor / ship-gate use.
    const c = checkLevel(finalPuzzle)
    if (!c.unique || !c.solvable || c.deduction.maxRank > 2) return null
  }
  return { level, pins: countPins(chosen) }
}

/**
 * A random hidden placement of the people. Like the played game, EVERY person sits on a
 * DISTINCT row AND a DISTINCT column (the Sudoku rule — the solver forbids a person's whole
 * row and column for the others), on an occupiable cell, with the victim sharing a room
 * with EXACTLY one suspect (a well-defined murderer) and every global board clue holding.
 * Returns null if no such arrangement turns up.
 */
function placeOnBoard(puzzle: Puzzle, suspectIds: PersonId[], rng: Rng): Map<PersonId, Cell> | null {
  const board = puzzle.board
  const W = board.width
  const H = board.height
  const people = [...suspectIds, VICTIM_ID]
  const p = people.length
  if (p > W || p > H) return null
  // Occupiable columns available in each row (for the distinct-row/column matching).
  const colsByRow: number[][] = []
  for (let r = 0; r < H; r++) {
    const cs: number[] = []
    for (let c = 0; c < W; c++) if (board.isOccupiable(r * W + c)) cs.push(c)
    colsByRow.push(cs)
  }

  for (let attempt = 0; attempt < 4000; attempt++) {
    const rows = rng.shuffle([...Array(H).keys()]).slice(0, p)
    // Backtracking match: give each chosen row a DISTINCT occupiable column.
    const cols = new Array<number>(p).fill(-1)
    const usedCols = new Set<number>()
    const match = (i: number): boolean => {
      if (i === p) return true
      for (const c of rng.shuffle([...colsByRow[rows[i]]])) {
        if (usedCols.has(c)) continue
        usedCols.add(c)
        cols[i] = c
        if (match(i + 1)) return true
        usedCols.delete(c)
      }
      return false
    }
    if (!match(0)) continue

    const order = rng.shuffle([...people])
    const placement = new Map<PersonId, Cell>()
    for (let i = 0; i < p; i++) placement.set(order[i], rows[i] * W + cols[i])
    const victimRoom = board.roomIdOf(placement.get(VICTIM_ID)!)
    const inRoom = suspectIds.filter((id) => board.roomIdOf(placement.get(id)!) === victimRoom)
    if (inRoom.length !== 1) continue
    const solution = new Solution(placement)
    if (puzzle.boardClues.every((bc) => bc.test(solution, puzzle))) return placement
  }
  return null
}

/** A single generation attempt for one seed — for tooling that runs many and
 *  keeps the hardest (see `dev/hardest.ts`). Returns null on a failed attempt. */
export function generateOnce(
  options: GenerateOptions,
  seed: number,
): { level: LevelJson; pins: number } | null {
  return tryGenerate(options, new Rng(seed), seed)
}

function tryGenerate(
  options: GenerateOptions,
  rng: Rng,
  seedIndex: number,
  /** Build the clues by easy forward-construction. Defaults to on for 'easy';
   *  the easy generator turns it OFF for its generic fallback (see generateLevel). */
  easyConstruct = options.difficulty === 'easy',
): { level: LevelJson; pins: number } | null {
  const { width, height, suspects } = options
  const baseTheme = THEMES.find((t) => t.id === options.themeId) ?? rng.pick(THEMES)
  // Shuffle the theme's room pool so each level uses a random subset → variety.
  const theme: Theme = {
    id: baseTheme.id,
    rooms: rng.shuffle([...baseTheme.rooms]),
    outdoor: baseTheme.outdoor,
  }

  const roomCount = Math.max(3, Math.min(theme.rooms.length, Math.round(suspects * 0.7)))
  const rooms = generateRooms(width, height, roomCount, rng)
  const roomOf = (cell: Cell): string => rooms.roomMap[Math.floor(cell / width)][cell % width]
  // Room id → i18n nameKey, computed ONCE and shared by furnishing, outdoor detection,
  // and buildLevel (so the three can never disagree about which room is which).
  const roomNameById = new Map<string, string>()
  rooms.ids.forEach((id, i) => roomNameById.set(id, theme.rooms[i % theme.rooms.length]))
  const roomNameOf = (cell: Cell): string => roomNameById.get(roomOf(cell))!
  const outdoorIds = new Set<string>()
  for (const [id, key] of roomNameById) if (theme.outdoor.includes(key)) outdoorIds.add(id)
  const isOutdoor = (cell: Cell): boolean => outdoorIds.has(roomOf(cell))

  const suspectIds: PersonId[] = Array.from({ length: suspects }, (_, i) => String.fromCharCode(65 + i))
  const peopleIds = [...suspectIds, VICTIM_ID]

  const placed = generateSolution(width, height, roomOf, peopleIds, rng)
  if (!placed) return null

  const peopleCells = new Set<Cell>(placed.placement.values())
  const allow = new Set(options.objects ?? DEFAULT_OBJECT_TYPES)
  // Semantic furnishing: each room gets objects that fit it, arranged to look built.
  const objects = furnishRooms({ width, height, peopleCells, rng, allow, roomNameOf, isOutdoor, roomIdOf: roomOf })
  // Windows are on by default; when allowed, only some levels get them (then 2–6).
  const windows =
    options.windows === false ? [] : rng.chance(0.5) ? placeWindows(width, height, rng) : []
  // Doors are opt-in; when enabled, a few sit between adjacent rooms.
  const doors = options.doors ? placeDoors(width, height, rooms.roomMap, rng) : []

  const usedName = new Set<string>()
  const suspectMeta: SuspectJson[] = suspectIds.map((id, i) => {
    const gender: 'm' | 'f' = rng.chance(0.5) ? 'm' : 'f'
    const person = suspectPerson(i, gender, usedName)
    return { id, name: person.name, attributes: makeAttributes(gender, rng), clues: [] }
  })

  const victim = victimPerson(rng)
  const victimMeta = { name: victim.name, attributes: makeAttributes(victim.gender, rng) }
  const base = buildLevel(theme, width, height, rooms, roomNameById, objects, windows, doors, suspectMeta, victimMeta, seedIndex)
  const basePuzzle = loadLevel(base)
  const solution = new Solution(placed.placement)

  // HARD: offer several true board (global) clues UP FRONT so the suspect-clue construction
  // leans on them — they end up genuinely needed (and plural), which the user wants. Pruning
  // later keeps only those still required. Medium/easy get at most one bonus clue (below).
  if (options.difficulty === 'hard') {
    const offered = offerHardBoardClues(basePuzzle, solution, rng, suspects)
    if (offered.length > 0) base.boardClues = offered
  }

  const candidates = new Map<PersonId, ClueJson[]>()
  for (const id of suspectIds) {
    const others = suspectIds.filter((o) => o !== id)
    // Easy construction uses the editor's flat clue vocabulary (same as the editor fill).
    candidates.set(id, candidatesFor(id, solution, basePuzzle, others, easyConstruct))
  }

  // EASY is built by forward construction (place + pin each suspect in the shrinking
  // board) — the SAME path the editor's fill uses, which yields cleaner, more
  // easy-typical puzzles than rating-filtering generic attempts. MEDIUM / HARD (and
  // the easy generic fallback) use natural clue selection.
  const chosen = easyConstruct
    ? constructEasyClues(base, suspectIds, solution, candidates, rng)
    : constructLogicClues(base, suspectIds, candidates, rng, targetRankOf(options.difficulty), MAX_LINE_CLUES, options.difficulty === 'hard')
  if (!chosen) return null

  // Easy: at most ONE suspect may be directly placeable from the start (the rest
  // need a cross-out first), like the hand-made easy levels.
  if (easyConstruct && countAnchors(chosen, suspectIds, basePuzzle.board) > 1) return null

  for (const meta of base.suspects) meta.clues = [chosen.get(meta.id)!]
  // Guard: the unique solution must leave the victim alone with exactly ONE
  // suspect (a well-defined murderer). Consistent semantics already guarantee
  // this; verifying ensures a murderer-less level can never slip through.
  const finalPuzzle = loadLevel(base)
  const finalSolution = new SearchSolver(finalPuzzle).firstSolution()
  if (!finalSolution || findMurderer(finalPuzzle, finalSolution).suspectId === null) return null

  // Easy: confirm it is genuinely unique AND solvable by short, simple steps
  // (hidden singles / "only one on X" / row-column cross-out — rank ≤ 2, never a
  // contradiction), exactly like the editor's easy fill.
  if (easyConstruct) {
    const c = checkLevel(finalPuzzle)
    if (!c.unique || !c.solvable || c.deduction.maxRank > 2) return null
  }

  // Medium: now and then add ONE board-wide clue as bonus flavour (hard already got a set
  // up front; easy stays clean). True for the unique solution, so the answer is unchanged.
  if (!easyConstruct && options.difficulty !== 'hard' && rng.chance(0.35)) {
    const bc = bonusBoardClue(finalPuzzle, solution, rng)
    if (bc) base.boardClues = [bc]
  }
  return { level: base, pins: countPins(chosen) }
}

/**
 * All board-wide clues that genuinely hold for `solution`: "exactly N people stood on a
 * <object>" (per object type) and "N rooms are empty". The forward deduction engine has
 * techniques for these (BoardCount / EmptyRooms / RoomCoverage), so they can be load-bearing.
 */
function trueBoardClues(puzzle: Puzzle, solution: Solution): BoardClueJson[] {
  const board = puzzle.board
  const candidates: BoardClueJson[] = []

  for (const def of OCCUPIABLE) {
    if (board.cellsWithObject(def.type).size === 0) continue
    let n = 0
    for (const [, cell] of solution.entries()) {
      if (board.tileAt(cell).hasObjectType(def.type)) n++
    }
    if (n > 0) candidates.push({ type: 'countOnObject', object: def.type, count: n })
  }

  const occupied = new Set<string>()
  for (const [, cell] of solution.entries()) occupied.add(board.roomIdOf(cell))
  let empty = 0
  for (const id of board.rooms.keys()) if (!occupied.has(id)) empty++
  if (empty > 0) candidates.push({ type: 'emptyRooms', count: empty })

  return candidates.filter((c) => createBoardClue(c).test(solution, puzzle))
}

/** One board-wide clue that holds for `solution` (or null) — bonus flavour for medium/easy. */
function bonusBoardClue(puzzle: Puzzle, solution: Solution, rng: Rng): BoardClueJson | null {
  const valid = trueBoardClues(puzzle, solution)
  return valid.length ? rng.pick(valid) : null
}

/**
 * A diverse handful of true board clues to OFFER a hard level up front (before the suspect
 * clues are built), so the construction leans on them and they become genuinely needed —
 * the user wants hard levels to USE global clues, often more than one. The final pruning
 * keeps exactly those the puzzle still needs. Count scales with the board.
 */
function offerHardBoardClues(puzzle: Puzzle, solution: Solution, rng: Rng, suspects: number): BoardClueJson[] {
  const valid = rng.shuffle(trueBoardClues(puzzle, solution))
  const cap = Math.min(valid.length, 3 + Math.floor(suspects / 3)) // 6×6≈4, 9×9≈5
  return valid.slice(0, cap)
}

// --- board ----------------------------------------------------------------

function generateRooms(
  width: number,
  height: number,
  roomCount: number,
  rng: Rng,
): { roomMap: string[]; ids: string[] } {
  const n = width * height
  const assign = new Array<number>(n).fill(-1)
  const neighbors = (cell: Cell): Cell[] => {
    const r = Math.floor(cell / width)
    const c = cell % width
    const out: Cell[] = []
    if (r > 0) out.push(cell - width)
    if (r < height - 1) out.push(cell + width)
    if (c > 0) out.push(cell - 1)
    if (c < width - 1) out.push(cell + 1)
    return out
  }

  const seeds = rng.shuffle([...Array(n).keys()]).slice(0, roomCount)
  const frontier: Array<[Cell, number]> = []
  const grow = (cell: Cell, room: number): void => {
    assign[cell] = room
    for (const nb of neighbors(cell)) if (assign[nb] < 0) frontier.push([nb, room])
  }
  seeds.forEach((cell, room) => grow(cell, room))
  while (frontier.length > 0) {
    const i = rng.int(frontier.length)
    const [cell, room] = frontier[i]
    frontier[i] = frontier[frontier.length - 1]
    frontier.pop()
    if (assign[cell] < 0) grow(cell, room)
  }

  // Merge any room with fewer than 3 cells into a neighbouring room (tiny rooms
  // that can't hold anyone make no sense).
  const sizes = (): Map<number, number> => {
    const m = new Map<number, number>()
    for (const v of assign) m.set(v, (m.get(v) ?? 0) + 1)
    return m
  }
  for (let guard = 0; guard < n; guard++) {
    const sz = sizes()
    if (sz.size <= 1) break
    let small = -1
    for (const [room, count] of sz) {
      if (count < 3 && (small < 0 || count < sz.get(small)!)) small = room
    }
    if (small < 0) break
    let target = -1
    for (let cell = 0; cell < n && target < 0; cell++) {
      if (assign[cell] !== small) continue
      for (const nb of neighbors(cell)) {
        if (assign[nb] !== small) {
          target = assign[nb]
          break
        }
      }
    }
    if (target < 0) break
    for (let cell = 0; cell < n; cell++) if (assign[cell] === small) assign[cell] = target
  }

  // Remap remaining rooms to contiguous ids 1..k (some were merged away).
  const remap = new Map<number, number>()
  for (const v of assign) if (!remap.has(v)) remap.set(v, remap.size)
  for (let cell = 0; cell < n; cell++) assign[cell] = remap.get(assign[cell])!

  const ids = Array.from({ length: remap.size }, (_, room) => String(room + 1))
  const roomMap: string[] = []
  for (let r = 0; r < height; r++) {
    let line = ''
    for (let c = 0; c < width; c++) line += String(assign[r * width + c] + 1)
    roomMap.push(line)
  }
  return { roomMap, ids }
}

function generateSolution(
  width: number,
  height: number,
  roomOf: (cell: Cell) => string,
  peopleIds: PersonId[],
  rng: Rng,
): { placement: Map<PersonId, Cell>; murderer: PersonId } | null {
  const p = peopleIds.length
  for (let attempt = 0; attempt < 4000; attempt++) {
    const rows = rng.shuffle([...Array(height).keys()]).slice(0, p)
    const cols = rng.shuffle([...Array(width).keys()]).slice(0, p)
    const order = rng.shuffle([...peopleIds])
    const placement = new Map<PersonId, Cell>()
    for (let i = 0; i < p; i++) placement.set(order[i], rows[i] * width + cols[i])

    const victimRoom = roomOf(placement.get(VICTIM_ID)!)
    const inRoom = peopleIds.filter(
      (id) => id !== VICTIM_ID && roomOf(placement.get(id)!) === victimRoom,
    )
    if (inRoom.length === 1) return { placement, murderer: inRoom[0] }
  }
  return null
}

/**
 * Place a handful of windows on the outer wall (2–6), each owned by a border cell
 * on its outward side. Several windows keep "beside a window" non-unique.
 */
function placeWindows(
  width: number,
  height: number,
  rng: Rng,
): { r: number; c: number; side: Side }[] {
  const border: { r: number; c: number; sides: Side[] }[] = []
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const sides: Side[] = []
      if (r === 0) sides.push('N')
      if (r === height - 1) sides.push('S')
      if (c === 0) sides.push('W')
      if (c === width - 1) sides.push('E')
      if (sides.length > 0) border.push({ r, c, sides })
    }
  }
  const count = Math.min(border.length, 2 + rng.int(5)) // 2..6
  return rng
    .shuffle(border)
    .slice(0, count)
    .map((b) => ({ r: b.r, c: b.c, side: b.sides[rng.int(b.sides.length)] }))
}

/**
 * Place a few doors (1–3) on interior walls between two adjacent, DIFFERENT rooms.
 * A door is anchored at the top/left cell of the shared edge (side 'S' or 'E'); the
 * loader registers it on both cells, so each side counts as "beside a door".
 */
function placeDoors(
  width: number,
  height: number,
  roomMap: string[],
  rng: Rng,
): { r: number; c: number; side: Side }[] {
  const edges: { r: number; c: number; side: Side }[] = []
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (r < height - 1 && roomMap[r][c] !== roomMap[r + 1][c]) edges.push({ r, c, side: 'S' })
      if (c < width - 1 && roomMap[r][c] !== roomMap[r][c + 1]) edges.push({ r, c, side: 'E' })
    }
  }
  if (edges.length === 0) return []
  const count = Math.min(edges.length, 1 + rng.int(3)) // 1..3
  return rng.shuffle(edges).slice(0, count)
}

// --- level json -----------------------------------------------------------

function buildLevel(
  theme: Theme,
  width: number,
  height: number,
  rooms: { roomMap: string[]; ids: string[] },
  roomNameById: Map<string, string>,
  objects: { groundMap: string[]; topMap: string[] },
  windows: { r: number; c: number; side: Side }[],
  doors: { r: number; c: number; side: Side }[],
  suspects: SuspectJson[],
  victim: { name: string; attributes: Record<string, AttributeValue> },
  seedIndex: number,
): LevelJson {
  const roomDefs: Record<string, { nameKey: string; color: string; outside?: boolean }> = {}
  const outdoorKeys = new Set(theme.outdoor)
  rooms.ids.forEach((id, i) => {
    const nameKey = roomNameById.get(id)!
    roomDefs[id] = {
      nameKey,
      color: ROOM_COLORS[i % ROOM_COLORS.length],
      // Flag the theme's outdoor rooms as `outside` so they read as exterior and
      // enable inside/outside clues (previously omitted, so generated outdoor rooms
      // never counted as "outside"). The bear lives only in these wilderness rooms.
      ...(outdoorKeys.has(nameKey) ? { outside: true } : {}),
    }
  })
  const objectDefs: Record<string, { type: string; occupiable: boolean }> = {}
  for (const obj of ALL_OBJECTS) objectDefs[obj.char] = { type: obj.type, occupiable: obj.occupiable }

  return {
    schema: 1,
    id: `gen-${theme.id}-${seedIndex}`,
    difficulty: 'generated',
    size: { width, height },
    rooms: roomDefs,
    objects: objectDefs,
    roomMap: rooms.roomMap,
    groundMap: objects.groundMap,
    topMap: objects.topMap,
    windows,
    doors,
    suspects,
    victim,
  }
}

// --- clues ----------------------------------------------------------------

/**
 * Build the pool of clues that are TRUE for `suspectId` in this solution, tightest
 * first. Covers the full clue vocabulary; the test-filter keeps only true ones.
 * `editorSafe` restricts the pool to shapes the editor's flat clue builder can
 * round-trip (e.g. roomAttribute with excludeSelf).
 */
function candidatesFor(
  suspectId: PersonId,
  solution: Solution,
  puzzle: Puzzle,
  otherSuspects: PersonId[],
  editorSafe = false,
): ClueJson[] {
  const board = puzzle.board
  const cell = solution.cellOf(suspectId)
  const { row, col } = board.rc(cell)
  const room = board.roomIdOf(cell)
  const out: ClueJson[] = []

  // A trait may only appear in a clue if a SUSPECT actually carries it (the player can see
  // suspects' looks). For NON-gender traits the VICTIM must NOT carry it either: its
  // beard/glasses/bald/hair are random and hidden, so a clue must never silently hinge on
  // them. (Gender is shown for the victim too, so it may count.) Without this, "east of
  // everyone bald" could appear with no bald suspect — only a bald victim.
  const victimAttrs = puzzle.attributesOf(VICTIM_ID)
  const usableTrait = (attribute: string, value: AttributeValue): boolean =>
    puzzle.suspects.some((s) => puzzle.attributesOf(s.id)[attribute] === value) &&
    (attribute === 'gender' || victimAttrs[attribute] !== value)

  // All eight compass directions and the three room qualifiers the editor offers — the
  // generator now emits the full set (the test-filter at the end keeps only the true ones),
  // so diagonals and "same/other room" variants reach generated levels too.
  const DIRS8 = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'] as const
  const ROOM_RELS = ['any', 'same', 'other'] as const

  // --- object: on / beside ---
  for (const obj of board.tileAt(cell).objects()) {
    if (obj.occupiable) {
      out.push({ type: 'onObject', object: obj.type })
      // "only person on a chair/carpet/…" — kept by the test-filter only if truly unique.
      out.push({ type: 'uniqueOnObject', object: obj.type })
    }
  }
  const nearTypes = new Set<string>()
  for (const nb of board.neighbors4(cell)) {
    if (board.roomIdOf(nb) === room) {
      for (const obj of board.tileAt(nb).objects()) nearTypes.add(obj.type)
    }
  }
  for (const type of nearTypes) {
    out.push({ type: 'nearObject', object: type })
    out.push({ type: 'uniqueNearObject', object: type }) // "only one beside it" (test-filtered)
  }
  // "beside one of several object types" (nearObjectAny) — the editor's multi-select. Offer
  // every pair of nearby types (and the full set); all are true since the subject is beside
  // each member.
  const near = [...nearTypes]
  for (let i = 0; i < near.length; i++) {
    for (let j = i + 1; j < near.length; j++) {
      out.push({ type: 'nearObjectAny', objects: [near[i], near[j]] })
    }
  }
  if (near.length >= 3) out.push({ type: 'nearObjectAny', objects: near })

  // --- object: same line / direction (objects are fixed → deducible) ---
  // A clue whose candidates already lie in ONE row or column is just a disguised line
  // clue — the honest `in row/col X` (added below) says it instead.
  const collapsesToLine = (json: ClueJson): boolean => {
    const cells = createClue(json).candidateCells(board)
    if (!cells || cells.size === 0) return false
    const rows = new Set<number>()
    const cols = new Set<number>()
    for (const c of cells) {
      const rc = board.rc(c)
      rows.add(rc.row)
      cols.add(rc.col)
    }
    return rows.size === 1 || cols.size === 1
  }
  for (const def of ALL_OBJECTS) {
    const objCells = board.objectCells(def.type)
    if (objCells.length === 0) continue
    // Object line/direction clues ONLY for a UNIQUE object tile — a repeated object
    // would need a "(Z7/S6)" anchor coordinate, which reads badly. And skip the ones
    // that collapse to a single line (those become the plain inRow/inCol clue).
    // "same row/column as a {object}" — for ANY object (several tiles = "as SOME tile").
    // collapsesToLine drops the degenerate single-tile col/row (which is just a line clue).
    // The disguised-line check only matters for the unrestricted ("any room") form; the
    // same/other variants already carry a room constraint, so they're never a bare line.
    const keep = (room: string, json: ClueJson) => room !== 'any' || !collapsesToLine(json)
    for (const line of ['col', 'row', 'either'] as const) {
      for (const room of ROOM_RELS) {
        const json: ClueJson = { type: 'sameLineAsObject', object: def.type, line, room }
        if (keep(room, json)) out.push(json)
      }
    }
    // "{dir} of a {object}" — 8-way, any/same/other room. A SINGLE tile is ∃≡∀ and
    // unambiguous → offered. For SEVERAL tiles (a multi-cell object like a car, or a
    // repeated object) ONLY the ∀ form "{dir} of EVERY {object}" is offered: "{dir} of A
    // {object}" and the per-tile "(Z/S)" anchor leave it unclear WHICH tile is meant —
    // bad puzzling — so neither is ever generated.
    for (const dir of DIRS8) {
      for (const room of ROOM_RELS) {
        if (objCells.length === 1) {
          const some: ClueJson = { type: 'directionFromObject', object: def.type, dir, room }
          if (keep(room, some)) out.push(some)
        } else {
          const all: ClueJson = { type: 'directionFromObject', object: def.type, dir, room, all: true }
          if (keep(room, all)) out.push(all)
        }
      }
    }
    // "beside the SAME object instance as …" — only when the subject is beside one. Each
    // mate is offered with no direction AND with the mate's 8-way direction from the
    // subject (the filter keeps the true direction).
    if (board.cellsNearObject(def.type).has(cell)) {
      const mates: ObjectMate[] = [
        { kind: 'any' },
        ...otherSuspects.map((id): ObjectMate => ({ kind: 'person', of: id })),
        ...(
          [
            { attribute: 'gender', value: 'm' as const },
            { attribute: 'gender', value: 'f' as const },
            { attribute: 'beard', value: true as const },
            { attribute: 'glasses', value: true as const },
            { attribute: 'bald', value: true as const },
          ]
            .filter((av) => usableTrait(av.attribute, av.value))
            .map((av): ObjectMate => ({ kind: 'attr', ...av }))
        ),
      ]
      for (const mate of mates) {
        out.push({ type: 'besideSameObject', object: def.type, mate })
        for (const dir of DIRS8) out.push({ type: 'besideSameObject', object: def.type, mate, dir })
      }
    }
  }

  // --- position ---
  out.push({ type: 'inRoom', room })
  out.push({ type: 'inRow', row })
  out.push({ type: 'inCol', col })
  if (board.isCorner(cell)) out.push({ type: 'corner' })
  if (board.isAtWall(cell)) out.push({ type: 'atWall' })
  if (board.hasWindow(cell)) {
    out.push({ type: 'nearWindow' })
    out.push({ type: 'uniqueNearWindow' }) // "only person beside a window" (test-filtered)
  }
  if (board.hasDoor(cell)) {
    out.push({ type: 'nearDoor' })
    out.push({ type: 'uniqueNearDoor' }) // "only person beside a door" (test-filtered)
  }
  // inside/outside only when the board actually mixes indoor and outdoor rooms.
  if (board.cellsOutside(true).size > 0 && board.cellsOutside(false).size > 0) {
    const outside = board.isOutside(cell)
    out.push(outside ? { type: 'outside' } : { type: 'inside' })
    out.push(outside ? { type: 'uniqueOutside' } : { type: 'uniqueInside' }) // "only one out/inside"
    for (const id of otherSuspects) out.push({ type: 'insideXor', with: id })
  }

  // --- social: relative to other people ---
  const inRoomAll = puzzle.allIds().filter((id) => board.roomIdOf(solution.cellOf(id)) === room)
  if (inRoomAll.length > 1) out.push({ type: 'notAlone' })
  const sameRoom = otherSuspects.filter((id) => board.roomIdOf(solution.cellOf(id)) === room)
  if (sameRoom.length === 0) out.push({ type: 'alone' })
  for (const id of sameRoom) out.push({ type: 'sameRoom', as: id })
  // "alone (just the two) with that one suspect" — only when nobody else, victim
  // included, shares the room (inRoomAll counts everyone present, the subject + 1).
  if (sameRoom.length === 1 && inRoomAll.length === 2) {
    out.push({ type: 'sameRoom', as: sameRoom[0], alone: true })
  }

  // --- "(alone) in the same room as an object" (objects are fixed → deducible) ---
  const roomObjects = new Set<string>()
  for (let c = 0; c < board.width * board.height; c++) {
    if (board.roomIdOf(c) === room) for (const obj of board.tileAt(c).objects()) roomObjects.add(obj.type)
  }
  const aloneInRoom = inRoomAll.length === 1 // nobody else at all shares the room
  for (const type of roomObjects) {
    out.push({ type: 'sameRoomAsObject', object: type })
    if (aloneInRoom) out.push({ type: 'sameRoomAsObject', object: type, alone: true })
  }
  // Negation: "his room had NO crate" — offered for every object type the room
  // lacks (editor: "Im selben Raum wie" + Objekt + NICHT; fully deducible via
  // the not-clue's definite cells).
  const boardObjTypes = new Set<string>()
  for (let c = 0; c < board.width * board.height; c++) {
    for (const obj of board.tileAt(c).objects()) boardObjTypes.add(obj.type)
  }
  for (const type of boardObjTypes) {
    if (!roomObjects.has(type)) {
      out.push({ type: 'not', clue: { type: 'sameRoomAsObject', object: type } })
    }
  }
  // "(not) alone in room X" as one clue (mirrors the editor's "Im Raum" + allein).
  out.push({ type: 'inRoom', room, occupancy: aloneInRoom ? 'alone' : 'notAlone' })

  for (const id of otherSuspects) {
    // 8-way direction relative to another suspect — emit all; the filter keeps the true
    // ones, so diagonals ("northeast of X") appear too, not just the four cardinals.
    for (const dir of DIRS8) out.push({ type: 'direction', of: id, dir })
    // "exactly N cells {cardinal} of X" (offset) — measures ONE axis only (column for
    // east/west, row for north/south); the other axis is free. So every other suspect at a
    // different column gives an east/west offset, and a different row a north/south one.
    const o = board.rc(solution.cellOf(id))
    const dc = col - o.col
    if (dc !== 0) out.push({ type: 'offset', of: id, dir: dc > 0 ? 'east' : 'west', distance: Math.abs(dc) })
    const dr = row - o.row
    if (dr !== 0) out.push({ type: 'offset', of: id, dir: dr < 0 ? 'north' : 'south', distance: Math.abs(dr) })
  }

  // "{dir} of {at least one | every} person with a trait" (victim counts) — offer the
  // cardinal that holds, for each basic trait. 'some' is forward-deducible via the
  // relational technique's one-sided bound, 'all' via the stronger two-sided bound; the
  // candidate filter keeps only those that actually help.
  const attrDirPairs: { attribute: string; value: AttributeValue }[] = [
    { attribute: 'gender', value: 'm' },
    { attribute: 'gender', value: 'f' },
    { attribute: 'beard', value: true },
    { attribute: 'glasses', value: true },
    { attribute: 'bald', value: true },
  ]
  for (const { attribute, value } of attrDirPairs) {
    if (!usableTrait(attribute, value)) continue
    const matchers = puzzle
      .allIds()
      .filter((id) => id !== suspectId && puzzle.attributesOf(id)[attribute] === value)
    if (matchers.length === 0) continue
    for (const dir of DIRS8) {
      const inDir = (id: PersonId) => inDirection8(dir, { row, col }, board.rc(solution.cellOf(id)))
      if (matchers.some(inDir)) out.push({ type: 'directionFromAttr', attribute, value, dir, quantifier: 'some' })
      if (matchers.every(inDir)) out.push({ type: 'directionFromAttr', attribute, value, dir, quantifier: 'all' })
    }
  }

  // --- room-attribute clues: "no one / some / everyone else in the room had X" ---
  // Boolean traits AND gender now round-trip to the editor (gender via the "same room
  // as a man/woman" target). excludeSelf is ALWAYS true: the rendered wording is "ein
  // ANDERER Mann / kein anderer …" (about the OTHERS in the room), the editor's flat
  // builder always sets it, and the editor round-trip forces it — so generating it as
  // false produced a clue whose stored meaning (counts the subject itself) contradicted
  // its own displayed text and flipped under a round-trip. Always true keeps all three
  // (generator / renderer / editor) in agreement.
  const attrPairs: { attribute: string; value: AttributeValue }[] = [
    { attribute: 'gender', value: 'm' },
    { attribute: 'gender', value: 'f' },
    { attribute: 'beard', value: true },
    { attribute: 'glasses', value: true },
    { attribute: 'bald', value: true },
  ]
  // Hair is a valued trait the editor offers for "same room as someone with hair X"
  // (roomAttribute). Add every hair colour a suspect actually wears so this whole block
  // (none/some/all + counted) AND the negation loop below emit hair variants too; the
  // test-filter + usableTrait keep only the valid ones. Without it, the editor's hair
  // "Vorgaben" could never be generated. See [[editor-generator-deduction-parity]].
  const hairValues = new Set<AttributeValue>()
  for (const s of puzzle.suspects) {
    const h = puzzle.attributesOf(s.id).hair
    if (typeof h === 'string') hairValues.add(h)
  }
  for (const v of hairValues) attrPairs.push({ attribute: 'hair', value: v })
  for (const { attribute, value } of attrPairs) {
    if (!usableTrait(attribute, value)) continue
    for (const quantifier of ['none', 'some', 'all'] as const) {
      out.push({ type: 'roomAttribute', quantifier, attribute, value, excludeSelf: true })
    }
  }
  // Counted variants of "some": "in a room with ≥N / exactly N matching others" — only
  // editor-safe (excludeSelf, so the subject never counts), matching the flat builder.
  // The test-filter keeps the ones true for the solution; we cap counts at the actual
  // number present in the room so we never offer a clue that can't hold.
  if (editorSafe) {
    for (const { attribute, value } of attrPairs) {
      if (!usableTrait(attribute, value)) continue
      const matching = inRoomAll.filter(
        (id) => id !== suspectId && puzzle.attributesOf(id)[attribute] === value,
      ).length
      // "at least N" for N ≥ 2 (N = 1 is the plain 'some' above).
      for (let n = 2; n <= matching; n++) {
        out.push({ type: 'roomAttribute', quantifier: 'some', attribute, value, excludeSelf: true, count: n })
      }
      // "exactly N" — only the real count is true, so offer just that one.
      if (matching >= 1) {
        out.push({ type: 'roomAttribute', quantifier: 'some', attribute, value, excludeSelf: true, count: matching, exact: true })
      }
    }
  }
  // "alone with N <attribute>" — about the OTHER suspects sharing the room (never the
  // subject, never the victim). Editor-representable via "alone with" + a trait + count.
  // A trait is usable only if EVERY co-occupant shares it (else "alone with only matching"
  // fails); the count is how many co-occupants there are.
  const othersInRoom = otherSuspects.filter((id) => board.roomIdOf(solution.cellOf(id)) === room)
  if (othersInRoom.length >= 1) {
    const n = othersInRoom.length
    const attrs = othersInRoom.map((id) => puzzle.attributesOf(id))
    const companion: { attribute: string; value: AttributeValue }[] = []
    const g = attrs[0].gender
    if (attrs.every((a) => a.gender === g)) companion.push({ attribute: 'gender', value: g })
    if (attrs.every((a) => a.beard === true)) companion.push({ attribute: 'beard', value: true })
    if (attrs.every((a) => a.glasses === true)) companion.push({ attribute: 'glasses', value: true })
    if (attrs.every((a) => a.bald === true)) companion.push({ attribute: 'bald', value: true })
    const hair = attrs[0].hair
    if (typeof hair === 'string' && attrs.every((a) => a.hair === hair)) {
      companion.push({ attribute: 'hair', value: hair })
    }
    for (const { attribute, value } of companion) {
      out.push({ type: 'roomCompanion', count: n, attribute, value })
    }
  }
  // "alone with a named suspect AND N others sharing a trait" (editor: "Allein mit Person
  // + weiteren"). Only when the victim is NOT in the room — a named co-suspect means ≥2
  // suspects, and the victim shares its room with exactly one suspect, so it can't be
  // here. One room mate is the named person, the rest are the matching extras (extraCount
  // = their number), optionally one of them in a cardinal direction from the subject.
  if (board.roomIdOf(solution.cellOf(VICTIM_ID)) !== room && othersInRoom.length >= 2) {
    const extraInDir = (dir: 'north' | 'south' | 'east' | 'west', ids: PersonId[]): boolean =>
      ids.some((id) => {
        const p = board.rc(solution.cellOf(id))
        return dir === 'north' ? p.row < row : dir === 'south' ? p.row > row : dir === 'east' ? p.col > col : p.col < col
      })
    for (const named of othersInRoom) {
      const extras = othersInRoom.filter((id) => id !== named)
      if (extras.length === 0) continue
      const eAttrs = extras.map((id) => puzzle.attributesOf(id))
      const traits: { attribute: string; value: AttributeValue }[] = []
      const eg = eAttrs[0].gender
      if (eAttrs.every((a) => a.gender === eg)) traits.push({ attribute: 'gender', value: eg })
      if (eAttrs.every((a) => a.beard === true)) traits.push({ attribute: 'beard', value: true })
      if (eAttrs.every((a) => a.glasses === true)) traits.push({ attribute: 'glasses', value: true })
      if (eAttrs.every((a) => a.bald === true)) traits.push({ attribute: 'bald', value: true })
      const eHair = eAttrs[0].hair
      if (typeof eHair === 'string' && eAttrs.every((a) => a.hair === eHair)) {
        traits.push({ attribute: 'hair', value: eHair })
      }
      for (const { attribute, value } of traits) {
        if (!usableTrait(attribute, value)) continue
        out.push({ type: 'aloneWith', people: [named], attribute, value, extraCount: extras.length })
        for (const dir of ['north', 'south', 'east', 'west'] as const) {
          if (extraInDir(dir, extras)) {
            out.push({ type: 'aloneWith', people: [named], attribute, value, extraCount: extras.length, dir })
          }
        }
      }
    }
  }
  // "in his room someone (anyone / a man / someone with a beard …) was ON or BESIDE
  // an object" — round-trips to the editor's "Im Raum mit jemandem" builder.
  for (const id of othersInRoom) {
    const a = puzzle.attributesOf(id)
    // Every trait this co-occupant actually carries (so the clue is true), the full
    // editor palette: gender, the boolean traits, and the valued styles.
    const whoVariants: ({ attribute: string; value: AttributeValue } | null)[] = [
      null, // anyone
      { attribute: 'gender', value: a.gender },
    ]
    if (a.beard === true) whoVariants.push({ attribute: 'beard', value: true })
    if (a.glasses === true) whoVariants.push({ attribute: 'glasses', value: true })
    if (a.bald === true) whoVariants.push({ attribute: 'bald', value: true })
    for (const attr of ['hair', 'hairstyle', 'beardStyle', 'glassesShape', 'glassesColor'] as const) {
      if (typeof a[attr] === 'string') whoVariants.push({ attribute: attr, value: a[attr] })
    }

    const idCell = solution.cellOf(id)
    const idRoom = board.roomIdOf(idCell)
    const onTypes = [...board.tileAt(idCell).objects()]
      .filter((o) => o.occupiable)
      .map((o) => o.type)
    // "beside": orthogonal neighbour in the same room — never the object stood on.
    const nearTypes = new Set<string>()
    for (const nb of board.neighbors4(idCell)) {
      if (board.roomIdOf(nb) !== idRoom) continue
      for (const obj of board.tileAt(nb).objects()) {
        if (!board.tileAt(idCell).hasObjectType(obj.type)) nearTypes.add(obj.type)
      }
    }
    // Board positions this co-occupant stands on (corner ⊂ wall, so both can hold).
    const posList: ('corner' | 'wall' | 'window' | 'door')[] = []
    if (board.cornerCells().has(idCell)) posList.push('corner')
    if (board.cellsAtWall().has(idCell)) posList.push('wall')
    if (board.cellsNearWindow().has(idCell)) posList.push('window')
    if (board.cellsNearDoor().has(idCell)) posList.push('door')

    // Each "who" — anyone / a trait / a gender AND the specific NAMED co-occupant —
    // across every place they satisfy: on/beside an object, or a board position.
    const emit = (who: { attribute?: string; value?: AttributeValue; person?: PersonId }) => {
      for (const type of onTypes) out.push({ type: 'roomExists', ...who, object: type, relation: 'on' })
      for (const type of nearTypes) out.push({ type: 'roomExists', ...who, object: type, relation: 'near' })
      for (const relation of posList) out.push({ type: 'roomExists', ...who, relation })
    }
    for (const who of whoVariants) emit(who ? { attribute: who.attribute, value: who.value } : {})
    emit({ person: id })
  }

  // --- negations ("NICHT neben einem Regal / an der Wand / im Garten …") — broad,
  // information-light clues that keep the start board open. The hand-made easy levels
  // use them for elimination, and the broad-first construction starts suspects on
  // them. All of these round-trip into the editor. ---
  const allObjTypes = new Set<string>()
  const standableTypes = new Set<string>() // types one can actually stand ON (occupiable)
  for (let c = 0; c < board.width * board.height; c++) {
    for (const obj of board.tileAt(c).objects()) {
      allObjTypes.add(obj.type)
      if (obj.occupiable) standableTypes.add(obj.type)
    }
  }
  for (const t of allObjTypes) {
    out.push({ type: 'not', clue: { type: 'nearObject', object: t } })
    // "NOT on X" is only meaningful for an object one can stand on. A non-occupiable
    // object (e.g. a checkout / shelf) is never occupied, so "not on it" is true on EVERY
    // cell — a vacuous clue. Mirror the positive `onObject` guard (occupiable only).
    if (standableTypes.has(t)) out.push({ type: 'not', clue: { type: 'onObject', object: t } })
  }
  for (const r of puzzle.board.rooms.keys()) {
    if (r !== room) out.push({ type: 'not', clue: { type: 'inRoom', room: r } })
  }
  out.push({ type: 'not', clue: { type: 'atWall' } })
  out.push({ type: 'not', clue: { type: 'corner' } })
  if (board.cellsNearWindow().size > 0) out.push({ type: 'not', clue: { type: 'nearWindow' } })
  if (board.cellsNearDoor().size > 0) out.push({ type: 'not', clue: { type: 'nearDoor' } })

  // --- "spicy" negations of FORWARD-deducible relational/social/object clues:
  // "nicht im selben Raum wie X", "keine Frau / niemand mit Bart im Raum", "nicht in
  // derselben Zeile/Richtung wie ein Objekt". Broad, make-you-think elimination clues
  // (the user wants "nicht" used now and then for extra deduction). All propagate
  // forward — sameRoom via the different-room rule, the negated room-attribute via
  // not(some)≡none, the object ones via the not-clue's definite cells. The test-filter
  // below keeps only those TRUE here; HARD_CLUE_TYPES counts sameRoom/roomAttribute. ---
  for (const id of otherSuspects) {
    out.push({ type: 'not', clue: { type: 'sameRoom', as: id } })
  }
  for (const { attribute, value } of attrPairs) {
    out.push({
      type: 'not',
      clue: { type: 'roomAttribute', quantifier: 'some', attribute, value, excludeSelf: true },
    })
  }
  for (const def of ALL_OBJECTS) {
    const objCells = board.objectCells(def.type)
    // Same rule as the positive object clues: only a UNIQUE object (no "(Z/S)" anchor)
    // and not when the inner clue is just a disguised single line.
    if (objCells.length !== 1) continue
    for (const line of ['col', 'row', 'either'] as const) {
      const inner: ClueJson = { type: 'sameLineAsObject', object: def.type, line, room: 'any' }
      if (!collapsesToLine(inner)) out.push({ type: 'not', clue: inner })
    }
    for (const dir of DIRS8) {
      const inner: ClueJson = { type: 'directionFromObject', object: def.type, dir, room: 'any' }
      if (!collapsesToLine(inner)) out.push({ type: 'not', clue: inner })
    }
  }

  // Keep only clues TRUE for this solution; sort tightest-first (tightness once each).
  const scored = out
    .filter((json) => createClue(json).test(suspectId, solution, puzzle))
    .map((json) => ({ json, t: tightness(json, puzzle) }))
  scored.sort((a, b) => a.t - b.t)
  return scored.map((s) => s.json)
}

function tightness(json: ClueJson, puzzle: Puzzle): number {
  // Row/column clues are a last resort — prefer object/room/relational clues.
  if (json.type === 'inRow' || json.type === 'inCol') return 150
  const cells = createClue(json).candidateCells(puzzle.board)
  if (cells) return cells.size
  switch (json.type) {
    case 'roomCompanion':
      return 6
    case 'alone':
      return 8
    case 'offset':
      return 12
    case 'roomAttribute':
      return 35
    case 'sameRoom':
      return 40
    case 'notAlone':
      return 70
    case 'insideXor':
      return 90
    case 'direction':
      return 100
    case 'directionFromAttr':
      return 110
    default:
      return 60
  }
}

/** Easy-clue palette: simple, self-contained clue types (or their negation) — the same
 *  ones the hand-made easy levels use. No abstract "same line / direction of" or attribute. */
const EASY_ALLOWED_TYPES = new Set<string>([
  'onObject', 'uniqueOnObject', 'nearObject', 'inRoom', 'nearWindow', 'uniqueNearWindow',
  'nearDoor', 'corner', 'atWall', 'inside', 'outside', 'inCol', 'inRow',
])
const easyInnerType = (c: ClueJson): string => (c.type === 'not' ? c.clue.type : c.type)
const isLineClue = (c: ClueJson): boolean => {
  const t = easyInnerType(c)
  return t === 'inCol' || t === 'inRow'
}

/**
 * Build an EASY puzzle by FORWARD CONSTRUCTION instead of random search: place suspects
 * one at a time, each pinned to their cell by ≤2 SIMPLE clues that single them out among
 * the cells STILL AVAILABLE — the rows and columns of already-placed people are gone (the
 * Sudoku rule the game enforces). So it solves step by step ("this cell is forced, so that
 * one is too"), with no contradiction and mostly a single clue each. Returns null if some
 * suspect can't be pinned that way on this layout (then a different placement is tried).
 */
function constructEasyClues(
  base: LevelJson,
  suspectIds: PersonId[],
  solution: Solution,
  candidates: Map<PersonId, ClueJson[]>,
  rng: Rng,
): Map<PersonId, ClueJson> | null {
  const puzzle = loadLevel(base)
  const board = puzzle.board
  // How naturally a clue reads (object/room first; bare "column/row N" only as a last
  // resort; a negation slightly less preferred than its positive).
  const CLARITY: Record<string, number> = {
    onObject: 0, uniqueOnObject: 0, nearObject: 0, inRoom: 0,
    corner: 1, atWall: 1, nearWindow: 1, uniqueNearWindow: 1, nearDoor: 1, inside: 1, outside: 1,
    inCol: 2, inRow: 2,
  }
  const clarityOf = (c: ClueJson): number => (CLARITY[easyInnerType(c)] ?? 3) + (c.type === 'not' ? 0.3 : 0)
  // Per-suspect easy candidates: clearest type first, then sharpest (fewest cells).
  const cand = new Map<PersonId, { json: ClueJson; cells: Set<Cell> }[]>()
  for (const id of suspectIds) {
    const list: { json: ClueJson; cells: Set<Cell> }[] = []
    for (const json of candidates.get(id)!) {
      if (!EASY_ALLOWED_TYPES.has(easyInnerType(json))) continue
      const cells = createClue(json).candidateCells(board)
      if (cells) list.push({ json, cells })
    }
    list.sort((a, b) => clarityOf(a.json) - clarityOf(b.json) || a.cells.size - b.cells.size)
    cand.set(id, list)
  }

  // Suspects never share the victim's row/column (one person per row & column).
  const vr = board.rc(solution.cellOf(VICTIM_ID))
  const availRows = new Set<number>()
  const availCols = new Set<number>()
  for (let r = 0; r < board.height; r++) if (r !== vr.row) availRows.add(r)
  for (let c = 0; c < board.width; c++) if (c !== vr.col) availCols.add(c)
  const inAvail = (cell: Cell): boolean => {
    const { row, col } = board.rc(cell)
    return availRows.has(row) && availCols.has(col)
  }

  const chosen = new Map<PersonId, ClueJson>()
  const remaining = new Set(suspectIds)
  while (remaining.size > 0) {
    let pinnedId: PersonId | null = null
    let pinnedClue: ClueJson | null = null
    for (const id of rng.shuffle([...remaining])) {
      const cell = solution.cellOf(id)
      const list = cand.get(id)!
      const avail = list.map((e) => {
        const s = new Set<Cell>()
        for (const x of e.cells) if (inAvail(x)) s.add(x)
        return s
      })
      // 1) a single clue whose available cells are exactly {cell}.
      let idx: number[] | null = null
      for (let i = 0; i < list.length; i++) {
        if (avail[i].size === 1 && avail[i].has(cell)) {
          idx = [i]
          break
        }
      }
      // 2) else a PAIR whose available cells intersect to exactly {cell} — but never a
      //    column+row pair (that is a bare coordinate pin, which reads ugly).
      for (let i = 0; i < list.length && !idx; i++) {
        if (!avail[i].has(cell)) continue
        for (let j = i + 1; j < list.length; j++) {
          if (!avail[j].has(cell)) continue
          if (isLineClue(list[i].json) && isLineClue(list[j].json)) continue
          let extra = false
          for (const x of avail[i]) {
            if (x !== cell && avail[j].has(x)) {
              extra = true
              break
            }
          }
          if (!extra) {
            idx = [i, j]
            break
          }
        }
      }
      if (idx) {
        pinnedId = id
        pinnedClue = idx.length === 1 ? list[idx[0]].json : { type: 'and', clues: idx.map((k) => list[k].json) }
        break
      }
    }
    if (!pinnedId || !pinnedClue) return null // nobody pinnable with ≤2 simple clues — give up
    chosen.set(pinnedId, pinnedClue)
    const { row, col } = board.rc(solution.cellOf(pinnedId))
    availRows.delete(row)
    availCols.delete(col)
    remaining.delete(pinnedId)
  }

  // The cascade pins everyone DIRECTLY — that is too easy. Loosen most suspects so they
  // need a SHORT elimination chain: give each a clue that leaves only a FEW cells open (so
  // 1–2 cross-outs resolve them), while keeping the WHOLE puzzle solvable by simple forward
  // deduction (hidden singles / "only one on X" / row-column cross-out — rank ≤ 2, never a
  // hard technique or contradiction). Natural object/room clues are preferred over a bare
  // column/row; suspects with no short-chain option stay direct (the anchors).
  const SHORT_CHAIN_CELLS = 4
  const solvableChain = (): boolean => {
    const lvl = { ...base, suspects: base.suspects.map((s) => ({ ...s, clues: [chosen.get(s.id)!] })) }
    const res = new DeductionEngine(loadLevel(lvl)).solve()
    return res.solved && res.maxRank <= 2
  }
  for (const id of rng.shuffle([...suspectIds])) {
    const current = chosen.get(id)!
    const opts = cand
      .get(id)!
      .filter((e) => e.cells.size >= 2 && e.cells.size <= SHORT_CHAIN_CELLS) // a few open cells
      .sort((a, b) => {
        const la = isLineClue(a.json) ? 1 : 0
        const lb = isLineClue(b.json) ? 1 : 0
        return la - lb || b.cells.size - a.cells.size // natural & loosest-within-cap first
      })
    for (const e of opts) {
      if (e.json === current) continue
      chosen.set(id, e.json)
      if (solvableChain()) break
      chosen.set(id, current)
    }
  }

  // VARIETY cap (all difficulties): per `familyCap` — at most ONE line (row/column) clue,
  // at most two of every other capped family. Switch an offender to another easy clue that
  // keeps the short chain solvable; give up on this layout if it can't be met.
  const capTypes = cappedFamilies
  const famCounts = (): Map<string, number> => {
    const m = new Map<string, number>()
    for (const id of suspectIds) for (const t of capTypes(chosen.get(id)!)) m.set(t, (m.get(t) ?? 0) + 1)
    return m
  }
  for (let guard = 0; guard < 200; guard++) {
    const over = [...famCounts().entries()].find(([fam, n]) => n > familyCap(fam))?.[0]
    if (over === undefined) break
    let fixed = false
    for (const id of rng.shuffle([...suspectIds])) {
      const cur = chosen.get(id)!
      if (!capTypes(cur).includes(over)) continue
      for (const e of cand.get(id)!) {
        if (e.json === cur || capTypes(e.json).includes(over)) continue
        chosen.set(id, e.json)
        if ([...famCounts().entries()].every(([fam, n]) => n <= familyCap(fam)) && solvableChain()) {
          fixed = true
          break
        }
        chosen.set(id, cur)
      }
      if (fixed) break
    }
    if (!fixed) return null
  }

  // AVOID line clues: the user finds "in row/column X" dull at EASY and wants it rare
  // (ideally none, occasionally one — not on most suspects). Replace each line-carrying
  // suspect with a NON-line clue that keeps the short chain solvable and within the cap;
  // prefer a few-open-cells clue over a direct pin so it isn't trivialised. Keep the line
  // clue only when nothing else works.
  const hasLine = (c: ClueJson): boolean =>
    c.type === 'and' ? c.clues.some(hasLine) : isLineClue(c)
  for (const id of rng.shuffle([...suspectIds])) {
    const cur = chosen.get(id)!
    if (!hasLine(cur)) continue
    const opts = cand
      .get(id)!
      .filter((e) => e.json !== cur && !hasLine(e.json))
      .sort((a, b) => {
        const sa = a.cells.size >= 2 && a.cells.size <= SHORT_CHAIN_CELLS ? 0 : 1
        const sb = b.cells.size >= 2 && b.cells.size <= SHORT_CHAIN_CELLS ? 0 : 1
        return sa - sb || clarityOf(a.json) - clarityOf(b.json)
      })
    for (const e of opts) {
      chosen.set(id, e.json)
      if ([...famCounts().entries()].every(([fam, n]) => n <= familyCap(fam)) && solvableChain()) break
      chosen.set(id, cur)
    }
  }

  // No two suspects may show the IDENTICAL clue (the "he/she" subject is not part of the
  // clue). Switch an offender to another easy clue that keeps the short chain solvable and
  // within the cap, lowering the duplicate count each round; give up on this layout if a
  // duplicate can't be cleared.
  const chosenList = (): ClueJson[] => suspectIds.map((id) => chosen.get(id)!)
  for (let guard = 0; guard < 200; guard++) {
    const before = duplicateClueCount(chosenList())
    if (before === 0) break
    let fixed = false
    for (const id of rng.shuffle([...suspectIds])) {
      const cur = chosen.get(id)!
      for (const e of cand.get(id)!) {
        if (e.json === cur) continue
        chosen.set(id, e.json)
        if (
          duplicateClueCount(chosenList()) < before &&
          [...famCounts().entries()].every(([fam, n]) => n <= familyCap(fam)) &&
          solvableChain()
        ) {
          fixed = true
          break
        }
        chosen.set(id, cur)
      }
      if (fixed) break
    }
    if (!fixed) return null
  }

  // EASY: the victim must be placed LAST — ALL suspects pin from their own clues first,
  // then the victim is simply the last free cell. The user dislikes the mid-solve "this
  // lone cell can only be the victim ⇒ now the rest follows" (fine at medium/hard, not
  // easy). Reject layouts where the forward solve places the victim before a suspect.
  const victimPlacedLast = (): boolean => {
    const lvl = { ...base, suspects: base.suspects.map((s) => ({ ...s, clues: [chosen.get(s.id)!] })) }
    const res = new DeductionEngine(loadLevel(lvl)).solve()
    if (!res.solved) return false
    let victimAt = -1
    let lastSuspectAt = -1
    res.steps.forEach((step, i) => {
      if (step.placedCell === undefined || !step.personId) return
      if (step.personId === VICTIM_ID) victimAt = i
      else lastSuspectAt = i
    })
    return victimAt > lastSuspectAt
  }
  if (!victimPlacedLast()) return null
  return chosen
}

/** How many suspects are directly placeable from their OWN clue alone (their clues pin a
 *  single cell, with no need to cross anything out first). */
function countAnchors(
  chosen: Map<PersonId, ClueJson>,
  suspectIds: PersonId[],
  board: Board,
): number {
  let anchors = 0
  for (const id of suspectIds) {
    const cc = createClue(chosen.get(id)!).candidateCells(board)
    if (cc && cc.size === 1) anchors++
  }
  return anchors
}

/**
 * Build each suspect's clue by FORWARD CONSTRUCTION toward a target difficulty, the
 * same spirit as the easy constructor but aimed at the harder tiers. The DeductionEngine
 * is the only oracle: a level it solves by pure forward logic is ALREADY unique, so we
 * never run the old (expensive) prove-uniqueness-by-search loop.
 *
 *   1. TIGHTEN — start each suspect on their tightest natural clue and add more until the
 *      case is human-solvable (forward + convergent, no proof-by-contradiction).
 *   2. LOOSEN  — drop redundant ANDed parts, then widen each single clue toward looser
 *      candidates, RAISING the technique rank the solution needs up to `target`
 *      (medium ⇒ a rank-4 room/count deduction, hard ⇒ the rank-5 murder rule or
 *      convergent case split) while staying human-solvable. Looser clues ⇒ harder.
 *
 * Returns the loosest human-solvable clue set found — its rank may fall short of `target`
 * on a constrained board, and the caller (`pickBestLevel`) rates it honestly and keeps
 * hunting. Returns null only if the board admits no human-solvable forward solution.
 */
/** How many of a suspect's loosest candidate clues the widen pass (2b) tries — bounds
 *  the per-attempt cost on big, clue-rich boards. */
const WIDEN_SCAN = 8
function constructLogicClues(
  base: LevelJson,
  suspectIds: PersonId[],
  candidates: Map<PersonId, ClueJson[]>,
  rng: Rng,
  target: number,
  maxLineClues: number,
  /** HARD only: actively convert suspects onto broad relational/social clues so the
   *  level leans on MANY hard clues (the user's definition of hard), not on a single
   *  high-rank technique. */
  preferIndirect = false,
): Map<PersonId, ClueJson> | null {
  for (const id of suspectIds) if (candidates.get(id)!.length === 0) return null

  const board = loadLevel(base).board
  const totalCells = board.occupiableCells().length
  // Each suspect's clue = the AND of their natural candidates at these indices.
  const list = (id: PersonId): ClueJson[] => candidates.get(id)!

  // Memoised candidate breadth (cells the clue leaves open).
  const breadthCache = new Map<string, number>()
  const breadthAt = (id: PersonId, i: number): number => {
    const key = `${id}:${i}`
    let size = breadthCache.get(key)
    if (size === undefined) {
      size = createClue(list(id)[i]).candidateCells(board)?.size ?? totalCells
      breadthCache.set(key, size)
    }
    return size
  }
  // The loosest candidate that still says SOMETHING (an uninformative clue covering
  // every cell would make the suspect count as unrestricted) and isn't a dull line.
  const broadestIdx = (id: PersonId): number => {
    for (let i = list(id).length - 1; i >= 0; i--) {
      if (isLine(list(id)[i])) continue
      const size = breadthAt(id, i)
      if (size < totalCells && size > 1) return i
    }
    return 0
  }

  const isLine = (clue: ClueJson): boolean => clue.type === 'inRow' || clue.type === 'inCol'
  // Most suspects start on their TIGHTEST clue (fast, reliably solvable); about a
  // third start on a BROAD one ("nicht neben einer Pflanze", "nicht im Garten") so
  // levels keep using clues that leave much of the board open — a deliberate
  // preference WITHOUT any fixed quota (the user's call).
  // HARD (preferIndirect) starts MORE suspects on a broad clue, leaving gaps the global
  // board clues then resolve — so the offered board clues become genuinely needed (the
  // user wants hard to lean on global clues, often several).
  const broadStartChance = preferIndirect ? 0.5 : 0.35
  const used = new Map<PersonId, number[]>(
    suspectIds.map((id) => [id, [rng.chance(broadStartChance) ? broadestIdx(id) : 0]]),
  )
  const clueOf = (id: PersonId): ClueJson => {
    const parts = used.get(id)!.map((i) => list(id)[i])
    return parts.length === 1 ? parts[0] : { type: 'and', clues: parts }
  }
  const rate = () =>
    logicRating({ ...base, suspects: base.suspects.map((s) => ({ ...s, clues: [clueOf(s.id)] })) })

  // A suspect must carry at most ONE exact-coordinate clue (fixed row/column OR an exact
  // offset from someone): two of them pin the exact cell, which the user forbids
  // ("don't give the direct spot away"). Generalises the old inRow+inCol ban to offsets.
  const tooManyExactPins = (id: PersonId): boolean =>
    used.get(id)!.filter((i) => isExactAxisClue(list(id)[i])).length >= 2
  // No two suspects may show the IDENTICAL clue (same predicate, regardless of who it is
  // about) — the user dislikes e.g. two "was not beside a locker".
  const noDuplicateClues = (): boolean => duplicateClueCount(suspectIds.map(clueOf)) === 0
  const lineSuspects = (): number =>
    suspectIds.filter((id) => used.get(id)!.some((i) => isLine(list(id)[i]))).length
  const hasHardClue = (id: PersonId): boolean =>
    used.get(id)!.some((i) => isHardClue(list(id)[i]))

  // VARIETY: per `familyCap` — at most ONE line clue, at most two of every other capped
  // family (positive and negated count together), across all difficulties — so a level
  // can't lean on one type (e.g. a chain of "north of …"). Object / room / window-door
  // families are EXEMPT (they read as different clues per target); see `UNCAPPED_TYPES`.
  const cappedTypes = cappedFamilies
  const typeCounts = (): Map<string, number> => {
    const m = new Map<string, number>()
    for (const id of suspectIds) for (const t of cappedTypes(clueOf(id))) m.set(t, (m.get(t) ?? 0) + 1)
    return m
  }
  const capOk = (): boolean => [...typeCounts().entries()].every(([fam, n]) => n <= familyCap(fam))

  // Fallback tightener: AND another part onto the suspect with the fewest (the old
  // construction) — used once single-clue tightening alone doesn't get there.
  const addPart = (): boolean => {
    const order = rng
      .shuffle([...suspectIds])
      .sort((a, b) => used.get(a)!.length - used.get(b)!.length)
    for (const id of order) {
      const u = used.get(id)!
      for (let i = 0; i < list(id).length; i++) {
        if (u.includes(i)) continue
        u.push(i)
        if (tooManyExactPins(id) || lineSuspects() > maxLineClues || !noDuplicateClues()) {
          u.pop()
          continue
        }
        return true
      }
    }
    return false
  }

  // 1) TIGHTEN until human-solvable (add a clue to the suspect with the fewest, never
  //    inRow+inCol together, ≤ maxLineClues line clues overall). The default engine is
  //    contradiction-free, so "solved" already means "solvable without trial-and-error".
  for (let guard = 0; guard < 400; guard++) {
    const st = rate()
    if (st.solved) break
    if (!addPart()) return null
  }
  if (!rate().solved) return null // no human-solvable forward chain on this board

  // 2a) LOOSEN: drop redundant ANDed parts — minimal clues ⇒ the hardest forward path —
  //     as long as it stays human-solvable and doesn't overshoot the target rank.
  for (const id of suspectIds) {
    const u = used.get(id)!
    for (let k = u.length - 1; k >= 0 && u.length > 1; k--) {
      const removed = u.splice(k, 1)[0]
      const st = rate()
      if (!(st.solved && st.maxRank <= target)) u.splice(k, 0, removed)
    }
  }

  // 2a-hard) HARD ONLY — make as many suspects as possible carry a BROAD relational/social
  //     clue (one direction from a person, beside the same object as someone, in a room with
  //     someone). These are the "hard" families the user wants piled up; the loosest one
  //     first (wide ⇒ the player must cross-reference more). A switch is kept ONLY while the
  //     level stays human-solvable, so it never turns it unsolvable or ambiguous; suspects
  //     with no workable hard candidate just keep their current clue.
  if (preferIndirect) {
    for (const id of rng.shuffle([...suspectIds])) {
      if (hasHardClue(id)) continue
      const u = used.get(id)!
      if (u.length !== 1) continue
      const current = u[0]
      const hardIdx = list(id)
        .map((clue, i) => ({ clue, i }))
        .filter(({ clue, i }) => isHardClue(clue) && i !== current)
        .sort((a, b) => breadthAt(id, b.i) - breadthAt(id, a.i))
      for (const { i } of hardIdx) {
        u[0] = i
        if (
          rate().solved &&
          !tooManyExactPins(id) &&
          lineSuspects() <= maxLineClues &&
          capOk() &&
          noDuplicateClues()
        ) {
          break
        }
        u[0] = current
      }
    }
  }

  // 2b) LOOSEN: widen each single clue toward looser candidates (more open cells) to push
  //     the needed rank up to the target — loosest-that-still-works wins, capped so it
  //     never tips into a harder tier. Stop early once target is hit. Only the WIDEN_SCAN
  //     loosest candidates are tried (they are the rank-raising ones), so a big, clue-rich
  //     board can't blow up the attempt's cost.
  if (rate().maxRank < target) {
    for (const id of rng.shuffle([...suspectIds])) {
      if (rate().maxRank >= target) break
      const u = used.get(id)!
      if (u.length !== 1) continue
      const current = u[0]
      const lo = Math.max(current + 1, list(id).length - WIDEN_SCAN)
      for (let j = list(id).length - 1; j >= lo; j--) {
        u[0] = j
        const st = rate()
        if (
          st.solved &&
          st.maxRank <= target &&
          !tooManyExactPins(id) &&
          lineSuspects() <= maxLineClues &&
          capOk() &&
          noDuplicateClues()
        ) {
          break
        }
        u[0] = current
      }
    }
  }

  // 3) VARIETY CAP repair: if any family is still used >2× (e.g. from the broad starts),
  //    switch an offending single-clue suspect to a different family that keeps the level
  //    solvable and within the cap; give up on the board if it can't be met.
  for (let guard = 0; guard < 200 && !capOk(); guard++) {
    const overType = [...typeCounts().entries()].find(([fam, n]) => n > familyCap(fam))?.[0]
    if (overType === undefined) break
    let fixed = false
    for (const id of rng.shuffle([...suspectIds])) {
      const u = used.get(id)!
      if (u.length !== 1 || !cappedTypes(list(id)[u[0]]).includes(overType)) continue
      const current = u[0]
      for (let i = 0; i < list(id).length; i++) {
        if (i === current || cappedTypes(list(id)[i]).includes(overType)) continue
        u[0] = i
        const st = rate()
        if (
          st.solved &&
          st.maxRank <= target &&
          !tooManyExactPins(id) &&
          lineSuspects() <= maxLineClues &&
          capOk()
        ) {
          fixed = true
          break
        }
        u[0] = current
      }
      if (fixed) break
    }
    if (!fixed) return null
  }

  // 4) DEDUPE repair: remove any duplicate clue (two suspects showing the identical hint).
  //    Switch one of the clashing single-clue suspects to a different clue that keeps the
  //    level solvable and within every cap, lowering the duplicate count each round; give up
  //    on the board if the duplicate can't be cleared.
  for (let guard = 0; guard < 300; guard++) {
    const before = duplicateClueCount(suspectIds.map(clueOf))
    if (before === 0) break
    let fixed = false
    for (const id of rng.shuffle([...suspectIds])) {
      const u = used.get(id)!
      if (u.length !== 1) continue
      const current = u[0]
      for (let i = 0; i < list(id).length; i++) {
        if (i === current) continue
        u[0] = i
        const st = rate()
        if (
          st.solved &&
          st.maxRank <= target &&
          !tooManyExactPins(id) &&
          lineSuspects() <= maxLineClues &&
          capOk() &&
          duplicateClueCount(suspectIds.map(clueOf)) < before
        ) {
          fixed = true
          break
        }
        u[0] = current
      }
      if (fixed) break
    }
    if (!fixed) return null
  }

  return new Map(suspectIds.map((id) => [id, clueOf(id)]))
}

/** How many suspects use a row/column clue — minimised for variety. */
function countLineClues(level: LevelJson): number {
  let n = 0
  for (const s of level.suspects) {
    const clues = s.clues ?? []
    const flat = clues.flatMap((c) => (c.type === 'and' ? c.clues : [c]))
    if (flat.some((c) => c.type === 'inRow' || c.type === 'inCol')) n++
  }
  return n
}

/** Count "exact cell" coordinate pins (inRow AND inCol) — must be 0. */
function countPins(assignment: Map<PersonId, ClueJson>): number {
  let pins = 0
  for (const clue of assignment.values()) {
    if (
      clue.type === 'and' &&
      clue.clues.some((c) => c.type === 'inRow') &&
      clue.clues.some((c) => c.type === 'inCol')
    ) {
      pins++
    }
  }
  return pins
}

