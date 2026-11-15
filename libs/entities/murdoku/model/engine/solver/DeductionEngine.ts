import { Solution } from '../domain/Solution.ts'
import { SolveContext } from './SolveContext.ts'
import { findMurderer } from './murderer.ts'
import { unsatisfiedClues } from './diagnose.ts'
import { createForwardTechniques, propagate, type TechniqueOptions } from './forward.ts'
import { TECHNIQUE_RANK, difficultyOf } from './DeductionStep.ts'
import type { Cell, Explanation, PersonId } from '../domain/types.ts'
import type { Puzzle } from '../domain/Puzzle.ts'
import type { DeductionResult, DeductionStep, HintResult } from './DeductionStep.ts'
import type { Technique } from './techniques/Technique.ts'
import { AloneClue, AndClue, type Clue } from '../clues/index.ts'

/** One player-facing hint distilled from the full solution: cross a now-empty cell,
 *  or place a person. `step` carries the readable reasoning shown to the player. */
interface HintAction {
  kind: 'cross' | 'place'
  /** A placement targets one cell; a cross groups every cell the SAME deduction empties. */
  cells: Cell[]
  personId?: PersonId
  step: DeductionStep
  /** The run's step number this action came from — hints follow strict derivation order. */
  seq: number
  /** For a cross: each dead cell's last possible occupant(s), removed by this very step —
   *  the missing link ("only X could still go here") between the step's reason and the X. */
  lastBy?: Map<Cell, PersonId[]>
}

/** The readable "if X here → … → impossible" trace of a hypothetical step (case
 *  split / forcing), or null for a transparent step (which needs no chain). */
function contradictionChain(step: DeductionStep): Explanation[] | undefined {
  return step.chain && step.chain.length > 0 ? step.chain : undefined
}

/** Techniques whose REASON describes an already-further-deduced board ("everything
 *  crossed except X", "only Y is free") instead of a direct clue fact. Excluded from
 *  the note/figure-correction reasons: those must read as obvious from the clues plus
 *  what the player actually SEES, never from state the run derived beyond it.
 *  NOT in here: crossCenter and rectangle — their texts are self-contained constraint
 *  statements ("Anna can only be in row 7 or column 5; no one fits the intersection")
 *  a player can verify from the clue alone. */
const DERIVED_TECHNIQUES = new Set<DeductionStep['technique']>([
  'hiddenSingleRow',
  'hiddenSingleCol',
  'forcedCell',
  'nakedSingle',
])

/**
 * Solves a puzzle by **pure forward deduction** — no guessing, no trial
 * placements, no search. Each technique only ever places a provably-forced cell
 * or eliminates a provably-impossible one; after every step all techniques are
 * retried, so a placement fires as soon as eliminations make a cell forced (the
 * human "remember impossible cells, then re-check"). Produces the hint path and
 * the difficulty rating. Levels that need search are left `stuck` (the
 * SearchSolver is the fast oracle for uniqueness + the answer).
 */
export class DeductionEngine {
  private readonly techniques: Technique[]
  /** The full solution replayed as ordered player actions — built once, on demand. */
  private hintActionsCache?: HintAction[]
  /** The unique solved cell of every person (suspects + victim), used to validate the
   *  player's figures, crosses and notes — or null when pure deduction can't finish the
   *  level (editor test play). Built once, on demand. */
  private solutionCache?: Map<PersonId, Cell> | null

  private solvedCells(): Map<PersonId, Cell> | null {
    if (this.solutionCache === undefined) {
      const r = this.solve()
      this.solutionCache = r.solved && r.solution ? new Map(r.solution.entries()) : null
    }
    return this.solutionCache
  }

  /**
   * If putting `id` on `cell` is provably wrong — readable off the player's OWN board
   * (their figures and notes) or ruled out by ONE direct pre-placement statement of the
   * deduction run FROM that board (`direct`) — return the one-line reason, else null.
   * NEVER reasons via virtual placements ("Bella must be on Z1/S1") — that spoils.
   */
  private removableReason(
    id: PersonId,
    cell: Cell,
    placed: ReadonlyMap<PersonId, Cell>,
    marks: ReadonlyMap<Cell, ReadonlySet<PersonId>>,
    direct: ReadonlyMap<string, { lines: Explanation[]; rank: number; seq: number }>,
    seqGate: number,
    /** Restrict to reasons READ OFF the visible board (figures + the player's notes) —
     *  used for notes on cells an upcoming cross will clear anyway: only a visible fact
     *  justifies cleaning them EARLIER than that cross. */
    factOnly = false,
  ): Explanation | null {
    // (1) given the player's PLACED figures, this cell directly breaks one of id's own clues
    //   — e.g. once Caroline is placed, Dittbert "south of Caroline" rules out the cells
    //   north of her. Drilled to the broken part for a short, direct reason.
    const person = this.puzzle.people().find((p) => p.id === id)
    const hyp = new Map(placed)
    hyp.set(id, cell)
    for (const clue of person?.clues ?? []) {
      const r = this.brokenLeaf(clue, id, cell, hyp)
      if (r) return r
    }
    // (2) one person per row & column: a figure the player placed already takes this cell's
    //   row or column, so no one else can be here.
    const { row, col } = this.puzzle.board.rc(cell)
    for (const [pid, pc] of placed) {
      if (pid === id) continue
      const p = this.puzzle.board.rc(pc)
      if (p.row === row) return { key: 'why.rowTaken', params: { name: id, target: pid } }
      if (p.col === col) return { key: 'why.colTaken', params: { name: id, target: pid } }
    }
    // (3) another suspect is CONFINED to this cell's row/column by the PLAYER'S OWN NOTES —
    //   e.g. after placing people, all of E's notes sit in one line → no one else there.
    const confined = this.lineConfinedReason(id, cell, marks)
    if (confined) return confined
    // (3b) the player's "Überkreuzung": another suspect's notes sit entirely on this cell's
    //   row + column (the cross), so anyone HERE would block both lines at once.
    const crossed = this.crossConfinedReason(id, cell, marks)
    if (crossed) return crossed
    // (4) the deduction seeded with the player's board rules the cell out in one DIRECT
    //   pre-placement step (e.g. "A, B, E share rows 4/6/7", a relational bound, or the
    //   murder-rule feasibility check) — grounded AND spoiler-free by construction.
    //   STRICT DERIVATION ORDER (`seqGate`): the reason may not come from later in the
    //   run than the earliest consequence still visible on the player's board — e.g.
    //   "Floyd: only row 6" (step 15) must wait while the player's Floyd notes outside
    //   row 6 still stand (they fall at steps 10/11, so those hints come first).
    if (factOnly) return null
    const e = direct.get(`${id}:${cell}`)
    if (e && e.lines.length === 1 && e.seq <= seqGate) return e.lines[0]
    return null
  }

