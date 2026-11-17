import { Technique } from "./Technique.ts";
import { CountOnObjectClue } from "../../clues/boardClues.ts";
import type { SolveContext } from "../SolveContext.ts";
import type { DeductionStep, Elimination } from "../DeductionStep.ts";
import type { Puzzle } from "../../domain/Puzzle.ts";

/**
 * Board clue "exactly N people on <object>" (e.g. one person on a mud puddle):
 *  - once N are already guaranteed on the object, nobody else may be on it;
 *  - if exactly N people CAN still be on it, each of them is confined to it.
 * Both are transparent steps that the forcing search would otherwise discover slowly.
 */
export class BoardCountTechnique extends Technique {
  readonly name = "boardCount";
  readonly difficulty = 4;

  override relevant(puzzle: Puzzle): boolean {
    return puzzle.boardClues.some((c) => c instanceof CountOnObjectClue);
  }

  apply(ctx: SolveContext): DeductionStep | null {
    for (const clue of ctx.puzzle.boardClues) {
      if (!(clue instanceof CountOnObjectClue)) continue;
      const step = this.applyCount(ctx, clue.object, clue.count);
      if (step) return step;
    }
    return null;
  }

  private applyCount(ctx: SolveContext, object: string, n: number): DeductionStep | null {
    const cells = ctx.board.cellsWithObject(object);
    if (cells.size === 0) return null;
    let placedOn = 0;
    for (const c of ctx.state.placed.values()) if (cells.has(c)) placedOn++;
    const unplaced = ctx.state.unplaced();
    const guaranteed = unplaced.filter((id) =>
      [...ctx.state.domain(id)].every((c) => cells.has(c)),
    );

    // (1) the count is already met → no one else may be on the object.
    if (placedOn + guaranteed.length === n) {
      const eliminated: Elimination[] = [];
      for (const id of unplaced) {
        if (guaranteed.includes(id)) continue;
        const removed = ctx.removeWhere(id, (c) => cells.has(c));
        if (removed.length > 0) eliminated.push({ personId: id, cells: removed });
      }
      if (eliminated.length > 0) {
        return {
          technique: "boardCount",
          eliminated,
          explanation: { key: "step.boardCountFull", params: { count: n, object } },
        };
      }
    }

    // (2) exactly as many people can still be on the object as are needed → confine.
    const need = n - placedOn;
    if (need > 0) {
      const possible = unplaced.filter((id) => [...ctx.state.domain(id)].some((c) => cells.has(c)));
      if (possible.length === need) {
        for (const id of possible) {
          const removed = ctx.removeWhere(id, (c) => !cells.has(c));
          if (removed.length > 0) {
            return {
              technique: "boardCount",
              personId: id,
              eliminated: [{ personId: id, cells: removed }],
              explanation: {
                key: "step.boardCountConfine",
                params: { name: id, object, count: need },
              },
            };
          }
        }
      }
    }

    // (3) LINE COVER — the still-reachable object cells occupy exactly `need` distinct rows
    //   (or columns). Each row/column holds at most one person, so the `need` remaining
    //   on-object people fill exactly those lines, one each, every one ON an object cell →
    //   every NON-object cell of those lines is empty. Covers both "all beds in ONE row +
    //   1 on a bed ⇒ that row's occupant is on a bed" AND "2 on a bed with beds spread over
    //   two rows ⇒ each of those rows' occupants is on a bed" (the Der-Maulwurf case).
    //   Sound without a full permutation: the exactly-`need` on-object people are pinned to
    //   distinct lines and there are exactly `need` candidate lines → a forced bijection.
    if (need > 0) {
      const reachable = new Set<number>();
      for (const id of unplaced)
        for (const c of ctx.state.domain(id)) if (cells.has(c)) reachable.add(c);
      for (const axis of ["row", "col"] as const) {
        const lines = new Set([...reachable].map((c) => ctx.board.rc(c)[axis]));
        if (lines.size !== need) continue;
        const eliminated: Elimination[] = [];
        for (const id of unplaced) {
          const removed = ctx.removeWhere(
            id,
            (c) => lines.has(ctx.board.rc(c)[axis]) && !cells.has(c),
          );
          if (removed.length > 0) eliminated.push({ personId: id, cells: removed });
        }
        if (eliminated.length > 0) {
          return {
            technique: "boardCount",
            eliminated,
            explanation:
              lines.size === 1
                ? {
                    key: "step.boardCountLine",
                    params: { object, line: axis, num: [...lines][0] + 1 },
                  }
                : {
                    key: "step.boardCountLines",
                    params: { object, linePlural: axis, count: need },
                  },
          };
        }
      }
    }
    return null;
  }
}
