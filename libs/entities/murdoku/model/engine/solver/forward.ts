import { NakedSingleTechnique } from "./techniques/NakedSingleTechnique.ts";
import { UniqueConstraintTechnique } from "./techniques/UniqueConstraintTechnique.ts";
import { HiddenSingleTechnique } from "./techniques/HiddenSingleTechnique.ts";
import { ForcedCellTechnique } from "./techniques/ForcedCellTechnique.ts";
import { RelationalTechnique } from "./techniques/RelationalTechnique.ts";
import { SameObjectTechnique } from "./techniques/SameObjectTechnique.ts";
import { NakedGroupTechnique } from "./techniques/NakedGroupTechnique.ts";
import { CrossCenterTechnique } from "./techniques/CrossCenterTechnique.ts";
import { RectangleTechnique } from "./techniques/RectangleTechnique.ts";
import { InsideXorTechnique } from "./techniques/InsideXorTechnique.ts";
import { BoardCountTechnique } from "./techniques/BoardCountTechnique.ts";
import { ObjectPigeonholeTechnique } from "./techniques/ObjectPigeonholeTechnique.ts";
import { EmptyRoomsTechnique } from "./techniques/EmptyRoomsTechnique.ts";
import { RoomReasoningTechnique } from "./techniques/RoomReasoningTechnique.ts";
import { RoomCoverageTechnique } from "./techniques/RoomCoverageTechnique.ts";
import { RoomCapacityTechnique } from "./techniques/RoomCapacityTechnique.ts";
import { RoomBijectionTechnique } from "./techniques/RoomBijectionTechnique.ts";
import { RoomAssignmentTechnique } from "./techniques/RoomAssignmentTechnique.ts";
import { EmptyRoomForcingTechnique } from "./techniques/EmptyRoomForcingTechnique.ts";
import { GroupRoomTechnique } from "./techniques/GroupRoomTechnique.ts";
import { CompanionRoomFitTechnique } from "./techniques/CompanionRoomFitTechnique.ts";
import { CompanionPairingTechnique } from "./techniques/CompanionPairingTechnique.ts";
import { MurderTechnique } from "./techniques/MurderTechnique.ts";
import { CaseSplitTechnique } from "./techniques/CaseSplitTechnique.ts";
import { ForcingTechnique } from "./techniques/ForcingTechnique.ts";
import { SearchSolver } from "./SearchSolver.ts";
import type { Technique } from "./techniques/Technique.ts";
import type { SolveContext } from "./SolveContext.ts";
import type { DeductionStep } from "./DeductionStep.ts";
import type { Puzzle } from "../domain/Puzzle.ts";

/** Options for the technique pipeline. */
export interface TechniqueOptions {
  /**
   * Allow TRIAL-AND-ERROR reasoning — "assume X here → propagate → contradiction, so
   * not X" case splits plus the SAT-backed forcing fallback. OFF by default: the
   * player engine, the hints and the generator's acceptance bar are PURE forward +
   * CONVERGENT ("egal wo X → in jedem Fall raus") deduction a human can actually
   * follow, never a proof by contradiction (the user's explicit requirement). Dev
   * diagnostics turn it on to classify WHY a board would need trial-and-error.
   */
  contradiction?: boolean;
  /**
   * Drop ALL case-split reasoning (convergent + tight short contradiction) — leaving only
   * straight forward deduction. Used by the GENERATOR's acceptance bar so auto-generated
   * HARD levels never lean on any "Fallunterscheidung" (the user found it too frequent /
   * too deep for hand-solving). Players/hints keep the full pipeline so hand-made levels
   * that DO use a case split still get hints.
   */
  noCaseSplit?: boolean;
}

/**
 * The forward-deduction techniques relevant to this puzzle, easiest first. Each only
 * ever forces a placement or eliminates a provably-impossible cell — no guessing.
 * Irrelevant techniques are dropped so they add no per-node cost inside the search.
 * Shared by the hint engine and the search solver.
 *
 * The DEFAULT pipeline is human-logical: base rules + the CONVERGENT case split ("in
 * every case the same cells are out") + a TIGHT short contradiction (≤3 candidates, ≤3
 * obvious steps — the "if X sits here, someone has no place" a human does). It leaves out
 * the DEEP contradiction case split, the nested split and the forcing/SAT fallback — a
 * level that needs those is NOT human-solvable and is rejected by the generator.
 */