  /** If, by the PLAYER'S notes, some OTHER suspect is now only noted within `cell`'s row (or
   *  column) — and that line really is theirs in the solution — they must occupy it, so
   *  nobody else (incl. `id`) can be in it. Uses the player's marks, VALIDATED against the
   *  solution so a mis-narrowed note never triggers a wrong removal. */
  private lineConfinedReason(
    id: PersonId,
    cell: Cell,
    marks: ReadonlyMap<Cell, ReadonlySet<PersonId>>,
  ): Explanation | null {
    const board = this.puzzle.board
    const { row, col } = board.rc(cell)
    for (const other of this.puzzle.suspects) {
      if (other.id === id) continue
      const noted: Cell[] = []
      for (const [c, ids] of marks) if (ids.has(other.id)) noted.push(c)
      if (noted.length === 0) continue
      const sol = this.solvedCellOf(other.id)
      if (sol === null) continue
      const s = board.rc(sol)
      if (s.row === row && noted.every((c) => board.rc(c).row === row)) {
        return { key: 'why.rowConfined', params: { name: id, target: other.id, num: row + 1 } }
      }
      if (s.col === col && noted.every((c) => board.rc(c).col === col)) {
        return { key: 'why.colConfined', params: { name: id, target: other.id, num: col + 1 } }
      }
    }
    return null
  }

  /** If, by the PLAYER'S notes, some OTHER suspect can only be on `cell`'s row or column
   *  (≥2 noted cells, all on that cross, none ON `cell` itself, and genuinely both lines) —
   *  and the solution really keeps them on that cross — then anyone on `cell` would block
   *  BOTH lines at once and leave them without a cell: nobody can be here. This is the
   *  player's own "Überkreuzung" argument, told from their notes. */
  private crossConfinedReason(
    id: PersonId,
    cell: Cell,
    marks: ReadonlyMap<Cell, ReadonlySet<PersonId>>,
  ): Explanation | null {
    const board = this.puzzle.board
    const { row, col } = board.rc(cell)
    const inCross = (c: Cell) => board.rc(c).row === row || board.rc(c).col === col
    for (const other of this.puzzle.suspects) {
      if (other.id === id) continue
      const noted: Cell[] = []
      for (const [c, ids] of marks) if (ids.has(other.id)) noted.push(c)
      if (noted.length < 2 || noted.includes(cell) || !noted.every(inCross)) continue
      // A single shared line is lineConfined's (clearer) case — here both lines must matter.
      if (noted.every((c) => board.rc(c).row === row)) continue
      if (noted.every((c) => board.rc(c).col === col)) continue
      const sol = this.solvedCellOf(other.id)
      if (sol === null || !inCross(sol)) continue
      return {
        key: 'why.crossConfined',
        params: { target: other.id, rowNum: row + 1, colNum: col + 1, cell },
      }
    }
    return null
  }

  /** This suspect's cell in the (unique) solution — read from the replayed place actions, or
   *  null if pure deduction can't place it. Used to VALIDATE a "place from your notes" hint. */
  private solvedCellOf(id: PersonId): Cell | null {
    for (const a of this.hintActions()) {
      if (a.kind === 'place' && a.personId === id) return a.cells[0]
    }
    return null
  }

  /** The leaf-level reason a clue forbids `cell` for `id` given the board `hyp` (the player's
   *  figures + this cell), or null — drilling into AND so a compound clue blames only its ONE
   *  broken part: a positional part whose fixed cells exclude the cell, or a relation / "alone"
   *  already broken by a placed figure. */
  private brokenLeaf(
    clue: Clue,
    id: PersonId,
    cell: Cell,
    hyp: ReadonlyMap<PersonId, Cell>,
  ): Explanation | null {
    const board = this.puzzle.board
    if (clue instanceof AndClue) {
      for (const c of clue.clues) {
        const r = this.brokenLeaf(c, id, cell, hyp)
        if (r) return r
      }
      return null
    }
    const cells = clue.candidateCells(board)
    if (cells && !cells.has(cell)) {
      return { key: 'why.brokenClue', params: { name: id }, children: [clue.describe()] }
    }
    if (clue.violatedBy(id, hyp, this.puzzle)) {
      if (clue instanceof AloneClue) {
        const room = board.roomIdOf(cell)
        const blocker = [...hyp].find(([pid, pc]) => pid !== id && board.roomIdOf(pc) === room)
        if (blocker) return { key: 'why.aloneOccupied', params: { name: id, target: blocker[0] } }
      }
      return { key: 'why.brokenClue', params: { name: id }, children: [clue.describe()] }
    }
    return null
  }

