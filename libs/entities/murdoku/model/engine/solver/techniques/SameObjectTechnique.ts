import { Technique } from "./Technique.ts";
import { BesideSameObjectClue } from "../../clues/objectClues.ts";
import { AndClue } from "../../clues/compositeClues.ts";
import { inDirection8 } from "../../domain/types.ts";
import type { Clue } from "../../clues/Clue.ts";
import type { Cell, PersonId } from "../../domain/types.ts";
import type { SolveContext } from "../SolveContext.ts";
import type { DeductionStep } from "../DeductionStep.ts";
import type { Puzzle } from "../../domain/Puzzle.ts";

/** "Beside the same object as …" clues that are certain (top-level or inside an AND). */
function besideClues(clue: Clue): BesideSameObjectClue[] {
  if (clue instanceof BesideSameObjectClue) return [clue];
  if (clue instanceof AndClue) return clue.clues.flatMap(besideClues);
  return [];
}

/**
 * Forward reasoning for "{name} was beside the same object as {mate}" — the subject and a
 * mate (always a suspect) both stand beside ONE object instance.
 *
 *  - **Subject pruning (per cell):** a subject cell survives only if, beside some instance
 *    it touches, a possible mate can stand on a DIFFERENT cell (never the subject's own, and
 *    — in a full permutation — not in its row or column). This fixes the trap where the only
 *    "partner" spot is the subject's own cell (e.g. B's dining seat is beside a plant whose
 *    only other beside-cells no suspect can reach ⇒ B can't be there).
 *  - **Partner forcing:** once the subject is PLACED beside a determined instance and no one
 *    is there with them yet, if exactly ONE suspect can still take a partner cell, that
 *    suspect must — confine them to those cells. (B sits beside the study plant; only Apo can
 *    be its neighbour ⇒ Apo is pinned to that seat.)
 *  - **Named-mate pruning:** a named mate can only be beside an instance the subject reaches.
 *
 * All three only ever remove provably-impossible cells; the real solution always survives.
 */
export class SameObjectTechnique extends Technique {
  readonly name = "sameObject";
  readonly difficulty = 3;

  override relevant(puzzle: Puzzle): boolean {
    return puzzle.suspects.some((s) => s.clues.some((c) => besideClues(c).length > 0));
  }

  apply(ctx: SolveContext): DeductionStep | null {
    for (const suspect of ctx.puzzle.suspects) {
      for (const clue of suspect.clues.flatMap(besideClues)) {
        if (!ctx.state.placed.has(suspect.id)) {
          const pruned = this.pruneSubject(ctx, suspect.id, clue);
          if (pruned) return pruned;
        }
        const forced = this.forcePartner(ctx, suspect.id, clue);
        if (forced) return forced;
        const named = this.pruneNamedMate(ctx, suspect.id, clue);
        if (named) return named;
      }
    }
    return null;
  }

  /** Can `mate` stand on `d` as the partner of the subject sitting on `subjectCell`, beside
   *  the SAME instance? Different cell, distinct row & column in a full permutation, and — if
   *  the clue fixes a direction — the mate in that direction from the subject. */
  private validPartner(
    ctx: SolveContext,
    clue: BesideSameObjectClue,
    subjectCell: Cell,
    d: Cell,
  ): boolean {
    if (d === subjectCell) return false;
    const s = ctx.board.rc(subjectCell);
    const m = ctx.board.rc(d);
    if (ctx.fullPermutation && (s.row === m.row || s.col === m.col)) return false;
    if (clue.dir && !inDirection8(clue.dir, m, s)) return false;
    return true;
  }

  /** The beside-sets of instances the subject cell `c` touches. */
  private instancesBeside(besides: Set<Cell>[], c: Cell): Set<Cell>[] {
    return besides.filter((set) => set.has(c));
  }

  private pruneSubject(
    ctx: SolveContext,
    id: PersonId,
    clue: BesideSameObjectClue,
  ): DeductionStep | null {
    const besides = clue.besideSets(ctx.board);
    const mates = clue.mateIds(ctx.puzzle, id);
    const hasPartner = (c: Cell): boolean =>
      this.instancesBeside(besides, c).some((set) =>
        mates.some((mate) =>
          ctx.cellsOf(mate).some((d) => set.has(d) && this.validPartner(ctx, clue, c, d)),
        ),
      );
    const removed = ctx.removeWhere(id, (c) => !hasPartner(c));
    if (removed.length === 0) return null;
    return {
      technique: "sameObject",
      personId: id,
      eliminated: [{ personId: id, cells: removed }],
      explanation: { key: "step.sameObject", params: { name: id, objectNom: clue.object } },
    };
  }

  /** Subject is placed: the partner (someone beside the same instance) must exist. If exactly
   *  one suspect can still be that partner, confine them to the possible partner cells. */
  private forcePartner(
    ctx: SolveContext,
    id: PersonId,
    clue: BesideSameObjectClue,
  ): DeductionStep | null {
    const subjectCell = ctx.state.placed.get(id);
    if (subjectCell === undefined) return null;
    const besides = clue.besideSets(ctx.board);
    // Every valid partner cell beside an instance the placed subject touches.
    const partnerCells = new Set<Cell>();
    for (const set of this.instancesBeside(besides, subjectCell)) {
      for (const d of set) if (this.validPartner(ctx, clue, subjectCell, d)) partnerCells.add(d);
    }
    if (partnerCells.size === 0) return null;
    const mates = clue.mateIds(ctx.puzzle, id);
    // Already satisfied by a placed partner → nothing to force.
    if (
      mates.some((m) => {
        const p = ctx.state.placed.get(m);
        return p !== undefined && partnerCells.has(p);
      })
    )
      return null;
    const possible = mates.filter(
      (m) => !ctx.state.placed.has(m) && ctx.cellsOf(m).some((d) => partnerCells.has(d)),
    );
    if (possible.length !== 1) return null;
    const partner = possible[0];
    const removed = ctx.removeWhere(partner, (d) => !partnerCells.has(d));
    if (removed.length === 0) return null;
    return {
      technique: "sameObject",
      personId: partner,
      eliminated: [{ personId: partner, cells: removed }],
      explanation: {
        key: "step.sameObjectForce",
        params: { name: id, target: partner, objName: clue.object },
      },
    };
  }

  /** Symmetric pruning for a NAMED mate: they can only be beside an instance the subject
   *  can still reach (mirrors the subject pruning, cell-for-cell). */
  private pruneNamedMate(
    ctx: SolveContext,
    id: PersonId,
    clue: BesideSameObjectClue,
  ): DeductionStep | null {
    if (clue.mate.kind !== "person" || ctx.state.placed.has(clue.mate.of)) return null;
    const mate = clue.mate.of;
    const besides = clue.besideSets(ctx.board);
    const canReach = (d: Cell): boolean =>
      this.instancesBeside(besides, d).some((set) =>
        ctx.cellsOf(id).some((c) => set.has(c) && this.validPartner(ctx, clue, c, d)),
      );
    const removed = ctx.removeWhere(mate, (d) => !canReach(d));
    if (removed.length === 0) return null;
    return {
      technique: "sameObject",
      personId: mate,
      eliminated: [{ personId: mate, cells: removed }],
      explanation: { key: "step.sameObject", params: { name: mate, objectNom: clue.object } },
    };
  }
}
