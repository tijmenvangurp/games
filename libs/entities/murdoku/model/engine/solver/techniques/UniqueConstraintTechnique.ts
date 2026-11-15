import { Technique } from "./Technique.ts";
import type { SolveContext } from "../SolveContext.ts";
import type { DeductionStep, Elimination } from "../DeductionStep.ts";
import type { Puzzle } from "../../domain/Puzzle.ts";

/**
 * Propagates "only person …" clues (e.g. "only person on a carpet"): the cells
 * the subject monopolises are removed from everyone else.
 */
export class UniqueConstraintTechnique extends Technique {
  readonly name = "uniqueConstraint";
  readonly difficulty = 1;

  apply(ctx: SolveContext): DeductionStep | null {
    for (const suspect of ctx.puzzle.suspects) {
      for (const clue of suspect.clues) {
        const forbidden = clue.forbiddenForOthers(ctx.board);
        if (!forbidden) continue;
        const eliminated: Elimination[] = [];
        for (const other of ctx.state.unplaced()) {
          if (other === suspect.id) continue;
          const removed = ctx.removeWhere(other, (c) => forbidden.has(c));
          if (removed.length > 0) eliminated.push({ personId: other, cells: removed });
        }
        if (eliminated.length > 0) {
          return {
            technique: "uniqueConstraint",
            personId: suspect.id,
            eliminated,
            explanation: { key: "step.uniqueConstraint", params: { name: suspect.id } },
          };
        }
      }
    }
    return null;
  }

  override relevant(puzzle: Puzzle): boolean {
    for (const suspect of puzzle.suspects) {
      for (const clue of suspect.clues) {
        if (clue.forbiddenForOthers(puzzle.board)) return true;
      }
    }
    return false;
  }
}