  constructor(
    private readonly puzzle: Puzzle,
    opts: TechniqueOptions = {},
  ) {
    this.techniques = createForwardTechniques(puzzle, opts)
  }

  solve(): DeductionResult {
    const ctx = SolveContext.create(this.puzzle)
    const steps: DeductionStep[] = []
    this.seedDomains(ctx)
    this.recordCandidates(ctx, steps)

    for (const step of propagate(ctx, this.techniques)) steps.push(step)

    if (ctx.state.unplaced().length > 0) {
      steps.push({
        technique: 'stuck',
        explanation: { key: 'step.stuck', params: { count: ctx.state.unplaced().length } },
      })
      return this.finish(steps, null, false)
    }

    const solution = new Solution(new Map(ctx.state.placed))
    // A COMPLETE placement is only genuinely SOLVED if it actually satisfies every clue and
    // the murder rule. Some clues — notably existence clues like "another <trait> in my room"
    // — are not fully enforced by any forward technique, so the techniques can drive the board
    // to a complete BUT INVALID arrangement (the SearchSolver would then find 0 solutions). If
    // so, this is not a solution: report `solved: false` so the engine never disagrees with
    // whether a valid arrangement actually exists.
    if (unsatisfiedClues(this.puzzle, ctx.state.placed).length > 0) {
      steps.push({ technique: 'stuck', explanation: { key: 'step.contradiction' } })
      return this.finish(steps, null, false)
    }
    steps.push(this.identifyMurderer(solution))
    return this.finish(steps, solution, true)
  }