export function createForwardTechniques(puzzle: Puzzle, opts: TechniqueOptions = {}): Technique[] {
  const base: Technique[] = [
    new NakedSingleTechnique(),
    new UniqueConstraintTechnique(),
    new HiddenSingleTechnique("row"),
    new HiddenSingleTechnique("col"),
    new ForcedCellTechnique(),
    new RelationalTechnique(),
    new SameObjectTechnique(),
    new NakedGroupTechnique("row"),
    new NakedGroupTechnique("col"),
    new CrossCenterTechnique(),
    new RectangleTechnique(),
    new InsideXorTechnique(),
    new BoardCountTechnique(),
    new EmptyRoomsTechnique(),
    new RoomReasoningTechnique(),
    new RoomCoverageTechnique(),
    new RoomCapacityTechnique(),
    new RoomBijectionTechnique(),
    new GroupRoomTechnique(),
    new CompanionRoomFitTechnique(),
    new CompanionPairingTechnique(),
    new MurderTechnique(),
    // LAST: object pigeonhole runs only once the room/companion reasoning above has pinned
    // who is in which room (see the technique's note on ordering).
    new ObjectPigeonholeTechnique(),
  ].filter((technique) => technique.relevant(puzzle));
  const roomAssignment = new RoomAssignmentTechnique(); // pure forward, no look-ahead — shared
  // GENERATOR acceptance (noCaseSplit): the same forward techniques, but the empty-room
  // hypothesis may look only ~2 obvious steps ahead. The engine has NO human eye to judge
  // whether a longer chain is really followable, so an AUTO-generated "this room is empty"
  // argument must be SHALLOW — nobody thinks 5 steps deep; that would be guessing.
  if (opts.noCaseSplit) {
    const gen = [roomAssignment, new EmptyRoomForcingTechnique(base, 2)].filter((t) =>
      t.relevant(puzzle),
    );
    return [...base, ...gen];
  }
  // EDITOR / player / hints: a HAND-MADE level is vouched for by its author, so the (still
  // single-hypothesis) empty-room check may follow through further — enough for "Der leere
  // Raum" (~5 obvious steps). This is exactly why the editor can validate levels the
  // generator itself would never build.
  const forward = [roomAssignment, new EmptyRoomForcingTechnique(base, 8)].filter((technique) =>
    technique.relevant(puzzle),
  );
  const extended = [...base, ...forward];
  // Convergent case split: "egal wo X (2–3 Möglichkeiten) steht, diese Felder bleiben in
  // JEDEM Fall blockiert" — real deduction, no assumed-then-refuted guess. This is the
  // hardest reasoning a player is ever asked to do.
  const convergent = new CaseSplitTechnique(base, { convergentOnly: true });
  // Tight short contradiction (≤3 candidates, ≤3 obvious steps) — the human "if X sits
  // here, someone has no place left" the user explicitly allows; NOT deep trial-and-error.
  const tight = new CaseSplitTechnique(base, { tight: true });
  if (!opts.contradiction) return [...extended, convergent, tight];
  // Diagnostics only: the rejected trial-and-error tail — the contradiction case split,
  // its nested deep variant, and the exhaustive forcing fallback. Used to explain why a
  // board is NOT human-solvable, never for play or for accepting a level.
  return [
    ...extended,
    convergent,
    new CaseSplitTechnique(base, { depth: 1 }),
    new CaseSplitTechnique(base, { depth: 2 }),
    new ForcingTechnique(base, new SearchSolver(puzzle)),
  ];
}

/** Apply the techniques to a fixpoint, returning the steps taken (in order). */
export function propagate(ctx: SolveContext, techniques: Technique[]): DeductionStep[] {
  const steps: DeductionStep[] = [];
  let progress = true;
  while (progress && ctx.state.unplaced().length > 0) {
    progress = false;
    for (const technique of techniques) {
      const step = technique.apply(ctx);
      if (step) {
        steps.push(step);
        progress = true;
        break;
      }
    }
  }
  return steps;
}
