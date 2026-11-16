import { Technique } from "./Technique.ts";
import type { SolveContext } from "../SolveContext.ts";
import type { DeductionStep, Elimination } from "../DeductionStep.ts";
import type { Cell, PersonId } from "../../domain/types.ts";

/** One branch of a case split: the assumed cell, the resulting state, and the SHORT
 *  chain of consequences (kept so a convergent hint can show WHY the cells fall away). */
interface Case {
  cell: Cell;
  trial: SolveContext;
  steps: DeductionStep[];
}

interface CaseSplitOptions {
  /** 1 = shallow split (base rules only); 2 = nests ONE depth-1 split per case. */
  depth?: 1 | 2;
  /** Internal: this split is itself nested inside another (tighter budget). */
  nested?: boolean;
  /**
   * Convergent-only mode — the ONLY case analysis a human is asked to do. It keeps
   * just the "wo sich alle Möglichkeiten überschneiden" elimination: for a person
   * with a HANDFUL of candidates, a cell impossible in EVERY case is impossible
   * outright ("egal wo Carol steht, Z8/S4 bleibt blockiert"). It NEVER eliminates a
   * candidate by running it into a contradiction ("Angenommen X → … → Widerspruch" —
   * that is trial-and-error, not deduction), and it SKIPS a person entirely if any of
   * its cases dies, so the argument never secretly hinges on a contradiction. Bounds
   * stay human-scale (a 2–3-way split, a few obvious steps per case).
   */
  convergentOnly?: boolean;
  /**
   * Tight contradiction mode — the SHORT "Angenommen X → … → jemand hat keinen Platz →
   * Widerspruch" a human actually does: ONLY for a person with ≤3 candidates left, and
   * only ≤3 obvious follow-up steps. Eliminates that candidate. Explicitly allowed by the
   * user as their own style ("sonst kein Platz für …"); it is NOT the deep trial-and-error
   * (that stays out). Sound: a contradiction within the bound is a real contradiction.
   */
  tight?: boolean;
}

/**
 * Short, human-style case analysis. Two flavours, chosen at construction:
 *
 *  - **convergentOnly** (the player + generator default): only the convergent
 *    "in every case the same cells are out" elimination — pure deduction a human can
 *    follow, never a proof by contradiction. See {@link CaseSplitOptions.convergentOnly}.
 *  - **full** (diagnostics only, `{ contradiction: true }` pipeline): additionally the
 *    contradiction flavour — for a candidate cell the base rules are propagated a
 *    BOUNDED number of steps on a copy, and a case that quickly hits a contradiction
 *    eliminates that candidate (with the readable chain). At `depth` 2 a case may nest
 *    ONE depth-1 split. Unlike forcing this never searches; the bound keeps every
 *    argument short. This flavour is what the user rejected for real play.
 */
export class CaseSplitTechnique extends Technique {
  readonly name: "caseSplit" | "caseSplitDeep";
  readonly difficulty: number;
  private readonly convergentOnly: boolean;
  private readonly tight: boolean;

  /** Intersect cases only for people with this many candidates or fewer. */
  private static readonly MAX_DOMAIN = 4;
  /** Convergent mode stays human-scale: at most a 3-way split ("egal wo X steht"). */
  private static readonly HUMAN_DOMAIN = 3;
  /** …and only TWO obvious consequences per case, so a human can actually verify that the
   *  same FEW cells fall away in every branch. (Deeper propagation cascades through half the
   *  board and produces a huge, unreadable "cross 25 cells" step — not a human deduction.) */
  private static readonly HUMAN_STEPS = 2;
  /** Tight contradiction mode: ≤3 candidates, ≤2 obvious follow-up steps (human-scale). */
  private static readonly TIGHT_DOMAIN = 3;
  private static readonly TIGHT_STEPS = 2;
  /** A convergent "egal wo X → raus" step may cross at most this many cells at once, so it
   *  stays a readable single deduction; the rest fall away in later (equally small) steps. */
  private static readonly CONVERGENT_CAP = 3;

  private readonly inner: Technique[];
  /** Total hypothetical placements per apply() — bounds the scan, smallest
   *  domains first (the cells a human would actually probe). */
  private readonly maxTrials: number;
  /** Propagation budget per case — keeps the chains short and followable. */
  private readonly maxSteps: number;
  /** Probe only people with this many candidates or fewer (null = everyone). */
  private readonly scanMaxDomain: number | null;

  constructor(base: Technique[], opts: CaseSplitOptions = {}) {
    super();
    const depth = opts.depth ?? 1;
    this.convergentOnly = opts.convergentOnly ?? false;
    this.tight = opts.tight ?? false;
    this.name = depth === 1 ? "caseSplit" : "caseSplitDeep";
    this.difficulty = depth === 1 ? 5 : 6;
    if (this.convergentOnly) {
      this.inner = base;
      this.maxTrials = 64;
      this.maxSteps = CaseSplitTechnique.HUMAN_STEPS;
      this.scanMaxDomain = CaseSplitTechnique.HUMAN_DOMAIN;
    } else if (opts.tight) {
      this.inner = base;
      this.maxTrials = 48;
      this.maxSteps = CaseSplitTechnique.TIGHT_STEPS;
      this.scanMaxDomain = CaseSplitTechnique.TIGHT_DOMAIN;
    } else if (depth === 2) {
      this.inner = [...base, new CaseSplitTechnique(base, { depth: 1, nested: true })];
      this.maxTrials = 16;
      this.maxSteps = 24;
      this.scanMaxDomain = CaseSplitTechnique.MAX_DOMAIN;
    } else {
      this.inner = base;
      this.maxTrials = opts.nested ? 32 : 96;
      this.maxSteps = opts.nested ? 16 : 32;
      this.scanMaxDomain = null;
    }
  }