  /**
   * The next hint for the player — computed FROM THE PLAYER'S BOARD, not from a canonical
   * replay of the empty board: the deduction is seeded with their validated figures and
   * crosses and run forward from there, so every reason references what they actually see
   * (nothing they already did is re-told). Returns the FIRST action they haven't done yet;
   * pressing again repeats the same hint until they act on it.
   *
   * Order: (0) remove a wrong figure, (0b) remove a wrong cross, (1) place a suspect the
   * notes pin to ONE cell, (2) remove notes on MULTI-note cells, (3) on SINGLE-note cells,
   * (4) cross out, (5) place. All corrections come BEFORE deductions — first straighten
   * the player's own input, then build on it.
   */
  nextHint(
    placed: ReadonlyMap<PersonId, Cell>,
    crosses: ReadonlySet<Cell> = new Set(),
    marks: ReadonlyMap<Cell, ReadonlySet<PersonId>> = new Map(),
  ): HintResult | null {
    // Every suspect placed ⇒ the case is solved; the leftover crosses don't matter.
    if (this.puzzle.suspects.every((s) => placed.has(s.id))) return null

    // Split the player's input into provably-correct (seeds the grounded deduction) and
    // wrong (surfaced as corrections). Without a unique engine solution (editor test play)
    // nothing is validatable — then everything seeds and the corrections are skipped.
    const sol = this.solvedCells()
    const okPlaced = new Map<PersonId, Cell>()
    const wrongPlaced: [PersonId, Cell][] = []
    for (const [id, cell] of placed) {
      if (sol?.has(id) && sol.get(id) !== cell) wrongPlaced.push([id, cell])
      else okPlaced.set(id, cell)
    }
    const solCells = sol ? new Set(sol.values()) : null
    const okCrosses = new Set<Cell>()
    const wrongCrosses: Cell[] = []
    for (const c of crosses) {
      if (solCells?.has(c)) wrongCrosses.push(c)
      else okCrosses.add(c)
    }
    const grounded = this.buildActions({ placed: okPlaced, crosses: okCrosses })

    // STRICT DERIVATION ORDER: run-step reasons may not use knowledge from later in the
    // run than the earliest consequence still VISIBLE on the player's board — their
    // earliest-falling note is handled first (as a cross or its own correction).
    let seqGate = Infinity
    for (const [cell, ids] of marks) {
      for (const id of ids) {
        if (placed.has(id)) continue // a placed figure's leftover notes are moot
        const e = grounded.elim.get(`${id}:${cell}`)
        if (e && e.seq < seqGate) seqGate = e.seq
      }
    }

    // (0) a wrongly-placed figure → remove it, with a reason read off the player's board
    // where one exists in a single line; otherwise flag it plainly — never build on it.
    // (With no solution to validate against, check EVERY figure for a visible reason.)
    for (const [id, cell] of sol ? wrongPlaced : [...placed]) {
      const why = this.removableReason(id, cell, placed, marks, grounded.direct, seqGate)
      if (why) {
        return {
          step: {
            technique: 'playerError',
            personId: id,
            explanation: { key: 'step.removePlacement', params: { name: id, cell } },
            chain: [why],
          },
          focus: [cell],
          kind: 'unplace',
        }
      }
    }
    for (const [id, cell] of wrongPlaced) {
      return {
        step: {
          technique: 'playerError',
          personId: id,
          explanation: { key: 'step.placementWrong', params: { name: id, cell } },
        },
        focus: [cell],
        kind: 'unplace',
      }
    }

    // (0b) a wrong cross — say it's wrong (but never what belongs there) and have it
    // removed before any deduction builds on the crosses.
    if (wrongCrosses.length > 0) {
      const cells = wrongCrosses.sort((a, b) => a - b)
      return {
        step: {
          technique: 'playerError',
          explanation: {
            key: 'step.removeCross',
            params: { cells: cells.join(','), count: cells.length },
          },
        },
        focus: cells,
        kind: 'uncross',
      }
    }

    // (0c) CERTAIN PLACEMENTS come BEFORE any crossing — when a figure's cell is already
    // determined, SET it instead of first crossing the rest of a line out. User request: a
    // pure priority shuffle (only when the cell is truly unique); the normal cross-then-place
    // order stands otherwise.
    //   (A) the player's OWN single note on a cell → set that person (validated against the
    //       solution); a wrong single note is flagged instead. Their own narrowing acts first.
    for (const s of this.puzzle.suspects) {
      if (placed.has(s.id)) continue
      const noted: Cell[] = []
      for (const [cell, ids] of marks) if (ids.has(s.id)) noted.push(cell)
      if (noted.length !== 1) continue
      const cell = noted[0]
      const sol = this.solvedCellOf(s.id)
      if (sol === cell) {
        return {
          step: { technique: 'playerError', personId: s.id, explanation: { key: 'step.placeFromNotes', params: { name: s.id, cell } } },
          focus: [cell],
          kind: 'place',
        }
      }
      if (sol !== null) {
        return {
          step: { technique: 'playerError', personId: s.id, explanation: { key: 'step.notesWrong', params: { name: s.id, cell } } },
          focus: [cell],
          kind: 'unmark',
        }
      }
    }
    //   (B) the board itself (clues + the player's crosses + placed figures) already pins a
    //       suspect to one cell — set them, again before any bookkeeping cross.
    const forcedPlace = this.forcedSinglePlace(okPlaced, okCrosses, grounded)
    if (forcedPlace) return forcedPlace

    // (1a) PURE BOOKKEEPING first — visible from the crosses alone, no clue or note
    // involved: a line with exactly one free cell forces its crossing line shut.
    const forced = this.forcedCellHint(placed, crosses)
    if (forced) return forced

    // (1b) bookkeeping from the player's own (validated) NOTES: a suspect confined by
    // their notes to one line or to a row+column cross frees provably-empty cells.
    const confinedCross = this.confinedNotesCrossHint(placed, crosses, marks)
    if (confinedCross) return confinedCross

    // Cells the grounded run proves EMPTY get crossed in phase (4) — and crossing a cell
    // clears its notes automatically (useGameSession). Notes there get NO separate
    // removal hint UNLESS a fact visible on the board (figures/notes) already justifies
    // it — then cleaning still comes first; otherwise the cross sweeps them along.
    const crossable = new Set<Cell>()
    for (const a of grounded.actions) {
      if (a.kind === 'cross') for (const c of a.cells) crossable.add(c)
    }

    // (2) notes on MULTI-note cells (≥ 2 notes) — investigate those first.
    const multi = this.removableMarksHint(marks, placed, grounded.direct, seqGate, crossable, (cell) => (marks.get(cell)?.size ?? 0) >= 2)
    if (multi) return multi

    // (3) notes on SINGLE-note cells — still clue-based removals, so before any crossing.
    const single = this.removableMarksHint(marks, placed, grounded.direct, seqGate, crossable, (cell) => (marks.get(cell)?.size ?? 0) === 1)
    if (single) return single

    // The strict-order safety net for phase (4)+(5): if the walk would surface an action
    // from LATER in the run than the earliest still-standing note, that note is cleaned
    // FIRST — with its eliminating step's own reason. At that point every earlier action
    // is already done, so the reason's premises are visible on the player's board.
    let gateHint: HintResult | null = null
    if (seqGate !== Infinity) {
      for (const s of this.puzzle.suspects) {
        if (placed.has(s.id)) continue
        const cells: Cell[] = []
        let reason: Explanation[] | null = null
        for (const [cell, ids] of marks) {
          if (!ids.has(s.id)) continue
          const e = grounded.elim.get(`${s.id}:${cell}`)
          if (e?.seq === seqGate) {
            cells.push(cell)
            reason = e.lines
          }
        }
        if (reason) {
          cells.sort((a, b) => a - b)
          gateHint = {
            step: {
              technique: 'playerError',
              personId: s.id,
              explanation: { key: 'step.removeMarks', params: { name: s.id, cells: cells.join(',') } },
              chain: reason,
            },
            focus: cells,
            kind: 'unmark',
          }
          break
        }
      }
    }

    // (4)+(5) crossing and placing, walked over the deduction FROM the player's board.
    // The canonical replay remains only as a fallback for when that run can't progress
    // (e.g. unvalidatable input on a level the engine can't finish).
    return (
      this.walkActions(grounded.actions, placed, crosses, seqGate, gateHint) ??
      this.walkActions(this.hintActions(), placed, crosses, Infinity, null)
    )
  }

