import { Technique } from "./Technique.ts";
import type { Axis, SolveContext } from "../SolveContext.ts";
import type { DeductionStep, Elimination } from "../DeductionStep.ts";
import type { Cell } from "../../domain/types.ts";

/**
 * In a full permutation every row and column holds exactly one person. If a line
 * (row or column) has only ONE still-open cell, SOMEBODY must stand there — so the
 * PERPENDICULAR line through that cell is taken too, and every other cell of that
 * perpendicular line is dead for everyone. ("Zeile 1 hat nur noch Z1/S8 frei → dort
 * muss jemand stehen → Spalte 8 ist belegt → restliche S8-Felder streichen.")
 *
 * The dual of the hidden single (which keys on the only PERSON for a line); this one
 * keys on the only CELL. Pure, transparent forward logic — no trial.
 */
export class ForcedCellTechnique extends Technique {
  readonly name = "forcedCell";
  readonly difficulty = 1;

  apply(ctx: SolveContext): DeductionStep | null {
    if (!ctx.fullPermutation) return null;
    for (const axis of ["row", "col"] as Axis[]) {
      const span = axis === "row" ? ctx.board.height : ctx.board.width;
      const used = ctx.usedLines(axis);
      for (let line = 0; line < span; line++) {
        if (used.has(line)) continue;
        // Open cells in this line: occupiable cells still in some unplaced person's domain.
        const open = new Set<Cell>();
        for (const id of ctx.state.unplaced()) {
          for (const c of ctx.state.domain(id)) if (ctx.axisOf(c, axis) === line) open.add(c);
        }
        if (open.size !== 1) continue;
        const cell = [...open][0];
        const perp: Axis = axis === "row" ? "col" : "row";
        const perpLine = ctx.axisOf(cell, perp);

        // The occupant of `cell` consumes its perpendicular line → drop every other cell
        // of that line from everyone (the cell itself stays for whoever ends up there).
        const eliminated: Elimination[] = [];
        for (const id of ctx.state.unplaced()) {
          const removed = ctx.removeWhere(
            id,
            (c) => c !== cell && ctx.axisOf(c, perp) === perpLine,
          );
          if (removed.length > 0) eliminated.push({ personId: id, cells: removed });
        }
        if (eliminated.length > 0) {
          return {
            technique: "forcedCell",
            eliminated,
            explanation: {
              key: axis === "row" ? "step.forcedCellRow" : "step.forcedCellCol",
              params: { cell, line: line + 1, perpLine: perpLine + 1 },
            },
          };
        }
      }
    }
    return null;
  }
}
