import { Technique } from "./Technique.ts";
import { InsideXorClue } from "../../clues/relationalClues.ts";
import { AndClue } from "../../clues/compositeClues.ts";
import type { Clue } from "../../clues/Clue.ts";
import type { SolveContext } from "../SolveContext.ts";
import type { DeductionStep } from "../DeductionStep.ts";
import type { PersonId } from "../../domain/types.ts";
import type { Puzzle } from "../../domain/Puzzle.ts";

/** Pull out insideXor clues, also from inside an AND. */
function insideXorClues(clue: Clue): InsideXorClue[] {
  if (clue instanceof InsideXorClue) return [clue];
  if (clue instanceof AndClue) return clue.clues.flatMap(insideXorClues);
  return [];
}

/**
 * "X and Y were one inside, one outside." Once one of them is pinned to a single
 * side (all their candidates indoor, or all outdoor), the other is forced to the
 * opposite side — a transparent step instead of a forcing chain.
 */
export class InsideXorTechnique extends Technique {
  readonly name = "insideXor";
  readonly difficulty = 3;

  override relevant(puzzle: Puzzle): boolean {
    return puzzle.suspects.some((s) => s.clues.flatMap(insideXorClues).length > 0);
  }

  apply(ctx: SolveContext): DeductionStep | null {
    for (const suspect of ctx.puzzle.suspects) {
      for (const clue of suspect.clues.flatMap(insideXorClues)) {
        const step =
          this.link(ctx, suspect.id, clue.target) ?? this.link(ctx, clue.target, suspect.id);
        if (step) return step;
      }
    }
    return null;
  }

  /** If `a` is confined to one side, force `b` off that side. */
  private link(ctx: SolveContext, a: PersonId, b: PersonId): DeductionStep | null {
    if (ctx.state.placed.has(b)) return null;
    const side = this.sideOf(ctx, a);
    if (side === null) return null;
    const removed = ctx.removeWhere(b, (c) => ctx.board.isOutside(c) === side);
    if (removed.length === 0) return null;
    return {
      technique: "insideXor",
      personId: b,
      eliminated: [{ personId: b, cells: removed }],
      explanation: {
        key: "step.insideXor",
        params: { name: b, other: a, otherSide: side ? "outside" : "inside" },
      },
    };
  }

  /** true = outside / false = inside if `id` is confined to one side, else null. */
  private sideOf(ctx: SolveContext, id: PersonId): boolean | null {
    let side: boolean | null = null;
    for (const cell of ctx.cellsOf(id)) {
      const out = ctx.board.isOutside(cell);
      if (side === null) side = out;
      else if (side !== out) return null;
    }
    return side;
  }
}