  /**
   * A suspect the VISIBLE board already pins to a single cell — their clues + the player's
   * crosses + placed figures leave exactly one option — is surfaced as a `place` hint BEFORE
   * any crossing (phase 0c), so an unambiguous figure gets set right away instead of after
   * eliminations the player has effectively already made. Fires ONLY when the cell is unique;
   * reuses the grounded run's own place action for its readable "why the others fail" chain.
   * Seeds a context exactly like `buildActions` (clues, then crosses, then figures).
   */
  private forcedSinglePlace(
    placed: ReadonlyMap<PersonId, Cell>,
    crosses: ReadonlySet<Cell>,
    grounded: { actions: HintAction[] },
  ): HintResult | null {
    const victimId = this.puzzle.victim.id
    const ctx = SolveContext.create(this.puzzle)
    this.seedDomains(ctx)
    for (const id of ctx.state.unplaced()) {
      const domain = ctx.state.domain(id)
      for (const c of crosses) domain.delete(c)
    }
    for (const [id, cell] of placed) ctx.place(id, cell)
    // Unplaced suspects (never the victim) now pinned to exactly one cell.
    const forced: { id: PersonId; cell: Cell }[] = []
    for (const id of ctx.state.unplaced()) {
      if (id === victimId) continue
      const domain = ctx.state.domain(id)
      if (domain.size !== 1) continue
      const cell = [...domain][0]
      // With a known solution, only trust a single that matches it (a stray input could
      // otherwise pin a wrong cell); in editor test-play (no solution) just take it.
      const sol = this.solvedCellOf(id)
      if (sol !== null && sol !== cell) continue
      forced.push({ id, cell })
    }
    if (forced.length === 0) return null
    // Topmost-leftmost first, matching the other tie-breaks.
    forced.sort((a, b) => a.cell - b.cell)
    const { id, cell } = forced[0]
    // Prefer the grounded run's own place action — it carries the full elimination chain; fall
    // back to a bare place hint only if (unexpectedly) the run never placed this suspect.
    const action = grounded.actions.find((a) => a.kind === 'place' && a.personId === id)
    if (action) return { step: action.step, focus: action.cells, kind: 'place' }
    return {
      step: {
        technique: 'nakedSingle',
        personId: id,
        placedCell: cell,
        explanation: { key: 'step.nakedSingle', params: { name: id, cell } },
      },
      focus: [cell],
      kind: 'place',
    }
  }

  /**
   * Bookkeeping from the player's own NOTES (validated against the solution — the noted
   * cells must contain the person's true cell). Everyone occupies a distinct row and
   * column, so if a suspect's notes confine them to:
   *  - ONE line → that line is theirs: every other free cell of it is empty → cross;
   *  - a row+column CROSS → anyone on a cell that shares a line with EVERY note would
   *    block them completely → such intersection cells are empty → cross.
   * The player's "Überkreuzung", surfaced proactively as crosses (crossing also clears
   * any notes sitting on those cells).
   */
  private confinedNotesCrossHint(
    placed: ReadonlyMap<PersonId, Cell>,
    crosses: ReadonlySet<Cell>,
    marks: ReadonlyMap<Cell, ReadonlySet<PersonId>>,
  ): HintResult | null {
    const board = this.puzzle.board
    const occupied = new Set(placed.values())
    const free = (c: Cell) => !crosses.has(c) && !occupied.has(c)
    for (const s of this.puzzle.suspects) {
      if (placed.has(s.id)) continue
      const noted: Cell[] = []
      for (const [c, ids] of marks) if (ids.has(s.id)) noted.push(c)
      if (noted.length < 2) continue
      const sol = this.solvedCellOf(s.id)
      if (sol === null || !noted.includes(sol)) continue
      const rows = new Set(noted.map((n) => board.rc(n).row))
      const cols = new Set(noted.map((n) => board.rc(n).col))
      // One line → the rest of it is provably empty.
      for (const [axis, lines] of [['row', rows], ['col', cols]] as const) {
        if (lines.size !== 1) continue
        const line = [...lines][0]
        const cells = [...(axis === 'row' ? board.cellsInRow(line) : board.cellsInCol(line))]
          .filter((c) => free(c) && !noted.includes(c))
          .sort((a, b) => a - b)
        if (cells.length === 0) continue
        return {
          step: {
            technique: 'playerError',
            personId: s.id,
            explanation: {
              key: axis === 'row' ? 'why.rowConfined' : 'why.colConfined',
              params: { target: s.id, num: line + 1 },
            },
            chain: [{ key: 'why.crossThis', params: { cells: cells.join(',') } }],
          },
          focus: cells,
          kind: 'exclude',
        }
      }
      // Cross shape → each free cell sharing a line with EVERY note blocks the suspect
      // completely, so it must be empty.
      const ks = [...board.occupiableCells()]
        .filter((k) => free(k) && !noted.includes(k))
        .filter((k) => {
          const { row, col } = board.rc(k)
          return noted.every((n) => board.rc(n).row === row || board.rc(n).col === col)
        })
        .sort((a, b) => a - b)
      if (ks.length > 0) {
        const k = ks[0]
        const { row, col } = board.rc(k)
        return {
          step: {
            technique: 'playerError',
            personId: s.id,
            explanation: {
              key: 'why.crossConfined',
              params: { target: s.id, rowNum: row + 1, colNum: col + 1, cell: k },
            },
            chain: [{ key: 'why.crossThis', params: { cells: String(k) } }],
          },
          focus: [k],
          kind: 'exclude',
        }
      }
    }
    return null
  }