  apply(ctx: SolveContext): DeductionStep | null {
    const byConstraint = [...ctx.state.unplaced()]
      .filter((id) => {
        const size = ctx.state.domain(id).size;
        return size >= 2 && (this.scanMaxDomain === null || size <= this.scanMaxDomain);
      })
      .sort((a, b) => ctx.state.domain(a).size - ctx.state.domain(b).size);

    // Phase 1: probe candidates (most-constrained people first, budgeted). In the full
    // pipeline a case that dies quickly eliminates that candidate by contradiction; the
    // convergent pipeline never does this — it only notes the surviving cases for phase 2.
    const survivors = new Map<PersonId, Case[]>();
    let trials = 0;
    for (const id of byConstraint) {
      const cells = [...ctx.state.domain(id)];
      if (trials + cells.length > this.maxTrials) break;
      trials += cells.length;
      const cases: Case[] = [];
      let someCaseDied = false;
      for (const cell of cells) {
        const trial = ctx.clone();
        trial.place(id, cell);
        const { steps, dead } = this.propagateBounded(trial);
        if (dead) {
          if (!this.convergentOnly) {
            const removed = ctx.removeWhere(id, (c) => c === cell);
            const consequences = [...steps.map((s) => s.explanation), dead];
            // Tight (player-facing) mode reads as a SHORT positive deduction — "{name} can't
            // be on {cell}, because that would leave someone with no spot" — no "assume … →
            // contradiction" framing. The diagnostic pipeline keeps the explicit framing.
            return {
              technique: this.name,
              personId: id,
              eliminated: [{ personId: id, cells: removed }],
              explanation: this.tight
                ? { key: "step.shortExclude", params: { name: id, cell } }
                : { key: "step.caseSplitContradiction", params: { name: id, cell } },
              chain: this.tight
                ? consequences
                : [{ key: "step.assume", params: { name: id, cell } }, ...consequences],
            };
          }
          // Convergent: a dead branch would mean "X can't be here" — a contradiction
          // elimination. We are not allowed to use it, so this person is off-limits for
          // a clean "egal wo X" argument this round.
          someCaseDied = true;
        }
        cases.push({ cell, trial, steps });
      }
      // Convergent: intersect inline (all cases must be alive); the full pipeline
      // collects few-candidate people for the phase-2 pass below.
      if (this.convergentOnly) {
        if (!someCaseDied) {
          const step = this.intersect(ctx, id, cases);
          if (step) return step;
        }
        continue;
      }
      if (cells.length <= CaseSplitTechnique.MAX_DOMAIN) survivors.set(id, cases);
    }

    // Phase 2 (full pipeline): for the few-candidate people, eliminate whatever is
    // impossible in every surviving case.
    for (const [id, cases] of survivors) {
      const step = this.intersect(ctx, id, cases);
      if (step) return step;
    }
    return null;
  }

  /** Eliminate the cells impossible in EVERY case of `id`'s split. In convergent (player-
   *  facing) mode at most CONVERGENT_CAP DISTINCT cells are crossed per step, so the hint
   *  stays a readable "egal wo X → these few raus"; the rest follow in later small steps. */
  private intersect(ctx: SolveContext, id: PersonId, cases: Case[]): DeductionStep | null {
    const found: { other: PersonId; cells: Cell[] }[] = [];
    const distinct = new Set<Cell>();
    for (const other of ctx.state.unplaced()) {
      if (other === id) continue;
      const impossible = [...ctx.state.domain(other)].filter((cell) =>
        cases.every(({ trial }) => {
          const placed = trial.state.placed.get(other);
          return placed !== undefined ? placed !== cell : !trial.state.domain(other).has(cell);
        }),
      );
      if (impossible.length > 0) {
        found.push({ other, cells: impossible });
        for (const c of impossible) distinct.add(c);
      }
    }
    if (distinct.size === 0) return null;

    const allowed =
      this.convergentOnly && distinct.size > CaseSplitTechnique.CONVERGENT_CAP
        ? new Set([...distinct].slice(0, CaseSplitTechnique.CONVERGENT_CAP))
        : null;
    const eliminated: Elimination[] = [];
    for (const { other, cells } of found) {
      const target = allowed ? cells.filter((c) => allowed.has(c)) : cells;
      if (target.length === 0) continue;
      const removed = ctx.removeWhere(other, (c) => target.includes(c));
      if (removed.length > 0) eliminated.push({ personId: other, cells: removed });
    }
    if (eliminated.length === 0) return null;
    return {
      technique: this.name,
      personId: id,
      eliminated,
      explanation: { key: "step.caseSplitCommon", params: { name: id, count: cases.length } },
      // Convergent (player-facing): show BOTH branches and their short consequences, so the
      // player can see the crossed cells really fall away no matter where `id` stands.
      chain: this.convergentOnly
        ? cases.flatMap((c) => [
            { key: "why.caseAssume", params: { name: id, cell: c.cell } },
            ...c.steps.map((s) => s.explanation),
          ])
        : undefined,
    };
  }

  /** Propagate the rules on a copy, stopping at a contradiction, a fixpoint,
   *  or the step budget (so every case stays a SHORT argument). */
  private propagateBounded(trial: SolveContext): {
    steps: DeductionStep[];
    dead: ReturnType<SolveContext["deadReason"]>;
  } {
    const steps: DeductionStep[] = [];
    for (;;) {
      const dead = trial.deadReason();
      if (dead) return { steps, dead };
      if (steps.length >= this.maxSteps) return { steps, dead: null };
      let progressed = false;
      for (const technique of this.inner) {
        const step = technique.apply(trial);
        if (step) {
          steps.push(step);
          progressed = true;
          break;
        }
      }
      if (!progressed) return { steps, dead: null };
    }
  }
}