  /**
   * Pure bookkeeping the player can do by LOOKING at their crosses (no clue, no note):
   * in a full permutation every row/column holds exactly one person, so a figure-free
   * line with exactly ONE free cell must hold its person there — the crossing line
   * through that cell is taken and its other free cells get crossed. The player wants
   * this IMMEDIATELY, before any note work ("da sind Hinweise egal").
   */
  private forcedCellHint(
    placed: ReadonlyMap<PersonId, Cell>,
    crosses: ReadonlySet<Cell>,
  ): HintResult | null {
    const board = this.puzzle.board
    if (this.puzzle.people().length !== board.width || board.width !== board.height) return null
    const occupied = new Set(placed.values())
    const free = (c: Cell) => !crosses.has(c) && !occupied.has(c)
    for (const axis of ['row', 'col'] as const) {
      const size = axis === 'row' ? board.height : board.width
      for (let line = 0; line < size; line++) {
        const cells = [...(axis === 'row' ? board.cellsInRow(line) : board.cellsInCol(line))]
        if (cells.length === 0 || cells.some((c) => occupied.has(c))) continue
        const frees = cells.filter(free)
        if (frees.length !== 1) continue
        const cell = frees[0]
        const { row, col } = board.rc(cell)
        const perp = [...(axis === 'row' ? board.cellsInCol(col) : board.cellsInRow(row))]
        const pending = perp.filter((c) => c !== cell && free(c)).sort((a, b) => a - b)
        if (pending.length === 0) continue
        return {
          step: {
            technique: 'forcedCell',
            explanation: {
              key: axis === 'row' ? 'step.forcedCellRow' : 'step.forcedCellCol',
              params: { line: line + 1, cell, perpLine: (axis === 'row' ? col : row) + 1 },
            },
            chain: [{ key: 'why.crossThis', params: { cells: pending.join(',') } }],
          },
          focus: pending,
          kind: 'exclude',
        }
      }
    }
    return null
  }

  /**
   * Walk replayed actions and surface the first one the player hasn't done yet: the next
   * pending cross, else the next placement. Every suggested X is provably empty; the
   * chain names WHO was the cell's last possible occupant so the X never reads as a
   * non sequitur.
   */
  private walkActions(
    actions: HintAction[],
    placed: ReadonlyMap<PersonId, Cell>,
    crosses: ReadonlySet<Cell>,
    seqGate: number,
    gateHint: HintResult | null,
  ): HintResult | null {
    let nextPlace: HintAction | null = null
    for (const action of actions) {
      if (action.kind === 'place') {
        if (placed.get(action.personId!) === action.cells[0]) continue
        // Strict derivation order: never step past a note that falls earlier in the run.
        if (action.seq > seqGate && gateHint) return gateHint
        nextPlace = action
        break
      }
      const pending = action.cells.filter((c) => !crosses.has(c))
      if (pending.length === 0) continue
      if (action.seq > seqGate && gateHint) return gateHint
      // A cell whose emptiness hinges on where the step's OWN subject must go ("only
      // Dalia could go here — but she must be elsewhere") is a non sequitur before that
      // person is placed: hold it back, the PLACE hint comes first. But a cell the
      // step's statement bars DIRECTLY (an alone-room cell that just lost its last
      // outsider, a reserved line, …) surfaces right away — its reason doesn't depend
      // on where the last candidate ends up.
      const ready = pending.filter((c) => {
        const who = action.lastBy?.get(c)
        if (!who || who.length !== 1 || who[0] === this.puzzle.victim.id) return true
        if (who[0] !== action.step.personId) return true
        return placed.has(who[0]) || this.solvedCellOf(who[0]) === null
      })
      if (ready.length === 0) continue
      const cells = ready.join(',')
      // The missing link between the step's reason and the X: WHO was each cell's last
      // possible occupant. Grouped per person; the victim gets the "no suspect" wording.
      const byLast = new Map<PersonId, Cell[]>()
      for (const c of ready) {
        const who = action.lastBy?.get(c)
        if (who?.length === 1) byLast.set(who[0], [...(byLast.get(who[0]) ?? []), c])
      }
      const links: Explanation[] = [...byLast].map(([pid, cs]): Explanation =>
        pid === this.puzzle.victim.id
          ? { key: 'why.lastCandidateVictim', params: { cells: cs.join(',') } }
          : { key: 'why.lastCandidate', params: { cells: cs.join(','), name: pid } },
      )
      // Fallback-path nicety: when the step argued about a person the player has meanwhile
      // (correctly) placed — and the pending cells were exactly that person's — the honest
      // reason is "X already stands on …", not the stale original argument.
      const pid = action.step.personId
      const already =
        pid !== undefined &&
        placed.has(pid) &&
        placed.get(pid) === this.solvedCellOf(pid) &&
        ready.every((c) => {
          const who = action.lastBy?.get(c)
          return who?.length === 1 && who[0] === pid
        })
      const step: DeductionStep = pid !== undefined && already
        ? {
            ...action.step,
            explanation: {
              key: 'step.alreadyPlaced',
              params: { name: pid, cell: placed.get(pid)!, cells },
            },
            chain: [...links, { key: 'why.crossThis', params: { cells } }],
          }
        : {
            ...action.step,
            chain: [...(action.step.chain ?? []), ...links, { key: 'why.crossThis', params: { cells } }],
          }
      return { step, focus: ready, kind: 'exclude' }
    }
    if (nextPlace) return { step: nextPlace.step, focus: nextPlace.cells, kind: 'place' }
    return null
  }

  /** The next "remove your notes" hint among the marked cells `cellAllowed` permits: ONE
   *  reason-group of ONE suspect at a time (topmost-leftmost first), or null. */
  private removableMarksHint(
    marks: ReadonlyMap<Cell, ReadonlySet<PersonId>>,
    placed: ReadonlyMap<PersonId, Cell>,
    direct: ReadonlyMap<string, { lines: Explanation[]; rank: number; seq: number }>,
    seqGate: number,
    crossable: ReadonlySet<Cell>,
    cellAllowed: (cell: Cell) => boolean,
  ): HintResult | null {
    for (const s of this.puzzle.suspects) {
      if (placed.has(s.id)) continue
      const groups = new Map<string, { reason: Explanation; cells: Cell[] }>()
      for (const [cell, ids] of marks) {
        if (!ids.has(s.id) || !cellAllowed(cell)) continue
        const r = this.removableReason(s.id, cell, placed, marks, direct, seqGate, crossable.has(cell))
        if (!r) continue
        const key = `${r.key}|${JSON.stringify(r.params ?? {})}`
        const g = groups.get(key) ?? { reason: r, cells: [] }
        g.cells.push(cell)
        groups.set(key, g)
      }
      const ordered = [...groups.values()].sort((a, b) => Math.min(...a.cells) - Math.min(...b.cells))
      const first = ordered[0]
      if (first) {
        const cells = [...first.cells].sort((a, b) => a - b)
        return {
          step: {
            technique: 'playerError',
            personId: s.id,
            explanation: { key: 'step.removeMarks', params: { name: s.id, cells: cells.join(',') } },
            chain: [first.reason],
          },
          focus: cells,
          kind: 'unmark',
        }
      }
    }
    return null
  }

  /**
   * Replay the deduction once — from the empty board, or seeded with the player's
   * VALIDATED figures and crosses — and distil it into the ordered list of concrete
   * player actions, plus per (person, cell) the FIRST readable reason the run rules it
   * out. A cell is surfaced as a "cross" only at the step that removes its LAST possible
   * occupant — so every suggested X is genuinely empty, never a premature guess.
   * Placement steps auto-cross their own row/column in-game, so those crosses aren't
   * surfaced separately.
   */
  private buildActions(seed?: {
    placed: ReadonlyMap<PersonId, Cell>
    crosses: ReadonlySet<Cell>
  }): {
    actions: HintAction[]
    elim: Map<string, { lines: Explanation[]; rank: number; seq: number }>
    /** The DIRECT subset of `elim` for note/figure corrections: reasons recorded only
     *  BEFORE the run's first virtual placement, from non-placement, non-derived steps —
     *  statements the player can verify from the clues and their visible board alone.
     *  Later reasons hinge on virtual placements ("Bella must be on Z1/S1") and would
     *  spoil deductions the player hasn't made yet. `seq` is the run's step number, so
     *  corrections can follow strict derivation order. */
    direct: Map<string, { lines: Explanation[]; rank: number; seq: number }>
  } {
    const victimId = this.puzzle.victim.id
    const ctx = SolveContext.create(this.puzzle)
    this.seedDomains(ctx)
    if (seed) {
      // The player's board is fact: crossed cells leave every domain, placed figures sit
      // down with full row/column propagation — the run continues from what they SEE.
      for (const id of ctx.state.unplaced()) {
        const domain = ctx.state.domain(id)
        for (const c of seed.crosses) domain.delete(c)
      }
      for (const [id, cell] of seed.placed) ctx.place(id, cell)
    }
    const liveCells = (): Set<Cell> => {
      const set = new Set<Cell>()
      for (const id of ctx.state.unplaced()) for (const c of ctx.state.domain(id)) set.add(c)
      for (const c of ctx.state.placed.values()) set.add(c)
      return set
    }
    let live = liveCells()
    // For each (person, cell) the run rules out, the FIRST (most fundamental) reason —
    // as readable LINES. A proof-by-contradiction step contributes its whole "if X here
    // → … → impossible" chain, everything else its one-line explanation.
    const elimReason = new Map<string, { lines: Explanation[]; rank: number; seq: number }>()
    const directElim = new Map<string, { lines: Explanation[]; rank: number; seq: number }>()
    let placedYet = false
    let seq = 0
    const actions: HintAction[] = []
    let progress = true
    while (progress && ctx.state.unplaced().length > 0) {
      progress = false
      for (const technique of this.techniques) {
        const step = technique.apply(ctx)
        if (!step) continue
        progress = true
        seq++
        const reason = contradictionChain(step) ?? [step.explanation]
        const rank = TECHNIQUE_RANK[step.technique] ?? 0
        const direct =
          !placedYet && step.placedCell === undefined && !DERIVED_TECHNIQUES.has(step.technique)
        for (const e of step.eliminated ?? []) {
          for (const c of e.cells) {
            const key = `${e.personId}:${c}`
            if (!elimReason.has(key)) elimReason.set(key, { lines: reason, rank, seq })
            if (direct && !directElim.has(key)) directElim.set(key, { lines: reason, rank, seq })
          }
        }
        if (step.placedCell !== undefined) placedYet = true
        const nowLive = liveCells()
        if (step.placedCell !== undefined && step.personId && step.personId !== victimId) {
          actions.push({
            kind: 'place',
            cells: [step.placedCell],
            personId: step.personId,
            seq,
            step: { ...step, chain: this.placementWhy(step.personId, step.placedCell, elimReason) },
          })
        } else if (step.placedCell === undefined) {
          // Every cell this reasoning step just emptied (its last occupant removed) —
          // grouped into ONE cross hint so the reason reads once, not per cell. A
          // contradiction step carries its chain so the cross isn't a bare "impossible".
          const dead = [...live].filter((c) => !nowLive.has(c))
          if (dead.length > 0) {
            const lastBy = new Map<Cell, PersonId[]>()
            for (const c of dead) {
              lastBy.set(
                c,
                (step.eliminated ?? []).filter((e) => e.cells.includes(c)).map((e) => e.personId),
              )
            }
            actions.push({
              kind: 'cross',
              cells: dead,
              lastBy,
              seq,
              step: {
                technique: step.technique,
                personId: step.personId,
                explanation: step.explanation,
                chain: contradictionChain(step),
              },
            })
          }
        }
        live = nowLive
        break
      }
    }
    return { actions, elim: elimReason, direct: directElim }
  }

  /** The canonical (empty-board) replay — used to validate player input and as the
   *  fallback hint walk. Cached; the puzzle never changes. */
  private hintActions(): HintAction[] {
    if (!this.hintActionsCache) this.hintActionsCache = this.buildActions().actions
    return this.hintActionsCache
  }

  /**
   * Why each of a placed person's OTHER candidate cells was impossible — the real
   * reasons drawn from the solution, deduped (a step that ruled out several of this
   * person's cells reads once) and softly capped, ending in "so {name} is on {cell}".
   */
  private placementWhy(
    id: PersonId,
    cell: Cell,
    elimReason: ReadonlyMap<string, { lines: Explanation[]; rank: number }>,
  ): Explanation[] {
    const cands = [...this.clueCandidates(id)]
    if (cands.length <= 1) return [{ key: 'why.only', params: { name: id, cell } }]
    const chain: Explanation[] = []
    const seen = new Set<string>()
    for (const c of cands) {
      if (c === cell || chain.length >= 12) continue // soft cap so the panel stays readable
      const lines = elimReason.get(`${id}:${c}`)?.lines
      if (!lines) continue
      const k = lines.map((e) => `${e.key}|${JSON.stringify(e.params ?? {})}`).join('>')
      if (seen.has(k)) continue
      seen.add(k)
      chain.push(...lines)
    }
    chain.push({ key: 'why.only', params: { name: id, cell } })
    return chain
  }

  /** The cells a person could occupy considering ONLY their own clues (what the
   *  player sees highlighted when selecting them). */
  private clueCandidates(id: PersonId): Set<Cell> {
    const board = this.puzzle.board
    const person = this.puzzle.people().find((p) => p.id === id)
    let domain = new Set<Cell>(board.occupiableCells())
    for (const clue of person?.clues ?? []) {
      const cells = clue.candidateCells(board)
      if (cells) domain = new Set([...domain].filter((c) => cells.has(c)))
    }
    return domain
  }

  /** Initial per-person candidate sets from the clues. */
  private seedDomains(ctx: SolveContext): void {
    const occupiable = ctx.board.occupiableCells()
    for (const person of ctx.people) {
      const domain = new Set<Cell>(occupiable)
      for (const clue of person.clues) {
        const cells = clue.candidateCells(ctx.board)
        if (cells) {
          for (const cell of [...domain]) {
            if (!cells.has(cell)) domain.delete(cell)
          }
        }
      }
      ctx.state.setDomain(person.id, domain)
    }
  }

  private recordCandidates(ctx: SolveContext, steps: DeductionStep[]): void {
    for (const person of ctx.people) {
      if (person.clues.length === 0) continue
      steps.push({
        technique: 'clueCandidates',
        personId: person.id,
        candidates: [...ctx.state.domain(person.id)],
        explanation: {
          key: 'step.clueCandidates',
          params: { name: person.id, count: ctx.state.domain(person.id).size },
        },
      })
    }
  }

  private finish(
    steps: DeductionStep[],
    solution: Solution | null,
    solved: boolean,
  ): DeductionResult {
    const techniqueCounts: Record<string, number> = {}
    let maxRank = 0
    for (const step of steps) {
      techniqueCounts[step.technique] = (techniqueCounts[step.technique] ?? 0) + 1
      maxRank = Math.max(maxRank, TECHNIQUE_RANK[step.technique])
    }
    return { steps, solution, solved, difficulty: difficultyOf(maxRank), maxRank, techniqueCounts }
  }

  private identifyMurderer(solution: Solution): DeductionStep {
    const result = findMurderer(this.puzzle, solution)
    if (result.suspectId) {
      return {
        technique: 'murderer',
        personId: result.suspectId,
        explanation: {
          key: 'step.murderer',
          params: { name: result.suspectId, room: result.roomId },
        },
      }
    }
    return {
      technique: 'murderer',
      explanation: {
        key: 'step.murdererAmbiguous',
        params: { count: result.suspectsInRoom.length, room: result.roomId },
      },
    }
  }
}
